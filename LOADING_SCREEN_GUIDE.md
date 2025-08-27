# Loading Screen Guide

## Mô tả
Trang loading với background từ Pinterest, thanh loading ngang, text ngẫu nhiên về sách và GIF loading. Hỗ trợ pull-to-refresh và slide animation.

## Tính năng
- Background từ `bgbookloading.jpg` (tối ưu performance)
- Thanh loading ngang với animation mượt mà
- Text ngẫu nhiên về sách (15 câu trích dẫn)
- GIF loading nhỏ gọn với animation pulse nhẹ
- Không hiển thị phần trăm loading (gọn gàng hơn)
- Màu sắc theo theme aqua/blue-green
- Pull-to-refresh với slide animation nhanh
- Hiện loading screen ngay lập tức khi kéo xuống
- Tự động slide up sau khi loading xong
- Tích hợp sẵn cho Home screen và Book detail
- Performance tối ưu, không lag

## Cách sử dụng

### 1. Sử dụng trực tiếp
```tsx
import LoadingScreen from './screens/LoadingScreen';

// Trong component
<LoadingScreen />
```

### 2. Sử dụng với Modal
```tsx
import LoadingScreenWrapper from './components/LoadingScreenWrapper';

// Trong component
const [isLoading, setIsLoading] = useState(false);

<LoadingScreenWrapper 
  visible={isLoading} 
  onRequestClose={() => setIsLoading(false)} 
/>
```

### 3. Sử dụng với Hook
```tsx
import { useLoadingScreen } from './hooks/useLoadingScreen';
import LoadingScreenWrapper from './components/LoadingScreenWrapper';

// Trong component
const { isLoading, showLoading, hideLoading, withLoading } = useLoadingScreen();

// Hiển thị loading
showLoading();

// Ẩn loading
hideLoading();

// Wrap function async
const loadData = async () => {
  await withLoading(async () => {
    // Your async code here
    await fetchData();
  });
};

// Render
<LoadingScreenWrapper visible={isLoading} />
```

### 4. Sử dụng cho Home Screen (Pull-to-refresh)
```tsx
import { useHomeLoading } from './hooks/useHomeLoading';
import PullToRefreshLoadingScreen from './screens/PullToRefreshLoadingScreen';

// Trong component
const { 
  isLoading, 
  showLoadingScreen, 
  startLoading, 
  stopLoading, 
  handlePullToRefresh 
} = useHomeLoading();

// Pull-to-refresh
const onRefresh = async () => {
  await handlePullToRefresh(async () => {
    await refreshData();
  });
};

// Render
<PullToRefreshLoadingScreen
  isVisible={showLoadingScreen}
  duration={5000}
  onSlideUp={stopLoading}
/>
```

### 5. Sử dụng cho Book Detail
```tsx
import { useBookDetailLoading } from './hooks/useBookDetailLoading';
import PullToRefreshLoadingScreen from './screens/PullToRefreshLoadingScreen';

// Trong component
const { 
  isLoading, 
  showLoadingScreen, 
  startLoading, 
  stopLoading, 
  loadBookData 
} = useBookDetailLoading();

// Load book data
const fetchBook = async () => {
  await loadBookData(async () => {
    const book = await getBookById(id);
    setBook(book);
    return book;
  });
};

// Render
<PullToRefreshLoadingScreen
  isVisible={showLoadingScreen}
  duration={3000}
  onSlideUp={stopLoading}
/>
```

## Cấu trúc file
- `screens/LoadingScreen.tsx` - Component loading cơ bản
- `screens/PullToRefreshLoadingScreen.tsx` - Component loading với slide animation
- `components/LoadingScreenWrapper.tsx` - Wrapper cho Modal
- `components/LoadingDemo.tsx` - Component demo
- `hooks/useLoadingScreen.ts` - Hook quản lý loading state cơ bản
- `hooks/useHomeLoading.ts` - Hook quản lý loading cho Home screen
- `hooks/useBookDetailLoading.ts` - Hook quản lý loading cho Book detail
- `assets/images/loadingbook.gif` - GIF loading

## Tùy chỉnh

### Thay đổi câu trích dẫn
Chỉnh sửa mảng `bookQuotes` trong `LoadingScreen.tsx`:

```tsx
const bookQuotes = [
  "Câu trích dẫn mới của bạn",
  // Thêm câu khác...
];
```

### Thay đổi màu sắc
Chỉnh sửa trong `styles`:

```tsx
progressFill: {
  backgroundColor: '#YOUR_COLOR', // Thay đổi màu thanh loading
},
```

### Thay đổi thời gian animation
```tsx
// Animation cho thanh loading
Animated.timing(progressAnim, {
  toValue: 1,
  duration: 5000, // Thay đổi thời gian (ms)
  useNativeDriver: false,
}).start();
```

## Lưu ý
- Cần có `react-native-webview` trong dependencies
- GIF `loadingbook.gif` phải có trong thư mục `assets/images/`
- Background Pinterest có thể không load được trong một số trường hợp (cần internet)
