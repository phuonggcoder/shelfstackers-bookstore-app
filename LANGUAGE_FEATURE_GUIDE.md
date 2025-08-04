# Hướng dẫn sử dụng chức năng đổi ngôn ngữ

## Tổng quan
Chức năng đổi ngôn ngữ cho phép người dùng chuyển đổi giữa tiếng Việt và tiếng Anh trong ứng dụng ShelfStackers Bookstore.

## Các file chính

### 1. Cấu hình i18n
- `app/i18n.tsx`: Cấu hình chính cho i18next
- `app/languageDetector.tsx`: Detector để phát hiện và lưu ngôn ngữ
- `app/locales/en.json`: File ngôn ngữ tiếng Anh
- `app/locales/vi.json`: File ngôn ngữ tiếng Việt

### 2. Context và Hook
- `context/LanguageContext.tsx`: Context quản lý ngôn ngữ toàn cục
- `hooks/useLanguage.ts`: Hook tiện ích để sử dụng ngôn ngữ

### 3. Components
- `app/Language.tsx`: Màn hình chọn ngôn ngữ
- `components/LanguageSelector.tsx`: Component hiển thị ngôn ngữ hiện tại

## Cách sử dụng

### 1. Trong component React
```tsx
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation();
  
  return (
    <Text>{t('welcome')}</Text>
  );
};
```

### 2. Sử dụng hook useLanguage
```tsx
import { useLanguage } from '../hooks/useLanguage';

const MyComponent = () => {
  const { t, currentLanguage, changeLanguage } = useLanguage();
  
  const handleLanguageChange = async () => {
    await changeLanguage('en');
  };
  
  return (
    <View>
      <Text>{t('currentLanguage')}: {currentLanguage}</Text>
      <Button onPress={handleLanguageChange} title="Change to English" />
    </View>
  );
};
```

### 3. Sử dụng LanguageSelector component
```tsx
import LanguageSelector from '../components/LanguageSelector';

const SettingsScreen = () => {
  return (
    <View>
      <LanguageSelector />
    </View>
  );
};
```

## Thêm từ khóa mới

### 1. Thêm vào file tiếng Anh (`app/locales/en.json`)
```json
{
  "newKey": "English text"
}
```

### 2. Thêm vào file tiếng Việt (`app/locales/vi.json`)
```json
{
  "newKey": "Văn bản tiếng Việt"
}
```

### 3. Sử dụng trong component
```tsx
const { t } = useTranslation();
<Text>{t('newKey')}</Text>
```

## Tính năng

### 1. Tự động lưu ngôn ngữ
- Ngôn ngữ được lưu vào AsyncStorage
- Tự động khôi phục ngôn ngữ khi khởi động app

### 2. Giao diện đẹp
- Hiển thị cờ quốc gia
- Animation khi chuyển đổi
- Thông báo thành công

### 3. Hỗ trợ đa ngôn ngữ
- Tiếng Việt (mặc định)
- Tiếng Anh
- Dễ dàng mở rộng thêm ngôn ngữ khác

## Cấu trúc thư mục
```
app/
├── i18n.tsx                 # Cấu hình i18next
├── languageDetector.tsx     # Language detector
├── Language.tsx            # Màn hình chọn ngôn ngữ
└── locales/
    ├── en.json             # File ngôn ngữ tiếng Anh
    └── vi.json             # File ngôn ngữ tiếng Việt

context/
└── LanguageContext.tsx     # Context quản lý ngôn ngữ

hooks/
└── useLanguage.ts         # Hook tiện ích

components/
└── LanguageSelector.tsx   # Component hiển thị ngôn ngữ
```

## Lưu ý
- Ngôn ngữ mặc định là tiếng Việt
- Tất cả text trong app nên sử dụng `t('key')` thay vì hardcode
- Khi thêm từ khóa mới, cần thêm vào cả 2 file ngôn ngữ
- Context được wrap ở cấp cao nhất trong app để đảm bảo tất cả component đều có thể truy cập 