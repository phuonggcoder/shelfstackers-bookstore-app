const express = require('express');
const router = express.Router();
const Address = require('../models/address');
const auth = require('../middleware/auth');
const validateAddress = require('../middleware/validateAddress');

// Get all addresses for current user
router.get('/', auth, async (req, res) => {
  try {
    const addresses = await Address.find({ user_id: req.user.sub });
    res.json({
      success: true,
      data: addresses
    });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch addresses'
    });
  }
});

// Get address by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const address = await Address.findOne({
      _id: req.params.id,
      user_id: req.user.sub
    });
    
    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }
    
    res.json({
      success: true,
      data: address
    });
  } catch (error) {
    console.error('Error fetching address:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch address'
    });
  }
});

// Create new address
router.post('/', auth, validateAddress, async (req, res) => {
  try {
    const {
      fullName,
      phone,
      street,
      province,
      district,
      ward,
      isDefault,
      note
    } = req.body;

    // If setting as default, unset any existing default
    if (isDefault) {
      await Address.updateMany(
        { user_id: req.user.sub },
        { isDefault: false }
      );
    }

    const address = new Address({
      user_id: req.user.sub,
      fullName,
      phone,
      street,
      province,
      district,
      ward,
      isDefault: Boolean(isDefault),
      note
    });

    await address.save();

    res.status(201).json({
      success: true,
      data: address,
      message: 'Address created successfully'
    });
  } catch (error) {
    console.error('Error creating address:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create address',
      error: error.message
    });
  }
});

// Update address
router.put('/:id', auth, validateAddress, async (req, res) => {
  try {
    const {
      fullName,
      phone,
      street,
      province,
      district,
      ward,
      isDefault,
      note
    } = req.body;

    // If setting as default, unset any existing default
    if (isDefault) {
      await Address.updateMany(
        { user_id: req.user.sub, _id: { $ne: req.params.id } },
        { isDefault: false }
      );
    }

    const address = await Address.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user.sub },
      {
        fullName,
        phone,
        street,
        province,
        district,
        ward,
        isDefault,
        note
      },
      { new: true, runValidators: true }
    );

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    res.json({
      success: true,
      data: address,
      message: 'Address updated successfully'
    });
  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update address',
      error: error.message
    });
  }
});

// Delete address
router.delete('/:id', auth, async (req, res) => {
  try {
    const address = await Address.findOneAndDelete({
      _id: req.params.id,
      user_id: req.user.sub
    });
    
    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }
    
    // If the deleted address was default, set another one as default if available
    if (address.isDefault) {
      const anotherAddress = await Address.findOne({ user_id: req.user.sub });
      if (anotherAddress) {
        anotherAddress.isDefault = true;
        await anotherAddress.save();
      }
    }
    
    res.json({
      success: true,
      message: 'Address deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete address'
    });
  }
});

module.exports = router;
