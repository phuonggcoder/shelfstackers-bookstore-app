Mục tiêu

Mô tả thay đổi cần thiết trên backend để chấp nhận "draft" (map-only) address từ frontend:
- Cho phép FE gửi chỉ vị trí (lat,lng) + dữ liệu OSM (display_name, raw) và lưu tạm mà không cần fullname/phone/street.
- Trường `isDraft` (boolean) để phân biệt draft vs final.
- Lưu field `location` (GeoJSON Point) và `osm` (raw payload + display_name).
- Validation "bắt buộc" chỉ áp dụng khi `isDraft` === false.
- Cung cấp endpoint để finalize một draft (patch đầy đủ thông tin và set isDraft=false).

Tôi chuẩn bị các đoạn code mẫu (Mongoose + Express controller + tests) bạn có thể dán vào repo backend.

1) Mongoose schema (address.js) — patch mẫu

Thêm/điều chỉnh schema để hỗ trợ `isDraft`, `location`, `osm` và validation conditional.

```js
// models/address.js (mẫu)
const mongoose = require('mongoose');

const AddressSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fullName: { type: String },
  phone: { type: String },
  street: { type: String },
  province: { type: Object },
  district: { type: Object },
  ward: { type: Object },

  // Draft/map fields
  isDraft: { type: Boolean, default: false, index: true },
  osm: {
    lat: Number,
    lng: Number,
    displayName: String,
    raw: Object
  },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], index: '2dsphere' } // [lng, lat]
  },

  fullAddress: { type: String },
  isDefault: { type: Boolean, default: false },
  adminType: { type: String, default: 'new' },
  autocomplete34: { type: Object },
  note: { type: String },
}, { timestamps: true });

// Pre-save middleware: enforce required fields only for non-drafts
AddressSchema.pre('validate', function(next) {
  if (!this.isDraft) {
    if (!this.fullName) return next(new Error('fullName required for non-draft'));
    if (!this.phone) return next(new Error('phone required for non-draft'));
    if (!this.street) return next(new Error('street required for non-draft'));
    if (!this.province || !this.district || !this.ward) return next(new Error('province/district/ward required for non-draft'));
  }
  // If this is draft and osm.displayName exists, prefer it for fullAddress (helps preview)
  if (this.isDraft && this.osm && this.osm.displayName && !this.fullAddress) {
    this.fullAddress = this.osm.displayName;
  }

  // If location is not set but osm lat/lng provided, set location
  if (this.osm && (this.osm.lat || this.osm.lng) && (!this.location || !this.location.coordinates || this.location.coordinates.length !== 2)) {
    const lat = Number(this.osm.lat);
    const lng = Number(this.osm.lng);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      this.location = { type: 'Point', coordinates: [lng, lat] };
    }
  }

  next();
});

module.exports = mongoose.model('Address', AddressSchema);
```

2) Controller: create + finalize endpoints (express)

```js
// controllers/addressController.js (mẫu)
const Address = require('../models/address');

exports.createAddress = async (req, res) => {
  try {
    const userId = req.user._id; // assumes auth middleware
    const body = req.body;

    const address = new Address({ ...body, user_id: userId });
    await address.validate(); // will run conditional validation
    const saved = await address.save();
    return res.status(201).json({ success: true, message: 'Address created successfully', data: saved });
  } catch (err) {
    console.error('Create address error', err);
    return res.status(400).json({ success: false, message: err.message });
  }
};

// Finalize draft: PATCH /api/addresses/:id/finalize
exports.finalizeDraft = async (req, res) => {
  try {
    const userId = req.user._id;
    const id = req.params.id;
    const patch = req.body; // expect fullname, phone, street, province/district/ward etc.

    const addr = await Address.findOne({ _id: id, user_id: userId });
    if (!addr) return res.status(404).json({ success: false, message: 'Address not found' });

    Object.assign(addr, patch);
    addr.isDraft = false; // finalize
    await addr.validate();
    const saved = await addr.save();
    return res.json({ success: true, message: 'Address finalized', data: saved });
  } catch (err) {
    console.error('Finalize draft error', err);
    return res.status(400).json({ success: false, message: err.message });
  }
};
```

3) Route wiring (express routes)

```js
// routes/address.js
const express = require('express');
const router = express.Router();
const addressController = require('../controllers/addressController');
const auth = require('../middleware/auth');

router.post('/addresses', auth, addressController.createAddress);
router.patch('/addresses/:id/finalize', auth, addressController.finalizeDraft);

module.exports = router;
```

4) Example payloads

- Map-only draft (what FE will send after map selection):

```json
POST /api/addresses
Authorization: Bearer <token>
{
  "isDraft": true,
  "osm": {
    "lat": 10.876138375335827,
    "lng": 106.63640141487123,
    "displayName": "Trần Thị Bảy, Tân Thới Hiệp, Phường Tân Thới Hiệp, Thành phố Hồ Chí Minh, 71716, Việt Nam",
    "raw": { /* full nominatim payload */ }
  }
}
```

- Finalize draft (user completes fields):

```json
PATCH /api/addresses/68a5957097c7cedf56ee0c15/finalize
Authorization: Bearer <token>
{
  "fullName": "Nguyen Van A",
  "phone": "0912345678",
  "street": "12 Trần Thị Bảy",
  "province": { "code": "...", "name": "..." },
  "district": { "code": "...", "name": "..." },
  "ward": { "code": "...", "name": "..." }
}
```

5) Tests (jest + supertest) — minimal

```js
// tests/address.draft.test.js
const request = require('supertest');
const app = require('../app'); // express app

describe('Address draft flow', () => {
  let token = null;
  beforeAll(async () => {
    // sign in test user or create fixture user and obtain token
    token = await signInTestUser();
  });

  it('creates a draft address from map', async () => {
    const payload = { isDraft: true, osm: { lat: 10.1, lng: 106.1, displayName: 'Foo' } };
    const res = await request(app).post('/api/addresses').set('Authorization', `Bearer ${token}`).send(payload);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isDraft).toBe(true);
    expect(res.body.data.location).toBeDefined();
  });

  it('finalizes a draft', async () => {
    const createRes = await request(app).post('/api/addresses').set('Authorization', `Bearer ${token}`).send({ isDraft: true, osm: { lat: 10.1, lng: 106.1, displayName: 'Foo' } });
    const id = createRes.body.data._id;
    const finalizePayload = { fullName: 'Abc', phone: '0912345678', street: '1 Xyz', province: { code: 'x', name: 'X' }, district: { code: 'y', name: 'Y' }, ward: { code: 'z', name: 'Z' } };
    const finalRes = await request(app).patch(`/api/addresses/${id}/finalize`).set('Authorization', `Bearer ${token}`).send(finalizePayload);
    expect(finalRes.status).toBe(200);
    expect(finalRes.body.data.isDraft).toBe(false);
    expect(finalRes.body.data.fullAddress).toContain('1 Xyz');
  });
});
```

6) Notes and caveats

- Make sure CORS and body parsing on the server allow the `osm.raw` payload or trim it if it's too large.
- If you have a schema migration or existing code that assumes `fullAddress` always exists, adjust it for drafts.
- Keep `isDefault` uniqueness logic unchanged (only one default); drafts should not affect the default-selection invariant unless you explicitly allow it.
- Consider adding an endpoint that lists drafts for a user so the FE can show "Saved map selections".

7) Next steps I can do for you now
- A: Generate a ready-to-apply git patch/diff for the backend `models/address.js`, `controllers/addressController.js`, and `routes/address.js` (you'll need to provide the backend repo or paste file contents).
- B: Produce a tiny PR-ready branch tarball (requires backend repo access).
- C: Add example curl commands and Postman collection (I can create `docs/address-draft-postman.json`).
- D: Create the unit test file and CI hints (I included a sample above), and optionally wire it to your CI instructions.

Chọn A/B/C/D hoặc yêu cầu chỉnh sửa chi tiết nào, tôi sẽ tiếp tục và tạo patch/PR nội dung tương ứng.
