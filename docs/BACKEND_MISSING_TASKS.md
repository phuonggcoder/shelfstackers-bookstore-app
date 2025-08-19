# Hướng dẫn: Các thiếu sót (BE) cần thực hiện để hỗ trợ FE

Mục tiêu: liệt kê các endpoint, payload và hành vi backend còn thiếu hoặc cần hoàn thiện để frontend (map picker, autocomplete địa chỉ, thêm địa chỉ, PayOS) hoạt động chính xác.

## Tóm tắt nhanh (checklist)
- [ ] POST /api/payments/create — endpoint tạo payment cho PayOS (FE gọi trước khi redirect/payment)
- [ ] Các endpoint địa chỉ chuẩn: `GET /api/v1/address/provinces`, `GET /api/v1/address/districts?province-code=...`, `GET /api/v1/address/wards?districtId=...`
- [ ] `GET /api/v1/address/search-all?q=...` — tìm nhanh province/district/ward cho autocomplete
- [ ] (Tùy chọn) `POST /api/v1/address/reverse` hoặc proxy cho Nominatim để FE gọi reverse-geocode; trả về cấu trúc chuẩn
- [ ] POST /api/addresses — chấp nhận payload add-address từ FE (province/district/ward objects + optional location)
- [ ] Kiểm tra/validate phone, required fields, trả về lỗi rõ ràng cho FE
- [ ] Tài liệu contract + ví dụ request/response (bên dưới)
- [ ] Unit & integration tests cho các endpoint phía trên
- [ ] Caching & rate-limiting cho các endpoint địa chỉ/reverse (chống bị throttled hoặc khóa IP khi dùng Nominatim)

## 1) POST /api/payments/create (PayOS)
Mục đích: FE gọi để backend tạo payment session / order ở PayOS, backend trả về object chứa URL hoặc id để FE xử lý.

Yêu cầu input (JSON):

```
{
  "orderId": "string",        // id order nội bộ
  "amount": 12345,             // số tiền tính theo đơn vị nhỏ nhất (vd: đồng)
  "currency": "VND",         // chuỗi
  "returnUrl": "https://...",// FE callback sau thanh toán
  "metadata": { ... }          // optional
}
```

Response 200 (ví dụ):

```
{
  "status": "ok",
  "paymentId": "payos_abc123",
  "paymentUrl": "https://payos.example/checkout/xyz",
  "expiresAt": "2025-08-19T12:34:56Z"
}
```

Errors: trả về mã HTTP thích hợp (400 cho invalid payload, 401 nếu auth required, 502/503 nếu upstream PayOS lỗi). Log chi tiết cho debugging.

Notes:
- Lưu secret PayOS key trong biến môi trường, không để trong code.
- Trả về thông tin đủ để FE hiển thị hoặc redirect (URL hoặc data để tạo QR/iframe).

## 2) API địa chỉ (provinces/districts/wards)
Các endpoint phải trả mảng object có shape giống FE mong đợi (xem `services/addressService.ts`):

Province shape:
```
{ code: string, name: string, type?: string, typeText?: string, slug?: string, autocompleteType?: 'oapi' }
```
District shape:
```
{ code: string, name: string, provinceId: string, type?: string, typeText?: string }
```
Ward shape:
```
{ code: string, name: string, districtId: string, type?: string, typeText?: string, fullName?: string, path?: string }
```

Behaviour:
- `GET /api/v1/address/provinces` trả mảng provinces
- `GET /api/v1/address/districts?province-code=XXX` trả mảng districts
- `GET /api/v1/address/wards?districtId=YYY` trả mảng wards
- Hỗ trợ param `q` cho lọc text (autocomplete)
- Response chuẩn hoá: { data: [...] } hoặc mảng trực tiếp (FE hiện hỗ trợ cả 2), nhưng tốt nhất giữ consistent.

## 3) Search / autocomplete
Endpoint: `GET /api/v1/address/search-all?q=...`
- Trả về items có level = 'province'|'district'|'ward' và parentInfo để FE có thể hiển thị
Ví dụ response:

```
[
  { code: '79', name: 'Hồ Chí Minh', level: 'province', displayText: 'Hồ Chí Minh' },
  { code: '760', name: 'Quận 1', level: 'district', displayText: 'Quận 1, Hồ Chí Minh', parentInfo: { province: { code:'79', name:'Hồ Chí Minh' } } },
  ...
]
```

## 4) Reverse geocode (map -> admin units)
Hai lựa chọn:
- A: Backend cung cấp `POST /api/v1/address/reverse` (body: { lat, lng }) -> Trang bị proxy tới Nominatim hoặc Vietmap và trả về chuẩn JSON gồm: display_name, address (object), plus mapped province/district/ward codes if tìm được.
- B: FE gọi Nominatim trực tiếp (hiện FE dùng Nominatim) — nếu giữ cách này, backend không bắt buộc nhưng cần có cờ cảnh báo rate-limit & caching.

Response ví dụ (backend proxy):

```
{
  "display_name": "...",
  "address": { "state": "Ho Chi Minh", "city": "Ho Chi Minh", "suburb": "Cau Ong Lanh", ... },
  "resolved": {
    "province": { code: '79', name: 'Hồ Chí Minh' },
    "district": { code: '760', name: 'Quận 1' },
    "ward": { code: '76001', name: 'Phường X' }
  }
}
```

Implementation notes:
- Để FE dễ xử lý, cố gắng trả `resolved` khi backend có khả năng map tên -> code (gọi internal DB hoặc search endpoints).
- Nếu không tìm được `resolved`, trả `address` raw từ Nominatim để FE sử dụng fallback tên.
- Cache reverse results for coordinates (tile-based key or rounded coords) để giảm lượt gọi Nominatim.

## 5) POST /api/addresses (tạo address từ FE)
FE hiện gửi payload giống mẫu sau (từ `add-address.tsx`):

```
{
  "fullName": "Nguyen Van A",
  "phone": "09xxxxxxxx",
  "street": "Số 1, Nguyễn Văn Cừ",
  "province": { code: '79', name: 'Hồ Chí Minh' },
  "district": { code: '760', name: 'Quận 1', provinceId: '79' },
  "ward": { code: '76001', name: 'Phường X', districtId: '760' },
  "isDefault": false,
  "type": "home",
  "location": { "lat": 10.7629, "lng": 106.6820 }   // optional
}
```

Server must:
- Validate required fields and phone format; trả lỗi 400 với message nội dung khi không hợp lệ.
- Nếu `province/district/ward` chỉ có tên (fallback), cố gắng resolve code bằng lookup hoặc trả warning nhưng vẫn lưu nếu chấp nhận được.
- Lưu `location` (lat/lng) nếu có, add index (spatial) nếu cần cho tìm kiếm gần.
# Hướng dẫn BE để hỗ trợ FE (address, autocomplete, map reverse, PayOS)

Mục tiêu: liệt kê các endpoint, payload và hành vi backend cần thực hiện hoặc hoàn thiện để frontend (map picker, autocomplete địa chỉ, thêm địa chỉ, PayOS) hoạt động chính xác.

## Tóm tắt nhanh (checklist)
- [ ] `POST /api/payments/create` — endpoint tạo payment cho PayOS (FE gọi trước khi redirect/payment)
- [ ] Các endpoint địa chỉ chuẩn: `GET /api/v1/address/provinces`, `GET /api/v1/address/districts?province-code=...`, `GET /api/v1/address/wards?districtId=...`
- [ ] `GET /api/v1/address/search-all?q=...` — tìm nhanh province/district/ward cho autocomplete
- [ ] (Tùy chọn) `POST /api/v1/address/reverse` — proxy/reverse-geocode (Nominatim/Vietmap) trả về cấu trúc chuẩn
- [ ] `POST /api/addresses` — chấp nhận payload add-address từ FE (province/district/ward objects + optional location)
- [ ] Validate phone, required fields, trả về lỗi rõ ràng cho FE
- [ ] Document contract + ví dụ request/response
- [ ] Unit & integration tests cho các endpoint phía trên
- [ ] Caching & rate-limiting cho các endpoint địa chỉ/reverse

---

## 1) POST /api/payments/create (PAYOS)

Mục đích: FE gọi để backend tạo session / order trong PayOS. Backend trả về object chứa URL hoặc ID để FE xử lý (mở WebView, redirect hoặc tạo QR).

Request (JSON):
```json
{
  "orderId": "string",     
  "amount": 12345,          
  "currency": "VND",
  "returnUrl": "https://...", 
  "metadata": { }
}
```

Response 200 (ví dụ):
```json
{
  "status": "ok",
  "paymentId": "payos_abc123",
  "paymentUrl": "https://payos.example/checkout/xyz",
  "expiresAt": "2025-08-19T12:34:56Z"
}
```

Errors: trả về HTTP 400 (invalid payload), 401 (auth) nếu cần, 502/503 nếu upstream PayOS lỗi. Ghi log chi tiết.

Notes cài đặt:
- Lưu PAYOS secrets trong env vars (PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY).
- Hỗ trợ trả về checkout URL hoặc hẹn trả QR data.
- Kiểm tra order tồn tại và ở trạng thái hợp lệ trước khi tạo payment (ví dụ order_status === 'Pending').
- Map response sang shape FE mong đợi.

---

## 2) API địa chỉ (provinces/districts/wards)

FE mong đợi shape cụ thể (tham khảo `services/addressService.ts`):

Province shape:
```json
{ "code": "string", "name": "string", "type": "string?", "typeText": "string?", "slug": "string?", "autocompleteType": "oapi" }
```

District shape:
```json
{ "code": "string", "name": "string", "provinceId": "string", "type": "string?", "typeText": "string?" }
```

Ward shape:
```json
{ "code": "string", "name": "string", "districtId": "string", "type": "string?", "typeText": "string?", "fullName": "string?", "path": "string?" }
```

Endpoints & behavior:
- `GET /api/v1/address/provinces` -> trả mảng provinces
- `GET /api/v1/address/districts?province-code=XXX` -> trả mảng districts thuộc province
- `GET /api/v1/address/wards?districtId=YYY` -> trả mảng wards thuộc district
- Hỗ trợ `q` query param cho text filter (autocomplete)
- Response: tốt nhất chuẩn hoá `{"data": [...]}` nhưng FE hiện hỗ trợ cả array trực tiếp. Pick one and keep consistent.

Performance:
- Cache provinces/districts/wards (memory hoặc Redis) để tránh đọc đĩa/mongo quá nhiều.
- Set TTL hợp lý khi dữ liệu có thể thay đổi.

---

## 3) Search / Autocomplete

Endpoint: `GET /api/v1/address/search-all?q=...`
- Trả về items với field `level: 'province'|'district'|'ward'` và `parentInfo` để FE hiển thị.

Example response:
```json
[
  { "code": "79", "name": "Hồ Chí Minh", "level": "province", "displayText": "Hồ Chí Minh" },
  { "code": "760", "name": "Quận 1", "level": "district", "displayText": "Quận 1, Hồ Chí Minh", "parentInfo": { "province": { "code": "79", "name": "Hồ Chí Minh" } } }
]
```

Implementation notes:
- Use simple text-match + startsWith + contains logic for responsive autocomplete.
- Limit results (e.g., 20).
- Normalize diacritics and case for matching.

---

## 4) Reverse geocode (map -> admin units)

Hai lựa chọn:
- A: Backend cung cấp `POST /api/v1/address/reverse` (body: `{ lat, lng }`) làm proxy tới Nominatim/VietMap -> trả chuẩn JSON gồm display_name, address, resolved (province/district/ward codes nếu tìm được).
- B: FE gọi Nominatim trực tiếp (hiện FE dùng Nominatim). Nếu chọn B, backend không bắt buộc nhưng cần cảnh báo rate-limit & caching.

Proxy response example:
```json
{
  "display_name": "...",
  "address": { "state": "Ho Chi Minh", "city": "Ho Chi Minh", ... },
  "resolved": {
    "province": { "code": "79", "name": "Hồ Chí Minh" },
    "district": { "code": "760", "name": "Quận 1" },
    "ward": { "code": "76001", "name": "Phường X" }
  }
}
```

Implementation notes:
- Call Nominatim/Vietmap; parse `address` object and attempt to map names to internal codes via lookup.
- Cache responses by rounded coords (e.g., lat/lng rounded to 4-5 decimals) or by tile key to reduce calls.
- Respect upstream provider TOS (Nominatim forbids heavy automated calls from single IP). Consider self-hosting or paid provider.

---

## 5) POST /api/addresses (tạo address từ FE)

FE payload example (from `add-address.tsx`):
```json
{
  "fullName": "Nguyen Van A",
  "phone": "09xxxxxxxx",
  "street": "Số 1, Nguyễn Văn Cừ",
  "province": { "code": "79", "name": "Hồ Chí Minh" },
  "district": { "code": "760", "name": "Quận 1", "provinceId": "79" },
  "ward": { "code": "76001", "name": "Phường X", "districtId": "760" },
  "isDefault": false,
  "type": "home",
  "location": { "lat": 10.7629, "lng": 106.6820 }
}
```

Server must:
- Validate required fields and phone format; trả lỗi 400 với message rõ ràng nếu không hợp lệ.
- Nếu province/district/ward cung cấp chỉ name (không có code), cố gắng resolve code hoặc trả warning.
- Lưu embedded objects (code, name, typeText) vào UserAddresses collection.
- Lưu `location` nếu có; tạo spatial index nếu cần.
- Trả về object mới tạo kèm id.

Auth: endpoint yêu cầu token (user must be authenticated).

---

## 6) DB / Schema notes

- Provinces table: `code` (PK), `name`, `slug`, `type`
- Districts: `code` (PK), `name`, `provinceId` (FK)
- Wards: `code` (PK), `name`, `districtId` (FK)
- UserAddresses: store embedded `province`, `district`, `ward` objects and `location` { lat, lng }

- Recommendation: keep admin unit codes as strings to match official codes.

---

## 7) Tests

- Unit tests per endpoint: happy path, invalid payload, upstream failure (mock PayOS/Nominatim)
- Integration test: create order -> POST /api/payments/create -> ensure PayOS link returned -> simulate callback/webhook
- Reverse mapping tests: provide Nominatim sample payloads and assert correct `resolved` mapping to codes
- Address create tests: validate phone, missing fields, and geo saved correctly

---

## 8) Performance & production concerns

- Cache provinces/districts/wards in memory or Redis.
- Rate-limit reverse and search endpoints (esp. if proxying Nominatim).
- Consider exposing pre-built JSON files for FE to download (if acceptable) to reduce runtime queries.
- Monitor errors and upstream response latencies; log request IDs.

---

## 9) Security & env

- Store keys in env vars: PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY, VIETMAP_KEY.
- CORS: whitelist FE origins or proxy via same origin.
- Auth: `POST /api/addresses` requires auth; address GETs can be public but rate-limited.
- Sanitize inputs, especially for reverse proxy to prevent SSRF.

---

## 10) Example cURL

Create PayOS payment:
```bash
curl -X POST "https://your-backend.example.com/api/payments/create" \
  -H "Content-Type: application/json" \
  -d '{"orderId":"ord-123","amount":100000,"currency":"VND","returnUrl":"myapp://pay-return"}'
```

Reverse geocode (proxy):
```bash
curl -X POST "https://your-backend.example.com/api/v1/address/reverse" \
  -H "Content-Type: application/json" \
  -d '{"lat":10.7629,"lng":106.6820}'
```

Create address:
```bash
curl -X POST "https://your-backend.example.com/api/addresses" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Nguyen A","phone":"0901234567","street":"...","province":{"code":"79","name":"Hồ Chí Minh"},"district":{"code":"760","name":"Quận 1"},"ward":{"code":"76001","name":"Phường X"},"location":{"lat":10.76,"lng":106.68}}'
```

---

## 11) Troubleshooting & logging

- Log upstream responses (PayOS, Nominatim) with request IDs and errors.
- When FE reports parse errors, inspect raw Nominatim `address` object keys: `state`, `county`, `city_district`, `city`, `town`, `suburb`, `village`, `hamlet`, `neighbourhood`.

---

## 12) Prioritized next steps
1. Implement `POST /api/payments/create` (PayOS flow) and ensure mobile gets JSON (done earlier in this repo).  
2. Ensure provinces/districts/wards endpoints exist and return canonical shapes.  
3. Implement `/api/v1/address/reverse` proxy with caching/resolution.  
4. Add tests for add-address and reverse-to-code mapping.  
5. Deploy with proper env keys and rate-limiting.

---

## 13) OpenAPI / Stubs (optional)
Tôi có thể sinh OpenAPI JSON/YAML stubs cho các endpoint trên để backend devs scaffold nhanh. Muốn tôi tạo không?

---

File created by developer guide generator.
