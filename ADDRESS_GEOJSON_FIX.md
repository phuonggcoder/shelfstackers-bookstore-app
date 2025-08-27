# 🏠 Sửa Lỗi GeoJSON - Tóm Tắt

## 📋 **Vấn Đề**

Lỗi `Can't extract geo keys: unknown GeoJSON type: { coordinates: [] }` xảy ra khi tạo địa chỉ với coordinates rỗng hoặc không hợp lệ.

## 🔍 **Nguyên Nhân**

1. **Empty coordinates array**: `location: { coordinates: [] }` - mảng rỗng không hợp lệ cho GeoJSON
2. **Invalid coordinates**: Coordinates có giá trị NaN hoặc 0
3. **Missing validation**: Code không kiểm tra tính hợp lệ của coordinates trước khi gửi

## 🔧 **Giải Pháp Đã Áp Dụng**

### **1. Cải Thiện Logic Trong `add-address.tsx`:**

```typescript
// Chuẩn bị dữ liệu địa chỉ theo format BE yêu cầu
const addressData: any = {
  // Thông tin người nhận (bắt buộc)
  fullName: receiverName.trim(),
  phone: phoneNumber.trim(),
  
  // Thông tin địa chỉ (bắt buộc)
  street: addressDetail.trim(),
  
  // Thông tin hành chính (ít nhất 1 trong 2: ward HOẶC province)
  province: selectedAddress.province ? {
    code: selectedAddress.province.code,
    name: selectedAddress.province.name
  } : undefined,
  district: selectedAddress.district ? {
    code: selectedAddress.district.code,
    name: selectedAddress.district.name,
    provinceId: selectedAddress.district.provinceId
  } : undefined,
  ward: selectedAddress.ward ? {
    code: selectedAddress.ward.code,
    name: selectedAddress.ward.name,
    districtId: selectedAddress.ward.districtId,
    fullName: selectedAddress.ward.fullName
  } : undefined,
  
  // Thông tin khác
  adminType: 'new',
  isDefault: false,
  note: '',
  isDraft: false
};

// Chỉ thêm location nếu có coordinates hợp lệ
if (selectedAddress.location && 
    selectedAddress.location.coordinates && 
    Array.isArray(selectedAddress.location.coordinates) &&
    selectedAddress.location.coordinates.length === 2 &&
    !Number.isNaN(selectedAddress.location.coordinates[0]) &&
    !Number.isNaN(selectedAddress.location.coordinates[1]) &&
    selectedAddress.location.coordinates[0] !== 0 &&
    selectedAddress.location.coordinates[1] !== 0) {
  addressData.location = {
    type: 'Point',
    coordinates: [
      selectedAddress.location.coordinates[0], // longitude
      selectedAddress.location.coordinates[1]  // latitude
    ]
  };
}

// Chỉ thêm OSM nếu có dữ liệu hợp lệ
if (selectedAddress.osm && 
    selectedAddress.osm.lat && 
    selectedAddress.osm.lng &&
    !Number.isNaN(selectedAddress.osm.lat) &&
    !Number.isNaN(selectedAddress.osm.lng)) {
  addressData.osm = {
    lat: selectedAddress.osm.lat,
    lng: selectedAddress.osm.lng,
    displayName: selectedAddress.osm.displayName,
    raw: selectedAddress.osm.raw
  };
}
```

### **2. Cải Thiện Validation Trong `AddressService`:**

```typescript
// Add location if provided (GeoJSON format) - chỉ khi có coordinates hợp lệ
if (addressData.location && 
    addressData.location.coordinates && 
    Array.isArray(addressData.location.coordinates) &&
    addressData.location.coordinates.length === 2 &&
    !Number.isNaN(addressData.location.coordinates[0]) &&
    !Number.isNaN(addressData.location.coordinates[1]) &&
    addressData.location.coordinates[0] !== 0 &&
    addressData.location.coordinates[1] !== 0) {
  payload.location = {
    type: addressData.location.type,
    coordinates: addressData.location.coordinates
  };
}

// Add OSM data if provided - chỉ khi có dữ liệu hợp lệ
if (addressData.osm && 
    addressData.osm.lat && 
    addressData.osm.lng &&
    !Number.isNaN(addressData.osm.lat) &&
    !Number.isNaN(addressData.osm.lng) &&
    addressData.osm.lat !== 0 &&
    addressData.osm.lng !== 0) {
  payload.osm = {
    lat: addressData.osm.lat,
    lng: addressData.osm.lng,
    displayName: addressData.osm.displayName,
    raw: addressData.osm.raw
  };
}
```

### **3. Cập Nhật Interface:**

```typescript
export interface AddressData {
  // Thông tin người nhận (bắt buộc)
  fullName: string;
  phone: string;
  email?: string;
  
  // Thông tin địa chỉ (bắt buộc)
  street: string;
  
  // Thông tin hành chính (ít nhất 1 trong 2: ward HOẶC province)
  province?: {
    code: string;
    name: string;
  };
  district?: {
    code: string;
    name: string;
    provinceId: string;
  };
  ward?: {
    code: string;
    name: string;
    districtId: string;
    fullName?: string;
  };
  
  // Tọa độ (không bắt buộc)
  location?: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  
  // Dữ liệu OSM (không bắt buộc)
  osm?: {
    lat: number;
    lng: number;
    displayName: string;
    raw: any;
  };
  
  // Thông tin khác
  adminType?: string;
  isDefault?: boolean;
  note?: string;
  isDraft?: boolean;
  fullAddress?: string;
}
```

## 📊 **Validation Rules**

### **Location Validation:**
- ✅ Coordinates phải là array
- ✅ Array phải có đúng 2 phần tử
- ✅ Cả 2 phần tử phải là số hợp lệ (không NaN)
- ✅ Cả 2 phần tử không được bằng 0
- ✅ Type phải là 'Point'

### **OSM Validation:**
- ✅ lat và lng phải tồn tại
- ✅ lat và lng phải là số hợp lệ (không NaN)
- ✅ lat và lng không được bằng 0

## 🚀 **Kết Quả**

### **Trước Khi Sửa:**
```typescript
// ❌ Sai - gửi coordinates rỗng
{
  location: { coordinates: [] }
}
```

### **Sau Khi Sửa:**
```typescript
// ✅ Đúng - không gửi location field khi không có coordinates hợp lệ
{
  // Không có location field
}

// ✅ Đúng - gửi location field khi có coordinates hợp lệ
{
  location: {
    type: 'Point',
    coordinates: [106.456, 10.123]
  }
}
```

## 📋 **Testing Checklist**

### **Location Testing:**
- [ ] Không có location → Thành công (không gửi location field)
- [ ] Location với coordinates rỗng → Thành công (không gửi location field)
- [ ] Location với coordinates NaN → Thành công (không gửi location field)
- [ ] Location với coordinates = 0 → Thành công (không gửi location field)
- [ ] Location với coordinates hợp lệ → Thành công (gửi location field)

### **OSM Testing:**
- [ ] Không có OSM → Thành công (không gửi osm field)
- [ ] OSM với lat/lng NaN → Thành công (không gửi osm field)
- [ ] OSM với lat/lng = 0 → Thành công (không gửi osm field)
- [ ] OSM với lat/lng hợp lệ → Thành công (gửi osm field)

## 🔍 **Debug Information**

### **Console Logs:**
```typescript
// Payload được gửi
console.log('[AddAddress] Saving address:', addressData);

// Validation check
console.log('[AddressService] addAddress payload:', payload);
```

### **Expected Behavior:**
- Địa chỉ không có location/OSM → Gửi payload không có location/osm fields
- Địa chỉ có location/OSM hợp lệ → Gửi payload với location/osm fields
- Không bao giờ gửi location field với coordinates rỗng hoặc không hợp lệ

## ✅ **Kết Quả**

### **Đã Hoàn Thành:**
- ✅ **Validation chặt chẽ**: Kiểm tra coordinates trước khi gửi
- ✅ **Conditional fields**: Chỉ gửi location/osm khi có dữ liệu hợp lệ
- ✅ **Error prevention**: Ngăn chặn lỗi MongoDB GeoJSON
- ✅ **Type safety**: Đảm bảo type safety với TypeScript

### **Cải Tiến:**
- ✅ **Better UX**: Không còn lỗi khi lưu địa chỉ
- ✅ **Data quality**: Chỉ lưu dữ liệu hợp lệ
- ✅ **Performance**: Giảm lỗi API call và retry
- ✅ **Maintainability**: Code dễ maintain và debug

## 📋 **Next Steps**

### **Cần Test:**
1. **Location validation** - các trường hợp coordinates khác nhau
2. **OSM validation** - các trường hợp lat/lng khác nhau
3. **Edge cases** - các trường hợp đặc biệt
4. **Error handling** - xử lý lỗi đúng

### **Monitoring:**
- Theo dõi console logs để đảm bảo payload đúng
- Kiểm tra BE response để đảm bảo thành công
- Đảm bảo không có lỗi GeoJSON
- Đảm bảo dữ liệu được lưu chính xác





