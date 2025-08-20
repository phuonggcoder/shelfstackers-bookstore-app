const express = require('express');
const Address = require('../model/address');
const auth = require('../middleware/auth');
const axios = require('axios');
const router = express.Router();

// Configuration for OAPI
const API_CONFIG = {
  OAPI: {
    BASE_URL: 'https://open.oapi.vn/location',
    TIMEOUT: 10000,
    HEADERS: {
      'Accept': 'application/json',
      'Accept-Language': 'vi'
    }
  }
};

// Simple cache for provinces/districts/wards
const DEFAULT_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
let cache = {
    provinces: { data: null, timestamp: 0 },
    districts: {},
    wards: {},
    searchAll: { data: null, timestamp: 0 }
};

const isCacheExpired = (timestamp) => Date.now() - timestamp > DEFAULT_CACHE_DURATION;

const createOAPIRequest = (endpoint, params = {}) => {
    return axios.get(`${API_CONFIG.OAPI.BASE_URL}${endpoint}`, {
        params,
        timeout: API_CONFIG.OAPI.TIMEOUT,
        headers: API_CONFIG.OAPI.HEADERS
    });
};

const retryOAPIRequest = async (endpoint, params = {}, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`[OAPI] Attempt ${attempt}/${maxRetries} for ${endpoint}`);
            const response = await createOAPIRequest(endpoint, params);
            console.log(`[OAPI] Success on attempt ${attempt}`);
            return response;
        } catch (error) {
            console.error(`[OAPI] Attempt ${attempt} failed:`, error.message);
            if (attempt === maxRetries) throw error;
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
};

// ... Minimal helper implementations omitted for brevity in this standalone file ...

// Get all addresses for current user
router.get('/', auth, async (req, res) => {
  try {
    const addresses = await Address.find({ user_id: req.user.sub });
    res.json({ success: true, data: addresses });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch addresses' });
  }
});

// Get address by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const address = await Address.findOne({ _id: req.params.id, user_id: req.user.sub });
    if (!address) return res.status(404).json({ success: false, message: 'Address not found' });
    res.json({ success: true, data: address });
  } catch (error) {
    console.error('Error fetching address:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch address' });
  }
});

// Create new address
router.post('/', auth, async (req, res) => {
  try {
    // Debug: log incoming request to help FE/BE integration
    try {
      console.log('[DEBUG] POST /api/addresses headers:', { authorization: req.headers.authorization });
      console.log('[DEBUG] POST /api/addresses body:', JSON.stringify(req.body));
      console.log('[DEBUG] POST /api/addresses isDraft:', req.body && (req.body.isDraft === true || req.body.isDraft === 'true'));
    } catch (e) {
      console.error('[DEBUG] Failed to print debug info for create address', e);
    }

  const fullName = req.body.fullName || req.body.name || req.body.receiver_name;
  const phone = req.body.phone || req.body.phone_number;
  // Important change: do NOT auto-fill 'street' with osm.displayName or fullAddress from map.
  // The frontend should keep the street/building input separate. We will parse osm.raw.address and
  // set only house_number + road into `street` when FE did not provide a street.
  let street = req.body.street || req.body.address_detail || null;
  const isDefault = req.body.isDefault !== undefined ? req.body.isDefault : req.body.is_default;
  // Allow filling admin units from osm.raw only when FE hasn't provided them
  let province = req.body.province;
  let district = req.body.district;
  let ward = req.body.ward;

    const isDraft = req.body.isDraft === true || req.body.isDraft === 'true' || false;

    // If FE provided osm.raw (Nominatim) we extract house_number + road and minimal admin units
    try {
      if (req.body.osm && req.body.osm.raw && typeof req.body.osm.raw === 'object') {
        const raw = req.body.osm.raw;
        const addr = raw.address || raw;
        const osmRoad = addr.road || addr.street || addr.pedestrian || addr.cycleway || null;
        const osmHouse = addr.house_number || addr.house || null;
        const osmProvince = addr.state || addr.city || addr.region || null;
        const osmDistrict = addr.city_district || addr.county || addr.suburb || null;
        const osmWard = addr.suburb || addr.village || addr.hamlet || addr.neighbourhood || null;
        console.log('[DEBUG] Parsed osm.raw.address ->', { osmHouse, osmRoad, osmWard, osmDistrict, osmProvince });

        // Only set street if FE didn't send one. Do NOT set street to display_name or amenity (e.g. school).
        if ((!street || street === null) && (osmHouse || osmRoad)) {
          street = osmHouse ? `${osmHouse} ${osmRoad || ''}`.trim() : osmRoad;
        }

        // Fill admin units only when missing from FE payload; keep FE-provided objects untouched.
        if ((!province || Object.keys(province).length === 0) && osmProvince) {
          province = { name: osmProvince };
        }
        if ((!district || Object.keys(district).length === 0) && osmDistrict) {
          district = { name: osmDistrict };
        }
        if ((!ward || Object.keys(ward).length === 0) && osmWard) {
          ward = { name: osmWard };
        }
      }
    } catch (e) {
      console.warn('[DEBUG] Failed to parse req.body.osm.raw', e && e.message);
    }

    if (!isDraft) {
      const missingFields = [];
      if (!fullName) missingFields.push('fullName');
      if (!phone) missingFields.push('phone');
      if (!street) missingFields.push('street');

      const hasWard = Boolean(ward && (ward.code || ward.id || ward.name));
      const hasProvince = Boolean(province && (province.code || province.name || province.id));

      if (!hasWard && !hasProvince) missingFields.push('ward or province');

      if (missingFields.length > 0) {
        return res.status(400).json({ success: false, message: 'Missing required fields: ' + missingFields.join(', '), missingFields });
      }
    }

    if (isDefault) {
      await Address.updateMany({ user_id: req.user.sub, isDefault: true }, { $set: { isDefault: false } });
    }

    // Build address payload. Note: we intentionally do not populate 'street' from osm.displayName.
    const addressPayload = {
      user_id: req.user.sub,
      fullName,
      phone,
      province,
      district,
      ward,
      street,
      isDefault: Boolean(isDefault),
      adminType: 'new',
      isDraft: Boolean(isDraft)
    };

    // Accept osm and location payloads from FE (map selection). Use osm.displayName for fullAddress only when street is missing.
    if (req.body.osm) {
      addressPayload.osm = req.body.osm;
      if (!addressPayload.fullAddress) {
        addressPayload.fullAddress = req.body.osm.displayName || null;
      }
    }
    if (req.body.location) {
      addressPayload.location = req.body.location;
    }

    const address = new Address(addressPayload);
    await address.save();
    res.status(201).json({ success: true, data: address, message: 'Address created successfully' });
  } catch (error) {
    console.error('Error creating address:', error);
    let status = 500; let message = 'Failed to create address';
    if (error.message && error.message.includes('Missing required address fields')) { status = 400; message = error.message; }
    res.status(status).json({ success: false, message, error: error.message, stack: error.stack });
  }
});

// Update address
router.put('/:id', auth, async (req, res) => {
  try {
    const { isDefault, ...updates } = req.body;
    const requiredFields = ['fullName', 'phone', 'province', 'ward', 'street'];
    const missingFields = [];
    for (const field of requiredFields) {
      if (updates.hasOwnProperty(field) && (!updates[field] || updates[field] === '')) missingFields.push(field);
    }
    if (missingFields.length > 0) return res.status(400).json({ success: false, message: 'Missing required fields: ' + missingFields.join(', '), missingFields });

    if (isDefault) await Address.updateMany({ user_id: req.user.sub, isDefault: true }, { $set: { isDefault: false } });

    const address = await Address.findOneAndUpdate({ _id: req.params.id, user_id: req.user.sub }, { ...updates, ...(isDefault !== undefined ? { isDefault } : {}) }, { new: true, runValidators: true });
    if (!address) return res.status(404).json({ success: false, message: 'Address not found' });
    res.json({ success: true, data: address, message: 'Address updated successfully' });
  } catch (error) {
    console.error('Error updating address:', error);
    let status = 500; let message = 'Failed to update address';
    if (error.message && error.message.includes('Missing required address fields')) { status = 400; message = error.message; }
    res.status(status).json({ success: false, message });
  }
});

// Delete address
router.delete('/:id', auth, async (req, res) => {
  try {
    const address = await Address.findOneAndDelete({ _id: req.params.id, user_id: req.user.sub });
    if (!address) return res.status(404).json({ success: false, message: 'Address not found' });
    if (address.isDefault) {
      const anotherAddress = await Address.findOne({ user_id: req.user.sub });
      if (anotherAddress) { anotherAddress.isDefault = true; await anotherAddress.save(); }
    }
    res.json({ success: true, message: 'Address deleted successfully' });
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({ success: false, message: 'Failed to delete address' });
  }
});

// Finalize draft address: PATCH /api/addresses/:id/finalize
router.patch('/:id/finalize', auth, async (req, res) => {
  try {
    const userId = req.user.sub;
    const id = req.params.id;
    const patch = req.body || {};

    const addr = await Address.findOne({ _id: id, user_id: userId });
    if (!addr) return res.status(404).json({ success: false, message: 'Address not found' });

    Object.assign(addr, patch);
    addr.isDraft = false;

    await addr.validate();
    const saved = await addr.save();
    return res.json({ success: true, message: 'Address finalized', data: saved });
  } catch (err) {
    console.error('Finalize draft error', err);
    return res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
