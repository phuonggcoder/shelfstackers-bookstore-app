# 📚 Hybrid Search với Google Books API - Hướng dẫn sử dụng

## 🎯 Tổng quan

Tính năng Hybrid Search cho phép tìm kiếm sách từ cả local database và Google Books API, cung cấp trải nghiệm tìm kiếm toàn diện cho người dùng.

## 🚀 Tính năng chính

### ✅ Tìm kiếm kết hợp
- **Local Database**: Tìm kiếm trong kho sách của ứng dụng
- **Google Books API**: Tìm kiếm trong thư viện Google Books
- **Hybrid Search**: Kết hợp kết quả từ cả hai nguồn

### ✅ Bộ lọc và sắp xếp
- Sắp xếp theo: Độ liên quan, Tên sách, Giá, Đánh giá
- Thứ tự: Tăng dần/Giảm dần
- Bộ lọc: Sách miễn phí, Sách có sẵn

### ✅ Hiển thị thông minh
- Badge phân biệt nguồn (Local/Google)
- Xử lý trùng lặp tự động
- Hiển thị rating và thông tin chi tiết

## 📁 Cấu trúc file

```
services/
├── googleBooksService.ts     # Service Google Books API
├── hybridBookService.ts      # Service tìm kiếm hybrid
└── api.ts                    # Service local database

components/
├── HybridBookCard.tsx        # Card hiển thị sách hybrid
└── AdvancedSearchBar.tsx     # Thanh tìm kiếm nâng cao

app/
├── hybrid-search.tsx         # Màn hình tìm kiếm hybrid
└── google-book-detail.tsx    # Chi tiết sách Google Books

types/
└── index.ts                  # Interface Book mở rộng
```

## 🔧 Cài đặt và sử dụng

### 1. Google Books Service

```typescript
import googleBooksService from '../services/googleBooksService';

// Tìm kiếm cơ bản
const results = await googleBooksService.searchBooks({
  q: 'Harry Potter',
  maxResults: 20
});

// Tìm kiếm theo tác giả
const authorResults = await googleBooksService.searchBooksByAuthor('J.K. Rowling');

// Tìm kiếm theo danh mục
const categoryResults = await googleBooksService.searchBooksByCategory('Fiction');

// Tìm kiếm sách miễn phí
const freeResults = await googleBooksService.searchFreeBooks('Programming');
```

### 2. Hybrid Search Service

```typescript
import hybridBookService from '../services/hybridBookService';

// Tìm kiếm hybrid
const hybridResults = await hybridBookService.hybridSearch({
  query: 'React Native',
  includeLocal: true,
  includeGoogle: true,
  maxResults: 20,
  sortBy: 'relevance',
  order: 'desc'
});

// Tìm kiếm theo danh mục
const categoryResults = await hybridBookService.searchByCategory('categoryId');

// Tìm kiếm theo tác giả
const authorResults = await hybridBookService.searchByAuthor('Author Name');
```

### 3. Sử dụng Components

```typescript
import HybridBookCard from '../components/HybridBookCard';
import AdvancedSearchBar from '../components/AdvancedSearchBar';

// Advanced Search Bar
<AdvancedSearchBar
  onSearch={(options) => {
    // Xử lý tìm kiếm
    console.log('Search options:', options);
  }}
  placeholder="Tìm kiếm sách..."
/>

// Hybrid Book Card
<HybridBookCard
  book={bookData}
  onPress={(book) => {
    // Xử lý khi nhấn vào sách
  }}
  onAddToCart={(book) => {
    // Thêm vào giỏ hàng (chỉ sách local)
  }}
  onAddToWishlist={(book) => {
    // Thêm vào wishlist
  }}
  showSourceBadge={true}
/>
```

## 🎨 Giao diện người dùng

### Advanced Search Bar
- **Tìm kiếm cơ bản**: Nhập từ khóa và nhấn tìm
- **Tùy chọn nâng cao**: Nhấn icon options để mở modal
- **Chọn nguồn**: Local, Google Books, hoặc kết hợp
- **Sắp xếp**: Theo độ liên quan, tên, giá, đánh giá
- **Bộ lọc**: Sách miễn phí, có sẵn

### Hybrid Book Card
- **Badge nguồn**: Hiển thị Local/Google
- **Thông tin sách**: Tên, tác giả, giá, rating
- **Trạng thái kho**: Còn hàng/Hết hàng (chỉ local)
- **Actions**: Thêm giỏ hàng, Wishlist, Xem chi tiết

### Google Book Detail
- **Thông tin đầy đủ**: Tên, tác giả, mô tả, rating
- **Thông tin giá**: Giá niêm yết, giá bán, miễn phí
- **Actions**: Mua sách, Xem trước, Thông tin chi tiết
- **Liên kết ngoài**: Mở Google Books để mua/xem

## 🔄 Luồng hoạt động

### 1. Tìm kiếm Hybrid
```
User nhập từ khóa → AdvancedSearchBar → HybridBookService
                                                    ↓
Local Database ←→ Kết hợp kết quả ←→ Google Books API
                                                    ↓
Loại bỏ trùng lặp → Sắp xếp → Hiển thị kết quả
```

### 2. Xử lý trùng lặp
- So sánh theo title và ISBN
- Ưu tiên sách local trước
- Loại bỏ trùng lặp từ Google Books

### 3. Navigation
- **Sách Local**: Navigate đến `/book/[id]`
- **Sách Google**: Navigate đến `/google-book-detail`

## 🛠️ Tùy chỉnh và mở rộng

### 1. Thêm API Key Google Books
```typescript
// services/googleBooksService.ts
const googleBooksService = new GoogleBooksService('YOUR_API_KEY');
```

### 2. Tùy chỉnh bộ lọc
```typescript
// Thêm bộ lọc mới trong AdvancedSearchBar
const customFilters = {
  priceRange: { min: 0, max: 1000000 },
  language: 'vi',
  publishedYear: 2020
};
```

### 3. Tùy chỉnh hiển thị
```typescript
// Tùy chỉnh HybridBookCard
<HybridBookCard
  showSourceBadge={false}
  showRating={true}
  showPrice={true}
  customStyles={customStyles}
/>
```

## 📊 Hiệu suất và tối ưu

### 1. Caching
- Cache kết quả tìm kiếm local
- Cache thông tin sách Google Books
- Sử dụng AsyncStorage cho lịch sử tìm kiếm

### 2. Pagination
- Load từng trang kết quả
- Infinite scroll cho danh sách dài
- Lazy loading cho hình ảnh

### 3. Error Handling
- Retry mechanism cho API calls
- Fallback cho network errors
- Graceful degradation

## 🧪 Testing

### 1. Unit Tests
```typescript
// __tests__/hybridBookService.test.ts
describe('HybridBookService', () => {
  test('should perform hybrid search', async () => {
    const results = await hybridBookService.hybridSearch({
      query: 'test',
      includeLocal: true,
      includeGoogle: true
    });
    expect(results.combined.length).toBeGreaterThan(0);
  });
});
```

### 2. Integration Tests
```typescript
// __tests__/hybridSearch.integration.test.ts
describe('Hybrid Search Integration', () => {
  test('should handle API errors gracefully', async () => {
    // Test error handling
  });
});
```

## 🚨 Lưu ý quan trọng

### 1. Rate Limiting
- Google Books API có giới hạn request
- Implement retry logic với exponential backoff
- Cache kết quả để giảm API calls

### 2. Data Consistency
- Local và Google Books có format khác nhau
- Normalize data trước khi hiển thị
- Handle missing fields gracefully

### 3. User Experience
- Hiển thị loading states
- Provide feedback cho actions
- Handle offline scenarios

## 📈 Metrics và Analytics

### 1. Search Analytics
- Từ khóa tìm kiếm phổ biến
- Tỷ lệ click vào kết quả
- Thời gian tìm kiếm trung bình

### 2. Performance Metrics
- Response time của API calls
- Cache hit rate
- Error rate

## 🔗 Liên kết hữu ích

- [Google Books API Documentation](https://developers.google.com/books/docs/v1/using)
- [React Native Navigation](https://reactnavigation.org/)
- [Expo Router](https://docs.expo.dev/router/introduction/)

## 📝 Changelog

### v1.0.0
- ✅ Tích hợp Google Books API
- ✅ Hybrid search functionality
- ✅ Advanced search options
- ✅ Google book detail screen
- ✅ Source badges và filtering

### Roadmap
- 🔄 Search history persistence
- 🔄 Offline search capability
- 🔄 Advanced filtering options
- 🔄 Search suggestions
- 🔄 Book comparison feature



