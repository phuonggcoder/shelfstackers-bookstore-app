# Review Display Fixes

## 🎯 **Vấn đề đã được báo cáo**

1. **Lỗi React setState trong render**: Khi nhấn "Hủy" hoặc "X", app bị lỗi "Cannot update a component while rendering a different component"
2. **Đánh giá không hiển thị**: Khi vào trang đánh giá sản phẩm, không thấy đánh giá nào hiển thị

## ✅ **Các sửa đổi đã thực hiện**

### **1. Sửa lỗi setState trong render**

**Trong `app/product-reviews.tsx`:**
```typescript
// Auto-show review form if in edit mode and user review is loaded
useEffect(() => {
  if (editMode === 'true' && userReview && !showReviewForm) {
    // Use setTimeout to avoid setState during render
    setTimeout(() => {
      setShowReviewForm(true);
    }, 0);
  }
}, [editMode, userReview, showReviewForm]);
```

**Trong `components/ReviewForm.tsx`:**
```typescript
const handleCancel = () => {
  // Use setTimeout to avoid setState during render
  setTimeout(() => {
    onCancel();
  }, 0);
};
```

**Trong `app/product-reviews.tsx`:**
```typescript
const handleCloseReviewForm = () => {
  // Use setTimeout to avoid setState during render
  setTimeout(() => {
    setShowReviewForm(false);
  }, 0);
};
```

### **2. Sửa navigation từ book detail**

**Trong `app/book/[id].tsx`:**
```typescript
// Trước:
onPress={() => router.push('/product-reviews' as any)}

// Sau:
onPress={() => router.push({
  pathname: '/product-reviews',
  params: { productId: id as string }
})}
```

**Lý do:** Trước đây navigate đến `/product-reviews` mà không truyền `productId`, khiến trang không biết phải load đánh giá cho sản phẩm nào.

### **3. Cải thiện error handling**

**Trong `app/product-reviews.tsx`:**
```typescript
const loadReviews = async (pageNum = 1, refresh = false) => {
  try {
    // ... existing code ...
    
    const response = await ReviewService.getProductReviews(productId!, pageNum, 10, token || undefined);
    console.log('ProductReviews - loadReviews - Response:', response);
    console.log('ProductReviews - loadReviews - Reviews array:', response.reviews);
    console.log('ProductReviews - loadReviews - Reviews length:', response.reviews?.length || 0);
    
    if (refresh || pageNum === 1) {
      setReviews(response.reviews || []); // Thêm fallback []
    } else {
      setReviews(prev => [...prev, ...(response.reviews || [])]); // Thêm fallback []
    }
    
    setHasMore((response.reviews?.length || 0) === 10); // Thêm fallback 0
    
  } catch (error) {
    console.error('ProductReviews - Error loading reviews:', error);
    Alert.alert('Lỗi', 'Không thể tải danh sách đánh giá');
  }
};
```

### **4. Thêm debug logging**

**Trong `app/product-reviews.tsx`:**
```typescript
console.log('ProductReviews - useEffect - productId:', productId, 'orderId:', orderId, 'user:', !!user);
console.log('ProductReviews - Render - reviews length:', reviews.length);
console.log('ProductReviews - Render - reviews:', reviews);
console.log('ProductReviews - Render - summary:', summary);
console.log('ProductReviews - Render - userReview:', userReview);
```

### **5. Sửa lỗi navigation cho single product**

**Trong `app/product-reviews.tsx`:**
```typescript
// Trước: Gọi router.replace trong render (không được phép)
if (orderItems.length === 1) {
  const singleItem = orderItems[0];
  router.replace({...}); // ❌ Lỗi: gọi trong render
  return null;
}

// Sau: Sử dụng useEffect để handle navigation
if (orderItems.length === 1) {
  // Use useEffect to handle navigation instead of doing it in render
  React.useEffect(() => {
    const singleItem = orderItems[0];
    router.replace({
      pathname: '/product-reviews',
      params: {
        productId: singleItem.book._id,
        orderId: orderId,
        orderCode: orderCode
      }
    });
  }, []);
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3255FB" />
        <Text style={styles.loadingText}>Đang chuyển hướng...</Text>
      </View>
    </SafeAreaView>
  );
}
```

## 🔍 **Nguyên nhân có thể của việc không hiển thị đánh giá**

1. **Backend chưa có dữ liệu**: Sản phẩm này chưa có đánh giá nào
2. **API endpoint chưa hoạt động**: Backend chưa implement đầy đủ các endpoint
3. **ProductId không đúng**: ID sản phẩm không khớp với dữ liệu trong database
4. **Authentication issue**: Token không hợp lệ hoặc thiếu quyền truy cập

## 🧪 **Cách test**

1. **Chạy app và xem console logs** để debug
2. **Sử dụng file `test-review-api.js`** để test API endpoints
3. **Kiểm tra backend** xem có dữ liệu đánh giá không
4. **Tạo một đánh giá test** để xem có hiển thị không

## 📝 **Các bước tiếp theo**

1. **Kiểm tra backend**: Đảm bảo các API endpoints hoạt động
2. **Tạo dữ liệu test**: Thêm một số đánh giá test vào database
3. **Test với productId thực**: Sử dụng ID sản phẩm thực tế từ database
4. **Kiểm tra authentication**: Đảm bảo token hợp lệ

## 🎯 **Kết quả mong đợi**

- ✅ Không còn lỗi setState trong render
- ✅ Có thể đóng form chỉnh sửa đánh giá
- ✅ Navigation từ book detail hoạt động đúng
- ✅ Hiển thị đánh giá nếu có dữ liệu
- ✅ Hiển thị thông báo "Chưa có đánh giá" nếu không có dữ liệu 