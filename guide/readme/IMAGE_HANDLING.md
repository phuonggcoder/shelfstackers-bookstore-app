# Hướng dẫn xử lý hình ảnh trong ứng dụng

## Vấn đề đã được khắc phục

### 1. Thống nhất sử dụng expo-image
- Tất cả các component đều sử dụng `expo-image` thay vì `react-native` Image
- `expo-image` có performance tốt hơn và caching tốt hơn

### 2. Utility functions cho xử lý URL
Trong `utils/format.ts`:
```typescript
// Kiểm tra và trả về URL hợp lệ
export const getValidImageUrl = (url: string | undefined | null): string => {
  if (!url || url.trim() === '') {
    return 'https://i.imgur.com/gTzT0hA.jpeg'; // Default fallback image
  }
  return url;
};

// Lấy hình ảnh đầu tiên hợp lệ từ mảng
export const getFirstValidImage = (images: string[] | undefined | null): string => {
  if (!images || images.length === 0) {
    return 'https://i.imgur.com/gTzT0hA.jpeg';
  }
  
  const validImage = images.find(img => img && img.trim() !== '');
  return validImage || 'https://i.imgur.com/gTzT0hA.jpeg';
};
```

### 3. BookImage Component
Component wrapper để xử lý hình ảnh một cách nhất quán:
```typescript
<BookImage 
  images={book.cover_image}
  style={styles.image}
  contentFit="cover"
  transition={300}
/>
```

## Cách sử dụng

### 1. Sử dụng BookImage component (Khuyến nghị)
```typescript
import BookImage from '../components/BookImage';

<BookImage 
  images={book.cover_image}
  style={styles.image}
  contentFit="cover"
  transition={200}
/>
```

### 2. Sử dụng utility functions trực tiếp
```typescript
import { getFirstValidImage } from '../utils/format';
import { Image } from 'expo-image';

<Image 
  source={{ uri: getFirstValidImage(book.cover_image) }}
  style={styles.image}
  contentFit="cover"
  transition={200}
/>
```

## Lưu ý quan trọng

1. **Luôn sử dụng expo-image**: Không sử dụng `react-native` Image
2. **Luôn có fallback image**: Sử dụng utility functions để đảm bảo luôn có hình ảnh hiển thị
3. **Thêm transition**: Để có hiệu ứng mượt mà khi load hình ảnh
4. **Sử dụng contentFit**: Để kiểm soát cách hình ảnh được hiển thị

## Fallback Image
- URL mặc định: `https://i.imgur.com/gTzT0hA.jpeg`
- Đây là một hình ảnh placeholder đơn giản
- Có thể thay đổi trong `utils/format.ts` 