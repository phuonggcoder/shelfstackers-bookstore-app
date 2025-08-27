# 🏠 Hệ Thống Địa Chỉ Mới - Tóm Tắt

## 📋 **Tổng Quan**

Đã tạo lại hệ thống địa chỉ theo yêu cầu với 2 bước chính:
1. **Chọn Province/District/Ward** (Location + Autocomplete)
2. **Nhập địa chỉ chi tiết** (Map + Autocomplete)

## 🎯 **Bước 1: Chọn Province/District/Ward**

### **File:** `app/address-selection.tsx`

#### **Chức năng:**
- ✅ **Location Detection**: Lấy vị trí hiện tại và tự động xác định province/district/ward
- ✅ **Autocomplete Search**: Tìm kiếm với gợi ý real-time
- ✅ **Step-by-step Selection**: Chọn từng bước: Province → District → Ward
- ✅ **Progress Indicator**: Hiển thị tiến trình chọn
- ✅ **Rate Limiting**: Giới hạn 1 request/giây cho Nominatim API

#### **Flow:**
1. **Location Button**: Lấy GPS và reverse geocoding
2. **Search Input**: Tìm kiếm với autocomplete
3. **Selection**: Chọn từ danh sách gợi ý
4. **Progress**: Chuyển sang bước tiếp theo
5. **Complete**: Chuyển sang trang địa chỉ chi tiết

#### **API Endpoints:**
```typescript
// Reverse geocoding
https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1

// Search provinces
https://nominatim.openstreetmap.org/search?format=jsonv2&q=${query}, Vietnam&countrycodes=vn&limit=10&addressdetails=1

// Search districts
https://nominatim.openstreetmap.org/search?format=jsonv2&q=${query}, ${province}, Vietnam&countrycodes=vn&limit=10&addressdetails=1

// Search wards
https://nominatim.openstreetmap.org/search?format=jsonv2&q=${query}, ${district}, Vietnam&countrycodes=vn&limit=10&addressdetails=1
```

## 🎯 **Bước 2: Địa Chỉ Chi Tiết**

### **File:** `app/address-detail.tsx`

#### **Chức năng:**
- ✅ **Map Integration**: Hiển thị bản đồ OpenStreetMap
- ✅ **Ward-based Search**: Tìm kiếm trong phạm vi ward đã chọn
- ✅ **Current Location**: Lấy vị trí hiện tại với kiểm tra phạm vi
- ✅ **Marker Selection**: Chọn vị trí từ marker trên bản đồ
- ✅ **Address Autocomplete**: Gợi ý địa chỉ dựa trên ward/district/province
- ✅ **Coordinate Extraction**: Lấy tọa độ từ vị trí chọn

#### **Flow:**
1. **Initialize**: Load ward center coordinates
2. **Map Display**: Hiển thị bản đồ ở vị trí ward
3. **Address Input**: Nhập địa chỉ chi tiết với autocomplete
4. **Map Interaction**: Chọn vị trí từ bản đồ
5. **Location Button**: Lấy vị trí hiện tại
6. **Confirm**: Tạo địa chỉ theo format yêu cầu

#### **API Endpoints:**
```typescript
// Ward center coordinates
https://nominatim.openstreetmap.org/search?format=jsonv2&q=${ward}, ${district}, ${province}&countrycodes=vn&limit=1&addressdetails=1

// Address search within ward
https://nominatim.openstreetmap.org/search?format=jsonv2&q=${query}, ${ward}, ${district}, ${province}&countrycodes=vn&limit=10&addressdetails=1&bounded=1

// Reverse geocoding for current location
https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1
```

## 📊 **Format Dữ Liệu Đầu Ra**

### **Địa Chỉ Hoàn Chỉnh:**
```typescript
{
  // Thông tin người nhận
  fullName: string,        // ✅ Bắt buộc
  phone: string,           // ✅ Bắt buộc
  email: string,           // ❌ Không bắt buộc
  
  // Thông tin địa chỉ
  street: string,          // ✅ Bắt buộc (số nhà, tên đường)
  
  // Thông tin hành chính
  ward: {                  // ✅ Bắt buộc
    code: string,
    name: string,
    districtId: string,
    fullName: string
  },
  province: {              // ✅ Bắt buộc
    code: string,
    name: string
  },
  district: {              // ❌ Không bắt buộc
    code: string,
    name: string,
    provinceId: string
  },
  
  // Tọa độ và dữ liệu OSM
  location: {              // ❌ Không bắt buộc
    type: { type: string }, // "Point"
    coordinates: [number]   // [longitude, latitude]
  },
  osm: {                   // ❌ Không bắt buộc
    lat: number,
    lng: number,
    displayName: string,
    raw: object
  },
  
  // Địa chỉ đầy đủ (tự động sinh)
  fullAddress: string,     // ✅ Tự động sinh từ các thành phần
  
  // Thông tin khác
  adminType: "new",        // ✅ Mặc định
  isDefault: boolean,      // ❌ Không bắt buộc
  note: string,            // ❌ Không bắt buộc
  isDraft: false           // ✅ Phải là false cho địa chỉ hoàn chỉnh
}
```

## 🔄 **Tích Hợp Với Add-Address**

### **File:** `app/add-address.tsx`

#### **Cập nhật:**
- ✅ **Address Parameter**: Nhận dữ liệu từ address-detail
- ✅ **Auto-fill Fields**: Tự động điền các trường từ dữ liệu nhận
- ✅ **Data Preservation**: Giữ nguyên dữ liệu đã chọn
- ✅ **Format Compliance**: Đảm bảo format đúng yêu cầu

#### **Flow Integration:**
1. **Address Selection** → Chọn province/district/ward
2. **Address Detail** → Nhập địa chỉ chi tiết + chọn vị trí
3. **Add Address** → Điền thông tin người nhận + lưu

## 🎨 **UI/UX Features**

### **Address Selection:**
- Progress indicator với 3 bước
- Location button để tự động xác định
- Search với autocomplete real-time
- Selection preview

### **Address Detail:**
- Map integration với OpenStreetMap
- Address input với suggestions
- Current location button
- Coordinate display
- Ward boundary validation

## 🔧 **Technical Features**

### **Rate Limiting:**
- 1 request/giây cho Nominatim API
- Debounced search (500ms delay)
- Error handling và retry logic

### **Data Validation:**
- Ward boundary checking
- Coordinate validation
- Required field validation
- Format compliance checking

### **Performance:**
- Lazy loading cho map
- Debounced API calls
- Efficient state management
- Memory leak prevention

## 🚀 **Kết Quả**

✅ **Hoàn thành theo yêu cầu:**
- Location detection + autocomplete cho province/district/ward
- Map integration với ward-based search
- Current location với boundary validation
- Coordinate extraction từ marker
- Format compliance với yêu cầu backend
- UI/UX intuitive và user-friendly

✅ **Không cần Redirect URIs:**
- Sử dụng public Nominatim API
- Không cần OAuth2 authentication
- Chỉ đọc dữ liệu, không chỉnh sửa OpenStreetMap

✅ **Tích hợp hoàn chỉnh:**
- Flow từ selection → detail → add-address
- Data preservation qua các bước
- Format đúng yêu cầu backend





