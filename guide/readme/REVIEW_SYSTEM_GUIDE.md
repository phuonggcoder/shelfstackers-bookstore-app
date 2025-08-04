# Review System - Hướng dẫn sử dụng

## 🎯 Tổng quan

Hệ thống Review đã được tích hợp hoàn chỉnh vào ứng dụng ShelfStackers, cho phép người dùng đánh giá sản phẩm sau khi mua hàng với đầy đủ tính năng: rating, comment, upload ảnh/video.

## 📱 Các màn hình đã tạo

### 1. **ProductReviewsScreen** (`/app/product-reviews.tsx`)
- Hiển thị danh sách review của sản phẩm
- Thống kê rating và phân bố số sao
- Cho phép tạo/chỉnh sửa review
- Vote hữu ích cho review

### 2. **MyReviewsScreen** (`/app/my-reviews.tsx`)
- Hiển thị tất cả review của user hiện tại
- Cho phép chỉnh sửa/xóa review
- Navigation đến trang review sản phẩm

### 3. **ReviewForm** (`/components/ReviewForm.tsx`)
- Form tạo/chỉnh sửa review
- Rating từ 1-5 sao
- Comment với giới hạn 1000 ký tự
- Upload ảnh/video (tối đa 5 file)

## 🧩 Components đã tạo

### 1. **RatingStars** (`/components/RatingStars.tsx`)
- Component hiển thị rating bằng sao
- Hỗ trợ readonly và interactive mode
- Customizable size và color

### 2. **ReviewCard** (`/components/ReviewCard.tsx`)
- Card hiển thị thông tin review
- Avatar và tên user
- Rating, comment, media
- Badge "Đã mua" cho verified purchase
- Actions: edit, delete, vote helpful

### 3. **ReviewSummary** (`/components/ReviewSummary.tsx`)
- Hiển thị thống kê tổng quan
- Average rating và tổng số review
- Phân bố rating từ 1-5 sao

## 🔧 Services và Hooks

### 1. **ReviewService** (`/services/reviewService.ts`)
```typescript
// Tạo review mới
await ReviewService.createReview({
  productId: 'product_id',
  orderId: 'order_id', 
  rating: 5,
  comment: 'Sản phẩm tuyệt vời!',
  images: ['url1', 'url2']
});

// Lấy review của sản phẩm
const response = await ReviewService.getProductReviews(productId, page, limit);

// Upload media
const media = await ReviewService.uploadMedia(imageUrl);
```

### 2. **useReviews Hook** (`/hooks/useReviews.ts`)
```typescript
const {
  reviews,
  summary,
  userReview,
  loading,
  createReview,
  updateReview,
  deleteReview,
  voteHelpful
} = useReviews(productId);
```

## 🚀 Cách sử dụng

### 1. **Tích hợp vào trang chi tiết sản phẩm**
```typescript
// Trong BookDetailsScreen
<View style={styles.reviewSection}>
  <View style={styles.reviewHeader}>
    <Text style={styles.reviewTitle}>Đánh giá sản phẩm</Text>
    <TouchableOpacity onPress={() => router.push('/product-reviews')}>
      <Text>Xem tất cả</Text>
    </TouchableOpacity>
  </View>
  {/* Review summary hoặc placeholder */}
</View>
```

### 2. **Thêm link vào Profile**
```typescript
// Trong ProfileScreen
<TouchableOpacity onPress={() => navigation.navigate('my-reviews')}>
  <Ionicons name="star-outline" size={22} color="#3255FB" />
  <Text>Đánh giá của tôi</Text>
</TouchableOpacity>
```

### 3. **Sử dụng ReviewForm**
```typescript
<ReviewForm
  productId={productId}
  orderId={orderId}
  existingReview={userReview}
  onSubmit={handleSubmitReview}
  onCancel={() => setShowForm(false)}
  isLoading={submitting}
/>
```

## 📊 API Endpoints

### Review Management
- `POST /api/v1/review` - Tạo review mới
- `PUT /api/v1/review/:id` - Cập nhật review
- `DELETE /api/v1/review/:id` - Xóa review
- `GET /api/v1/review/product/:productId` - Lấy review của sản phẩm
- `GET /api/v1/review/user` - Lấy review của user
- `GET /api/v1/review/product/:productId/summary` - Thống kê review

### Media Upload
- `POST /api/review-upload/single` - Upload 1 media
- `POST /api/review-upload/media` - Upload nhiều media
- `DELETE /api/review-upload/media/:publicId` - Xóa media

## 🎨 UI/UX Features

### 1. **Rating System**
- 5 sao với animation mượt mà
- Hiển thị rating trung bình
- Phân bố rating bằng progress bar

### 2. **Media Support**
- Upload ảnh từ camera hoặc gallery
- Preview ảnh trước khi upload
- Hỗ trợ video (cần backend support)
- Giới hạn 5 file, mỗi file tối đa 5MB

### 3. **User Experience**
- Pull-to-refresh
- Infinite scroll cho danh sách review
- Loading states và error handling
- Toast notifications cho actions

## 🔐 Authentication & Authorization

- Tất cả API đều yêu cầu authentication
- Chỉ user đã mua sản phẩm mới được review
- User chỉ có thể edit/delete review của mình
- Verified purchase badge cho review từ user đã mua

## 📱 Navigation Flow

1. **User mua sản phẩm** → Order history
2. **Từ order history** → Product reviews (với orderId)
3. **Từ product detail** → Product reviews (xem tất cả)
4. **Từ profile** → My reviews (xem review của mình)

## 🧪 Testing

### Test Cases
- [ ] Tạo review mới với rating và comment
- [ ] Upload ảnh/video cho review
- [ ] Chỉnh sửa review đã tạo
- [ ] Xóa review
- [ ] Vote helpful cho review
- [ ] Pagination và infinite scroll
- [ ] Error handling khi network lỗi

### Manual Testing
```bash
# Test tạo review
1. Mua sản phẩm
2. Vào order history
3. Click "Đánh giá" 
4. Chọn rating, nhập comment
5. Upload ảnh (optional)
6. Submit review

# Test xem review
1. Vào trang chi tiết sản phẩm
2. Scroll xuống phần "Đánh giá sản phẩm"
3. Click "Xem tất cả"
4. Xem danh sách review
```

## 🚀 Deployment

### Prerequisites
- Backend API đã deploy và hoạt động
- Cloudinary setup cho media upload
- Authentication system hoạt động

### Environment Variables
```env
API_BASE_URL=https://your-backend-url.com
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## 📝 Notes

1. **Backend Integration**: Cần đảm bảo backend API đã implement đầy đủ các endpoints
2. **Media Upload**: Hiện tại chỉ support ảnh, video cần backend support
3. **Error Handling**: Cần test kỹ các trường hợp lỗi network
4. **Performance**: Infinite scroll và image optimization cần được tối ưu
5. **Accessibility**: Cần thêm accessibility features cho screen readers

## 🔮 Future Enhancements

1. **Video Support**: Upload và play video trong review
2. **Review Analytics**: Dashboard cho admin xem thống kê review
3. **Review Moderation**: Admin có thể approve/reject review
4. **Review Replies**: Seller có thể reply review
5. **Review Photos**: Gallery view cho ảnh review
6. **Review Search**: Tìm kiếm review theo keyword
7. **Review Export**: Export review data cho analytics

## 📞 Support

Nếu có vấn đề hoặc cần hỗ trợ, vui lòng liên hệ:
- Email: support@shelfstackers.com
- Documentation: [API Docs](https://docs.shelfstackers.com)
- GitHub Issues: [Repository](https://github.com/shelfstackers/app) 