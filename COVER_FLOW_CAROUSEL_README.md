# Cover Flow Carousel Components

## Tổng quan

Đây là các component Cover Flow carousel được tạo ra cho ứng dụng bookstore với hiệu ứng 3D đẹp mắt và animation mượt mà.

## Các Component

### 1. CoverFlowCarousel.tsx
Component carousel cơ bản với hiệu ứng cover flow:
- Hiệu ứng scale và opacity
- Pagination dots
- Shadow effects
- Responsive design

### 2. CoverFlowCarousel3D.tsx
Component carousel nâng cao với hiệu ứng 3D thực sự:
- Hiệu ứng perspective và rotation 3D
- Navigation buttons
- Reflection effects
- Advanced animations với Animated API
- Z-index layering

### 3. CoverFlowDemo.tsx
Component demo để test và so sánh hai loại carousel:
- Switch giữa basic và 3D carousel
- Mock data để test
- Hướng dẫn sử dụng

## Tính năng chính

### Hiệu ứng 3D
```typescript
const rotateY = scrollX.interpolate({
  inputRange,
  outputRange: ['-45deg', '0deg', '45deg'],
  extrapolate: 'clamp',
});
```

### Animation mượt mà
```typescript
const scale = scrollX.interpolate({
  inputRange,
  outputRange: [0.8, 1.1, 0.8],
  extrapolate: 'clamp',
});
```

### Navigation
- Touch navigation với FlatList
- Navigation buttons (3D version)
- Pagination dots
- Snap to interval

## Cách sử dụng

### Import component
```typescript
import CoverFlowCarousel from './components/CoverFlowCarousel';
import CoverFlowCarousel3D from './components/CoverFlowCarousel3D';
```

### Sử dụng trong component
```typescript
<CoverFlowCarousel3D
  title="Sách Nổi Bật"
  books={booksData}
  categoryId="featured"
  categoryName="Sách Nổi Bật"
/>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| title | string | Yes | Tiêu đề của carousel |
| books | Book[] | Yes | Danh sách sách |
| categoryId | string | No | ID danh mục |
| categoryName | string | No | Tên danh mục |

## Cấu hình

### Kích thước card
```typescript
const CARD_WIDTH = 140;  // 3D version
const CARD_HEIGHT = 200;
const SPACING = 25;
```

### Perspective cho 3D
```typescript
const PERSPECTIVE = 1000;
```

## Hiệu ứng đặc biệt

### Shadow và Reflection
```typescript
shadow: {
  position: 'absolute',
  bottom: -8,
  left: 8,
  right: 8,
  height: 15,
  backgroundColor: 'rgba(0,0,0,0.15)',
  borderRadius: 12,
  zIndex: -1,
},
reflection: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: 30,
  backgroundColor: 'rgba(255,255,255,0.1)',
  borderRadius: 12,
  transform: [{ scaleY: -1 }],
},
```

## Performance

- Sử dụng `useCallback` để tối ưu re-render
- `getItemLayout` để tối ưu FlatList
- `scrollEventThrottle={16}` cho smooth animation
- `useNativeDriver: true` cho Animated API

## Responsive Design

- Tự động tính toán padding dựa trên screen width
- Adaptive card size
- Flexible layout

## Tương thích

- React Native 0.60+
- Expo SDK 45+
- TypeScript support
- iOS và Android

## Demo

Để xem demo, import và sử dụng `CoverFlowDemo` component:

```typescript
import CoverFlowDemo from './components/CoverFlowDemo';

// Trong component
<CoverFlowDemo />
```

## Tùy chỉnh

### Thay đổi màu sắc
```typescript
// Trong styles
activeDot: {
  backgroundColor: '#your-color',
},
bookPrice: {
  color: '#your-color',
},
```

### Thay đổi kích thước
```typescript
const CARD_WIDTH = 160;  // Tăng kích thước
const CARD_HEIGHT = 220;
const SPACING = 30;
```

## Troubleshooting

### Animation không mượt
- Kiểm tra `scrollEventThrottle`
- Đảm bảo `useNativeDriver: true`
- Tối ưu re-render với `useCallback`

### Performance issues
- Giảm số lượng items hiển thị
- Sử dụng `getItemLayout`
- Tối ưu image loading

## Tương lai

- Thêm gesture controls
- Auto-play functionality
- Infinite scroll
- Custom animations
- Accessibility improvements 