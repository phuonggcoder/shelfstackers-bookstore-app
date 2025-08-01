# Review Edit Functionality Fixes

## Issues Fixed

### 1. "trong đánh giá của tôi, không thể chỉnh sửa được" (Cannot edit in my reviews)

**Problem**: When users clicked the edit button in the "My Reviews" screen, it navigated to the product reviews screen but didn't automatically show the review form for editing.

**Root Cause**: The `MyReviewsScreen` was passing an `editMode: 'true'` parameter, but the `ProductReviewsScreen` wasn't extracting this parameter from the URL params.

**Fix**: 
- Updated `useLocalSearchParams` in `app/product-reviews.tsx` to extract the `editMode` parameter
- Added a new `useEffect` hook that automatically shows the review form when `editMode === 'true'` and the user's review is loaded

```typescript
// Added editMode to params extraction
const { productId, orderId, orderCode, items, editMode } = useLocalSearchParams<{ 
  productId?: string; 
  orderId?: string; 
  orderCode?: string;
  items?: string;
  editMode?: string;
}>();

// Added auto-show review form logic
useEffect(() => {
  if (editMode === 'true' && userReview && !showReviewForm) {
    setShowReviewForm(true);
  }
}, [editMode, userReview, showReviewForm]);
```

### 2. "một sản phẩm thì không cần chọn" (Single product orders shouldn't require selection)

**Problem**: When an order contained only one product, users still had to go through a selection screen instead of being taken directly to the review form.

**Fix**: 
- Added logic to automatically navigate to the single product when `orderItems.length === 1`
- Used `router.replace()` to avoid adding an extra navigation step
- Updated the subtitle to show the number of products when multiple items exist

```typescript
// Auto-select single product
if (orderItems.length === 1) {
  const singleItem = orderItems[0];
  router.replace({
    pathname: '/product-reviews',
    params: {
      productId: singleItem.book._id,
      orderId: orderId,
      orderCode: orderCode
    }
  });
  return null; // Return null while redirecting
}
```

## Files Modified

1. **`app/product-reviews.tsx`**
   - Added `editMode` parameter extraction
   - Added auto-show review form logic for edit mode
   - Added auto-selection for single product orders
   - Updated order selection subtitle

## Testing

The fixes ensure that:
1. ✅ Users can edit their reviews from the "My Reviews" screen
2. ✅ Single product orders skip the selection screen
3. ✅ Multiple product orders still show the selection screen
4. ✅ Edit mode automatically opens the review form
5. ✅ Navigation flow is smooth and intuitive

## User Experience Improvements

- **Faster Review Editing**: Users can now directly edit reviews from their review list
- **Streamlined Single Product Orders**: No unnecessary selection step for single-item orders
- **Clear Visual Feedback**: Order selection screen shows product count
- **Consistent Navigation**: Edit mode automatically opens the form without manual steps 