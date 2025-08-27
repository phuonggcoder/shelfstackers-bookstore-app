# 📍 Dialog Xác Nhận Lấy Vị Trí - Tóm Tắt

## 📋 **Tính Năng Mới**

Thêm dialog xác nhận lấy vị trí người dùng khi xác nhận địa chỉ. Người dùng có thể chọn:
- **Hủy**: Lưu địa chỉ không có vị trí
- **Lấy vị trí**: Lấy vị trí hiện tại và cập nhật vào địa chỉ

## 🔧 **Cách Hoạt Động**

### **1. Khi Người Dùng Nhấn "Lưu Địa Chỉ":**

```typescript
// Hiển thị dialog xác nhận
Alert.alert(
  'Xác nhận vị trí',
  'Bạn có muốn lấy vị trí hiện tại để cập nhật vào địa chỉ không?',
  [
    {
      text: 'Hủy',
      style: 'cancel',
      onPress: () => {
        // Lưu địa chỉ không có vị trí
        saveAddressWithoutLocation();
      }
    },
    {
      text: 'Lấy vị trí',
      onPress: async () => {
        // Lấy vị trí hiện tại và lưu địa chỉ
        const currentLocation = await getCurrentLocation();
        if (currentLocation) {
          saveAddressWithLocation(currentLocation);
        } else {
          // Nếu không lấy được vị trí, lưu không có vị trí
          saveAddressWithoutLocation();
        }
      }
    }
  ]
);
```

### **2. Function Lấy Vị Trí Hiện Tại:**

```typescript
const getCurrentLocation = async (): Promise<{ lat: number; lng: number; displayName: string } | null> => {
  try {
    // Kiểm tra quyền truy cập vị trí
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Lỗi', 'Cần quyền truy cập vị trí để lấy tọa độ hiện tại');
      return null;
    }

    // Lấy vị trí hiện tại
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
      timeInterval: 5000,
      distanceInterval: 10
    });

    const { latitude, longitude } = location.coords;
    console.log('[AddAddress] Current location:', { lat: latitude, lng: longitude });

    // Reverse geocoding để lấy địa chỉ
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&addressdetails=1`
    );
    const data = await response.json();
    console.log('[AddAddress] Reverse geocoding result:', data);

    return {
      lat: latitude,
      lng: longitude,
      displayName: data.display_name || 'Vị trí hiện tại'
    };
  } catch (error) {
    console.error('[AddAddress] Error getting current location:', error);
    Alert.alert('Lỗi', 'Không thể lấy vị trí hiện tại');
    return null;
  }
};
```

### **3. Function Lưu Địa Chỉ Không Có Vị Trí:**

```typescript
const saveAddressWithoutLocation = async () => {
  try {
    setLoading(true);
    
    if (!selectedAddress) {
      Alert.alert('Lỗi', 'Không có dữ liệu địa chỉ');
      return;
    }
    
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

    console.log('[AddAddress] Saving address without location:', addressData);

    // Gọi API lưu địa chỉ
    const result = await AddressService.addAddress(token!, addressData);
    
    console.log('[AddAddress] Address saved successfully:', result);
    
    Alert.alert('Thành công', 'Đã lưu địa chỉ thành công', [
      { text: 'OK', onPress: () => router.back() }
    ]);
    
  } catch (error) {
    console.error('[AddAddress] Error saving address:', error);
    showErrorToast('Lỗi khi lưu địa chỉ');
  } finally {
    setLoading(false);
  }
};
```

### **4. Function Lưu Địa Chỉ Với Vị Trí Hiện Tại:**

```typescript
const saveAddressWithLocation = async (currentLocation: { lat: number; lng: number; displayName: string }) => {
  try {
    setLoading(true);
    
    if (!selectedAddress) {
      Alert.alert('Lỗi', 'Không có dữ liệu địa chỉ');
      return;
    }
    
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

    // Thêm vị trí hiện tại
    addressData.location = {
      type: 'Point',
      coordinates: [currentLocation.lng, currentLocation.lat] // [longitude, latitude]
    };

    addressData.osm = {
      lat: currentLocation.lat,
      lng: currentLocation.lng,
      displayName: currentLocation.displayName,
      raw: { display_name: currentLocation.displayName }
    };

    console.log('[AddAddress] Saving address with current location:', addressData);

    // Gọi API lưu địa chỉ
    const result = await AddressService.addAddress(token!, addressData);
    
    console.log('[AddAddress] Address saved successfully with location:', result);
    
    Alert.alert('Thành công', 'Đã lưu địa chỉ với vị trí hiện tại thành công', [
      { text: 'OK', onPress: () => router.back() }
    ]);
    
  } catch (error) {
    console.error('[AddAddress] Error saving address with location:', error);
    showErrorToast('Lỗi khi lưu địa chỉ');
  } finally {
    setLoading(false);
  }
};
```

## 🔄 **Luồng Hoạt Động**

### **1. Người Dùng Nhấn "Lưu Địa Chỉ"**
```
User clicks "Lưu địa chỉ" 
    ↓
Validation (tên, số điện thoại, địa chỉ chi tiết)
    ↓
Hiển thị dialog xác nhận
```

### **2. Dialog Xác Nhận**
```
Dialog: "Bạn có muốn lấy vị trí hiện tại để cập nhật vào địa chỉ không?"
    ↓
┌─────────────────┬─────────────────┐
│      Hủy        │   Lấy vị trí    │
└─────────────────┴─────────────────┘
    ↓                    ↓
saveAddressWithoutLocation()  getCurrentLocation()
    ↓                    ↓
Lưu không có vị trí    Lấy GPS + Reverse geocoding
    ↓                    ↓
Thành công              saveAddressWithLocation()
                        ↓
                    Lưu với vị trí hiện tại
                        ↓
                    Thành công
```

## 📊 **Các Trường Hợp**

### **1. Người Dùng Chọn "Hủy":**
- ✅ Lưu địa chỉ không có vị trí
- ✅ Giữ nguyên dữ liệu đã nhập
- ✅ Thông báo thành công

### **2. Người Dùng Chọn "Lấy Vị Trí":**
- ✅ Kiểm tra quyền truy cập vị trí
- ✅ Lấy GPS coordinates
- ✅ Reverse geocoding để lấy địa chỉ
- ✅ Cập nhật location và osm data
- ✅ Lưu địa chỉ với vị trí hiện tại
- ✅ Thông báo thành công

### **3. Không Lấy Được Vị Trí:**
- ✅ Hiển thị thông báo lỗi
- ✅ Fallback về lưu không có vị trí
- ✅ Thông báo thành công

## 🔍 **Console Logs**

### **Khi Lấy Vị Trí:**
```typescript
console.log('[AddAddress] Current location:', { lat: latitude, lng: longitude });
console.log('[AddAddress] Reverse geocoding result:', data);
console.log('[AddAddress] Saving address with current location:', addressData);
console.log('[AddAddress] Address saved successfully with location:', result);
```

### **Khi Không Lấy Vị Trí:**
```typescript
console.log('[AddAddress] Saving address without location:', addressData);
console.log('[AddAddress] Address saved successfully:', result);
```

## ✅ **Lợi Ích**

### **1. UX Tốt Hơn:**
- ✅ Người dùng có quyền lựa chọn
- ✅ Không bắt buộc phải lấy vị trí
- ✅ Thông báo rõ ràng

### **2. Dữ Liệu Chính Xác:**
- ✅ Vị trí GPS chính xác
- ✅ Reverse geocoding để lấy địa chỉ
- ✅ Validation chặt chẽ

### **3. Linh Hoạt:**
- ✅ Có thể lưu không có vị trí
- ✅ Có thể cập nhật vị trí hiện tại
- ✅ Fallback khi lỗi

## 📋 **Testing Checklist**

### **Dialog Testing:**
- [ ] Hiển thị dialog khi nhấn "Lưu địa chỉ"
- [ ] Nút "Hủy" hoạt động đúng
- [ ] Nút "Lấy vị trí" hoạt động đúng
- [ ] Dialog đóng sau khi chọn

### **Location Testing:**
- [ ] Quyền truy cập vị trí được yêu cầu
- [ ] GPS coordinates được lấy thành công
- [ ] Reverse geocoding hoạt động
- [ ] Dữ liệu được cập nhật đúng

### **Error Handling:**
- [ ] Thông báo lỗi khi không có quyền
- [ ] Thông báo lỗi khi không lấy được vị trí
- [ ] Fallback về lưu không có vị trí
- [ ] Loading state hoạt động đúng

### **Data Validation:**
- [ ] Location data được format đúng
- [ ] OSM data được format đúng
- [ ] Payload gửi đúng format
- [ ] API response xử lý đúng

## 🚀 **Kết Quả**

### **Đã Hoàn Thành:**
- ✅ **Dialog xác nhận**: Người dùng có thể chọn lấy vị trí hay không
- ✅ **Location service**: Lấy GPS coordinates và reverse geocoding
- ✅ **Data validation**: Đảm bảo dữ liệu hợp lệ
- ✅ **Error handling**: Xử lý lỗi và fallback
- ✅ **UX improvement**: Trải nghiệm người dùng tốt hơn

### **Cải Tiến:**
- ✅ **Flexibility**: Người dùng có quyền lựa chọn
- ✅ **Accuracy**: Vị trí GPS chính xác
- ✅ **Reliability**: Fallback khi lỗi
- ✅ **User control**: Người dùng kiểm soát dữ liệu

Bây giờ người dùng có thể chọn có lấy vị trí hiện tại hay không khi lưu địa chỉ! 📍✨





