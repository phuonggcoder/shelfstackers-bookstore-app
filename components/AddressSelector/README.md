# AddressSelector Component

## 📋 **Tổng quan**

Component `AddressSelector` được thiết kế để chọn địa chỉ theo cấu trúc hành chính Việt Nam (Tỉnh/Thành phố → Quận/Huyện → Phường/Xã) với API backend mới (OAPI - 63 tỉnh thành).

## 🚀 **Tính năng**

- ✅ **Chọn địa chỉ 3 cấp**: Tỉnh/Thành → Quận/Huyện → Phường/Xã
- ✅ **Loading states**: Hiển thị loading khi đang fetch data
- ✅ **Error handling**: Xử lý lỗi và hiển thị thông báo
- ✅ **Caching**: Cache data để giảm API calls
- ✅ **Validation**: Validate địa chỉ trước khi submit
- ✅ **Internationalization**: Hỗ trợ đa ngôn ngữ (i18n)
- ✅ **TypeScript**: Full type safety
- ✅ **Responsive**: Tương thích với React Native

## 📦 **Cài đặt**

### Dependencies

```bash
# Nếu dùng npm
npm install @react-native-picker/picker react-i18next axios

# Nếu dùng yarn
yarn add @react-native-picker/picker react-i18next axios
```

### Import

```typescript
import AddressSelector from './components/AddressSelector';
import { AddressData } from './services/addressApiService';
```

## 🎯 **Sử dụng cơ bản**

```typescript
import React, { useState } from 'react';
import { View, Text } from 'react-native';
import AddressSelector from './components/AddressSelector';
import { AddressData } from './services/addressApiService';

const MyComponent = () => {
  const [selectedAddress, setSelectedAddress] = useState<AddressData | null>(null);

  const handleAddressChange = (address: AddressData) => {
    setSelectedAddress(address);
    console.log('Selected address:', address);
  };

  return (
    <View>
      <Text>Chọn địa chỉ giao hàng</Text>
      <AddressSelector
        onChange={handleAddressChange}
        required={true}
      />
    </View>
  );
};
```

## 🔧 **Props API**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onChange` | `(address: AddressData) => void` | - | Callback khi địa chỉ thay đổi |
| `defaultValue` | `AddressData` | `null` | Giá trị mặc định cho địa chỉ |
| `disabled` | `boolean` | `false` | Disable toàn bộ component |
| `required` | `boolean` | `false` | Hiển thị dấu * cho các field bắt buộc |
| `style` | `ViewStyle` | - | Custom styles cho container |

## 📊 **Data Structure**

### AddressData Interface

```typescript
interface AddressData {
  province: Province | null;
  district: District | null;
  ward: Ward | null;
}

interface Province {
  code: string;
  name: string;
  type: string;
  typeText: string;
  slug?: string;
  autocompleteType?: string;
}

interface District {
  code: string;
  name: string;
  provinceId: string;
  type: string;
  typeText: string;
}

interface Ward {
  code: string;
  name: string;
  districtId: string;
  type: string;
  typeText: string;
  fullName?: string;
  path?: string;
}
```

## 🌐 **API Endpoints**

Component sử dụng các API endpoints sau:

### 1. Get Provinces
```
GET /api/v1/address/provinces
Query params:
- q: string (search query)
- page: number
- size: number
```

### 2. Get Districts
```
GET /api/v1/address/districts
Query params:
- province-code: string
- q: string (search query)
- page: number
- size: number
```

### 3. Get Wards
```
GET /api/v1/address/wards
Query params:
- districtId: string
- q: string (search query)
- page: number
- size: number
```

### 4. Search All
```
GET /api/v1/address/search-all
Query params:
- q: string (search query)
- page: number
- size: number
```

## 🔧 **Service API**

### AddressApiService

```typescript
import AddressApiService from './services/addressApiService';

// Get provinces
const provinces = await AddressApiService.getProvinces();

// Get districts by province
const districts = await AddressApiService.getDistricts('79'); // HCM

// Get wards by district
const wards = await AddressApiService.getWards('760'); // Quận 1

// Search all
const results = await AddressApiService.searchAll('ho chi minh');

// Validate address
const validation = AddressApiService.validateAddress(addressData);

// Format address for display
const formattedAddress = AddressApiService.formatAddress(addressData);
```

## 🌍 **Internationalization**

### Translation Keys

```json
{
  "address": {
    "province": "Tỉnh/Thành phố",
    "district": "Quận/Huyện",
    "ward": "Phường/Xã",
    "selectProvince": "Chọn tỉnh/thành phố",
    "selectDistrict": "Chọn quận/huyện",
    "selectWard": "Chọn phường/xã",
    "street": "Đường/Số nhà",
    "fullName": "Họ và tên",
    "phone": "Số điện thoại",
    "note": "Ghi chú"
  }
}
```

## 🎨 **Customization**

### Custom Styles

```typescript
import { StyleSheet } from 'react-native';

const customStyles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  pickerWrapper: {
    borderColor: '#007AFF',
    borderWidth: 2,
  },
});

<AddressSelector
  onChange={handleAddressChange}
  style={customStyles.container}
/>
```

### Custom Validation

```typescript
const handleAddressChange = (address: AddressData) => {
  // Custom validation
  if (address.province?.code === '79' && !address.district) {
    Alert.alert('Lỗi', 'Vui lòng chọn quận/huyện cho TP.HCM');
    return;
  }
  
  setSelectedAddress(address);
};
```

## 🧪 **Testing**

### Demo Component

```typescript
import AddressSelectorDemo from './components/AddressSelector/AddressSelectorDemo';

// Sử dụng demo để test
<AddressSelectorDemo />
```

### Unit Tests

```typescript
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AddressSelector from './AddressSelector';

test('should load provinces on mount', async () => {
  const { getByText } = render(<AddressSelector />);
  
  await waitFor(() => {
    expect(getByText('Chọn tỉnh/thành phố')).toBeTruthy();
  });
});
```

## 🚨 **Error Handling**

Component tự động xử lý các lỗi sau:

- **Network errors**: Hiển thị thông báo lỗi mạng
- **API errors**: Hiển thị thông báo lỗi API
- **Validation errors**: Hiển thị thông báo validation
- **Loading states**: Hiển thị loading indicator

## 🔄 **Caching**

Service sử dụng in-memory cache để:

- Giảm số lượng API calls
- Tăng performance
- Giảm tải cho server

### Cache Management

```typescript
// Clear all cache
AddressApiService.clearCache();

// Clear specific cache
AddressApiService.clearCacheByKey('provinces_');

// Get cache size
const cacheSize = AddressApiService.getCacheSize();
```

## 📱 **Performance Tips**

1. **Debounce search**: Implement debounce cho search queries
2. **Lazy loading**: Chỉ load data khi cần thiết
3. **Cache management**: Clear cache khi cần thiết
4. **Error boundaries**: Wrap component trong ErrorBoundary

## 🔗 **Integration Examples**

### With React Hook Form

```typescript
import { useForm, Controller } from 'react-hook-form';

function AddressForm() {
  const { control, handleSubmit } = useForm();

  const onSubmit = (data) => {
    console.log('Form data:', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="address"
        control={control}
        rules={{ required: true }}
        render={({ field }) => (
          <AddressSelector
            onChange={field.onChange}
            value={field.value}
            required
          />
        )}
      />
    </form>
  );
}
```

### With Redux

```typescript
import { useDispatch, useSelector } from 'react-redux';

const AddressSelectorWithRedux = () => {
  const dispatch = useDispatch();
  const selectedAddress = useSelector(state => state.address.selected);

  const handleAddressChange = (address) => {
    dispatch(setSelectedAddress(address));
  };

  return (
    <AddressSelector
      onChange={handleAddressChange}
      defaultValue={selectedAddress}
    />
  );
};
```

## 📝 **Best Practices**

1. **Always validate**: Validate address trước khi submit
2. **Handle errors**: Implement proper error handling
3. **Use TypeScript**: Leverage type safety
4. **Cache wisely**: Use cache để tối ưu performance
5. **Test thoroughly**: Test tất cả edge cases
6. **Document APIs**: Document API endpoints và responses

## 🐛 **Troubleshooting**

### Common Issues

1. **API not responding**: Kiểm tra network và API endpoints
2. **Data not loading**: Kiểm tra cache và API responses
3. **Validation errors**: Kiểm tra data format và validation rules
4. **Styling issues**: Kiểm tra custom styles và theme

### Debug Tips

```typescript
// Enable debug logging
console.log('Address data:', addressData);

// Check API responses
console.log('API response:', response.data);

// Validate data structure
console.log('Data validation:', AddressApiService.validateAddress(addressData));
```

## 📄 **License**

MIT License - Xem file LICENSE để biết thêm chi tiết.

## 🤝 **Contributing**

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📞 **Support**

Nếu gặp vấn đề, vui lòng:

1. Kiểm tra documentation
2. Tìm trong issues
3. Tạo issue mới với thông tin chi tiết
4. Liên hệ team development





