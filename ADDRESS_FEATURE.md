# Hướng dẫn sử dụng chức năng địa chỉ

## Tổng quan

Chức năng địa chỉ đã được tích hợp vào trang order review, cho phép người dùng:
- Chọn địa chỉ giao hàng từ danh sách đã lưu
- Thêm địa chỉ mới với autocomplete cho tỉnh/huyện/xã
- Quản lý địa chỉ mặc định

## Các file đã tạo/cập nhật

### 1. Services
- `services/addressService.ts` - API service cho địa chỉ

### 2. Components
- `components/AddressSelector.tsx` - Modal chọn địa chỉ
- `app/select-location.tsx` - Màn hình chọn tỉnh/huyện/xã
- `app/add-address.tsx` - Màn hình thêm địa chỉ mới

### 3. Pages
- `app/order-review.tsx` - Đã tích hợp chức năng địa chỉ

## Cách hoạt động

### 1. Trong trang Order Review
- Khi chưa có địa chỉ: Hiển thị nút "Thêm địa chỉ giao hàng"
- Khi đã có địa chỉ: Hiển thị địa chỉ mặc định và nút "Chỉnh sửa"

### 2. Thêm địa chỉ mới
1. Click "Thêm địa chỉ" → Chuyển đến `/add-address`
2. Nhập thông tin người nhận
3. Chọn địa chỉ từng bước:
   - Chọn Tỉnh/Thành phố → `/select-location?level=province`
   - Chọn Quận/Huyện → `/select-location?level=district&provinceCode=...`
   - Chọn Phường/Xã → `/select-location?level=ward&districtCode=...`
4. Nhập địa chỉ chi tiết
5. Chọn loại địa chỉ (Nhà riêng/Văn phòng)
6. Đặt làm địa chỉ mặc định (tùy chọn)
7. Lưu địa chỉ

### 3. Chọn địa chỉ từ danh sách
1. Click "Chỉnh sửa" → Mở modal AddressSelector
2. Chọn địa chỉ từ danh sách
3. Hoặc click "Thêm địa chỉ mới" để tạo địa chỉ mới

## API Endpoints

### Autocomplete APIs
```
GET /autocomplete/province?q={search}
GET /autocomplete/district?province_code={code}&q={search}
GET /autocomplete/ward?district_code={code}&q={search}
```

### Address CRUD APIs
```
POST /addresses - Tạo địa chỉ mới
GET /addresses - Lấy danh sách địa chỉ
PUT /addresses/{id} - Cập nhật địa chỉ
DELETE /addresses/{id} - Xóa địa chỉ
```

## Cấu trúc dữ liệu

### LocationItem
```typescript
{
  code: string;
  name: string;
}
```

### Address
```typescript
{
  _id: string;
  receiver_name: string;
  phone_number: string;
  province: string;
  district: string;
  ward: string;
  address_detail: string;
  is_default: boolean;
  type: 'office' | 'home';
}
```

## Tính năng nổi bật

1. **Autocomplete địa chỉ**: Tìm kiếm nhanh tỉnh/huyện/xã
2. **Validation**: Kiểm tra đầy đủ thông tin trước khi lưu
3. **Preview địa chỉ**: Hiển thị địa chỉ đã chọn trước khi lưu
4. **Địa chỉ mặc định**: Tự động chọn địa chỉ mặc định
5. **UI/UX thân thiện**: Giao diện đẹp, dễ sử dụng

## Lưu ý

1. Cần đăng nhập để sử dụng chức năng địa chỉ
2. Dữ liệu địa chỉ được lưu tạm thời trong AsyncStorage khi chọn
3. Địa chỉ mặc định sẽ được tự động chọn khi load trang
4. Có thể thêm nhiều địa chỉ và chọn địa chỉ phù hợp cho từng đơn hàng 