# Review Navigation and Display Fixes

## 🎯 **Vấn đề đã được báo cáo**

1. **Đánh giá không hiển thị ở trang chi tiết sách** - Trang book detail chỉ hiển thị placeholder thay vì review summary thực tế
2. **Navigation từ "Đánh giá của tôi"** - Khi nhấn chỉnh sửa, nó chuyển đến trang đơn hàng thay vì trang đánh giá trực tiếp
3. **Thời gian chỉnh sửa không cập nhật** - `timeAgo` không phản ánh thời gian chỉnh sửa gần nhất

## ✅ **Các sửa đổi đã thực hiện**

### **1. Sửa navigation từ "Đánh giá của tôi"**

**Trong `app/my-reviews.tsx`:**
```typescript
// Trước:
const handleEditReview = (review: Review) => {
  const productId = getProductId(review);
  const orderId = getOrderId(review); // ❌ Truyền orderId khiến app chuyển đến trang đơn hàng
  
  router.push({
    pathname: '/product-reviews',
    params: { 
      productId,
      orderId, // ❌ Gây ra navigation đến trang đơn hàng
      editMode: 'true'
    }
  });
};

// Sau:
const handleEditReview = (review: Review) => {
  const productId = getProductId(review);
  // ✅ Chỉ truyền productId, không truyền orderId
  
  router.push({
    pathname: '/product-reviews',
    params: { 
      productId,
      editMode: 'true'
    }
  });
};
```

**Kết quả:** Bây giờ khi nhấn "Chỉnh sửa" từ trang "Đánh giá của tôi", app sẽ chuyển thẳng đến trang đánh giá sản phẩm với form chỉnh sửa mở sẵn.

### **2. Thêm hiển thị đánh giá ở trang chi tiết sách**

**Trong `app/book/[id].tsx`:**

**Thêm imports và state:**
```typescript
import ReviewService, { ReviewSummary } from '../../services/reviewService';

// Review summary state
const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(null);
const [loadingReviewSummary, setLoadingReviewSummary] = useState(false);
```

**Thêm function load review summary:**
```typescript
// Fetch review summary when book is loaded
useEffect(() => {
  if (book && token) {
    const fetchReviewSummary = async () => {
      try {
        setLoadingReviewSummary(true);
        const summary = await ReviewService.getProductReviewSummary(book._id, token);
        setReviewSummary(summary);
      } catch (error) {
        console.error('Error fetching review summary:', error);
      } finally {
        setLoadingReviewSummary(false);
      }
    };
    fetchReviewSummary();
  }
}, [book, token]);
```

**Thay thế placeholder bằng review summary thực tế:**
```typescript
{/* Review Summary */}
{loadingReviewSummary ? (
  <View style={styles.reviewPlaceholder}>
    <ActivityIndicator size="small" color="#3255FB" />
    <Text style={styles.reviewPlaceholderText}>Đang tải đánh giá...</Text>
  </View>
) : reviewSummary && reviewSummary.totalReviews > 0 ? (
  <View style={styles.reviewSummary}>
    <View style={styles.reviewRating}>
      <Text style={styles.reviewRatingText}>{reviewSummary.averageRating.toFixed(1)}</Text>
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= reviewSummary.averageRating ? "star" : "star-outline"}
            size={16}
            color={star <= reviewSummary.averageRating ? "#FFD700" : "#CCC"}
          />
        ))}
      </View>
      <Text style={styles.reviewCountText}>
        {reviewSummary.totalReviews} đánh giá
      </Text>
    </View>
    <View style={styles.reviewDistribution}>
      {[5, 4, 3, 2, 1].map((rating) => {
        const count = reviewSummary.ratingCounts[rating as keyof typeof reviewSummary.ratingCounts] || 0;
        const percentage = reviewSummary.totalReviews > 0 
          ? (count / reviewSummary.totalReviews) * 100 
          : 0;
        return (
          <View key={rating} style={styles.ratingBar}>
            <Text style={styles.ratingLabel}>{rating}★</Text>
            <View style={styles.ratingBarContainer}>
              <View 
                style={[
                  styles.ratingBarFill, 
                  { width: `${percentage}%` }
                ]} 
              />
            </View>
            <Text style={styles.ratingCount}>{count}</Text>
          </View>
        );
      })}
    </View>
  </View>
) : (
  <View style={styles.reviewPlaceholder}>
    <Ionicons name="star-outline" size={48} color="#CCC" />
    <Text style={styles.reviewPlaceholderText}>Chưa có đánh giá nào</Text>
    <Text style={styles.reviewPlaceholderSubtext}>
      Hãy là người đầu tiên đánh giá sản phẩm này
    </Text>
  </View>
)}
```

**Thêm styles cho review summary:**
```typescript
// Review Summary Styles
reviewSummary: {
  backgroundColor: '#F8F9FA',
  borderRadius: 12,
  padding: 16,
},
reviewRating: {
  alignItems: 'center',
  marginBottom: 16,
},
reviewRatingText: {
  fontSize: 32,
  fontWeight: 'bold',
  color: '#333',
  marginBottom: 8,
},
starsContainer: {
  flexDirection: 'row',
  marginBottom: 8,
},
reviewCountText: {
  fontSize: 14,
  color: '#666',
},
reviewDistribution: {
  gap: 8,
},
ratingBar: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
},
ratingLabel: {
  fontSize: 12,
  color: '#666',
  width: 20,
},
ratingBarContainer: {
  flex: 1,
  height: 8,
  backgroundColor: '#E0E0E0',
  borderRadius: 4,
  overflow: 'hidden',
},
ratingBarFill: {
  height: '100%',
  backgroundColor: '#FFD700',
},
ratingCount: {
  fontSize: 12,
  color: '#666',
  width: 30,
  textAlign: 'right',
},
```

### **3. Sửa hiển thị thời gian chỉnh sửa**

**Trong `components/ReviewCard.tsx`:**

**Thêm function getTimeAgo:**
```typescript
const getTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'vừa xong';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} phút trước`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} giờ trước`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} ngày trước`;
  }
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} tuần trước`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} tháng trước`;
  }
  
  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} năm trước`;
};
```

**Sửa hiển thị thời gian chỉnh sửa:**
```typescript
{review.is_edited && (
  <View style={styles.editedContainer}>
    <Ionicons name="time-outline" size={14} color="#999" />
    <Text style={styles.editedText}>
      Đã chỉnh sửa {review.edited_at ? 
        getTimeAgo(new Date(review.edited_at)) : // ✅ Sử dụng getTimeAgo thay vì toLocaleDateString
        'gần đây'
      }
    </Text>
  </View>
)}
```

## 🎯 **Kết quả mong đợi**

- ✅ **Navigation từ "Đánh giá của tôi"** - Chuyển thẳng đến trang đánh giá sản phẩm với form chỉnh sửa
- ✅ **Hiển thị đánh giá ở trang chi tiết sách** - Hiển thị review summary với rating, số lượng đánh giá và distribution
- ✅ **Thời gian chỉnh sửa chính xác** - Hiển thị thời gian tương đối (ví dụ: "2 giờ trước") thay vì ngày tháng cố định
- ✅ **Loading states** - Hiển thị loading indicator khi đang tải review summary
- ✅ **Fallback states** - Hiển thị placeholder khi chưa có đánh giá nào

## 📱 **UI/UX Improvements**

1. **Review Summary ở Book Detail:**
   - Hiển thị rating trung bình với số sao
   - Hiển thị tổng số đánh giá
   - Hiển thị distribution của các rating (5★, 4★, 3★, 2★, 1★)
   - Visual progress bars cho mỗi rating level

2. **Navigation Flow:**
   - Từ "Đánh giá của tôi" → Trang đánh giá sản phẩm (không qua trang đơn hàng)
   - Form chỉnh sửa tự động mở khi vào từ edit mode

3. **Time Display:**
   - Thời gian tương đối dễ hiểu hơn
   - Cập nhật real-time cho thời gian chỉnh sửa 