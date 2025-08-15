# Tính năng thay đổi địa chỉ trong modal hủy đơn hàng

## Yêu cầu
Thêm một lý do đặc biệt "Cần thay đổi địa chỉ" trong modal hủy đơn hàng. Khi chọn lý do này, sẽ hiển thị ô nhập địa chỉ mới và có thể thay đổi địa chỉ thay vì hủy đơn hàng.

## Giải pháp đã triển khai

### 1. Cập nhật CancelOrderModal
**File**: `components/CancelOrderModal.tsx`

**Thay đổi**:
- Thêm lý do "Cần thay đổi địa chỉ" vào danh sách `predefinedReasons`
- Thêm state `newAddress` để lưu địa chỉ mới
- Cập nhật interface để hỗ trợ tham số `newAddress` trong callback
- Thêm validation cho địa chỉ mới
- Thêm UI để nhập địa chỉ mới khi chọn lý do này

```typescript
// Thêm lý do mới
const predefinedReasons = [
  'Thay đổi ý định mua hàng',
  'Tìm thấy sản phẩm rẻ hơn',
  'Thông tin đơn hàng không chính xác',
  'Không còn nhu cầu sử dụng',
  'Cần thay đổi địa chỉ', // Lý do mới
  'Lý do khác',
];

// Thêm state cho địa chỉ mới
const [newAddress, setNewAddress] = useState('');

// Cập nhật interface
interface CancelOrderModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (reason: string, newAddress?: string) => void; // Thêm newAddress
  loading: boolean;
  paymentMethod?: string;
  isRefund?: boolean;
}

// Thêm validation
if (selectedReason === 'Cần thay đổi địa chỉ' && !newAddress.trim()) {
  Alert.alert('Lỗi', 'Vui lòng nhập địa chỉ mới');
  return;
}

// Thêm UI cho địa chỉ mới
{selectedReason === 'Cần thay đổi địa chỉ' && (
  <View style={styles.customReasonContainer}>
    <Text style={styles.sectionTitle}>Địa chỉ mới:</Text>
    <TextInput
      style={styles.reasonInput}
      placeholder="Nhập địa chỉ giao hàng mới..."
      value={newAddress}
      onChangeText={setNewAddress}
      multiline
      numberOfLines={4}
      textAlignVertical="top"
    />
  </View>
)}
```

### 2. Cập nhật OrderDetailScreen
**File**: `app/order-detail.tsx`

**Thay đổi**:
- Cập nhật hàm `handleCancelConfirm` để xử lý tham số `newAddress`
- Thêm logic xử lý riêng cho trường hợp thay đổi địa chỉ

```typescript
const handleCancelConfirm = async (reason: string, newAddress?: string) => {
  // ... existing code ...
  
  if (reason === 'Cần thay đổi địa chỉ' && newAddress) {
    // Gửi yêu cầu thay đổi địa chỉ thay vì hủy đơn hàng
    await cancelOrder(token, actualOrderId, reason, newAddress);
    Alert.alert('Thành công', 'Yêu cầu thay đổi địa chỉ đã được gửi. Admin sẽ xem xét và xử lý.');
  } else {
    // Hủy đơn hàng bình thường
    await cancelOrder(token, actualOrderId, reason);
    Alert.alert('Thành công', 'Đơn hàng đã được hủy.');
  }
};
```

### 3. Cập nhật OrderService
**File**: `services/orderService.ts`

**Thay đổi**:
- Cập nhật hàm `cancelOrder` để hỗ trợ tham số `newAddress`
- Gửi địa chỉ mới trong request body nếu có

```typescript
export const cancelOrder = async (
  token: string, 
  orderId: string, 
  cancellationReason: string, 
  newAddress?: string
) => {
  const requestData: any = {
    cancellation_reason: cancellationReason
  };
  
  // Nếu có địa chỉ mới, thêm vào request
  if (newAddress) {
    requestData.new_address = newAddress;
  }
  
  const response = await axios.patch(
    getApiUrl(`/api/orders/${orderId}/cancel`), 
    requestData, 
    { headers: getAuthHeaders(token) }
  );
  return response.data;
};
```

## Logic mới

### Khi user chọn "Cần thay đổi địa chỉ":

1. **Hiển thị ô nhập địa chỉ** - TextInput với placeholder "Nhập địa chỉ giao hàng mới..."
2. **Validation** - Bắt buộc nhập địa chỉ mới trước khi xác nhận
3. **Gửi request** - Gửi cả lý do và địa chỉ mới lên server
4. **Thông báo** - "Yêu cầu thay đổi địa chỉ đã được gửi. Admin sẽ xem xét và xử lý."

### Các trường hợp xử lý:

#### ✅ Thay đổi địa chỉ
- **User chọn**: "Cần thay đổi địa chỉ"
- **User nhập**: Địa chỉ mới
- **Kết quả**: Gửi yêu cầu thay đổi địa chỉ (không hủy đơn hàng)

#### ✅ Hủy đơn hàng bình thường
- **User chọn**: Các lý do khác
- **Kết quả**: Hủy đơn hàng như bình thường

#### ❌ Validation lỗi
- **User chọn**: "Cần thay đổi địa chỉ" nhưng không nhập địa chỉ
- **Kết quả**: Hiển thị lỗi "Vui lòng nhập địa chỉ mới"

## UI/UX

### Modal hiển thị:
1. **Tiêu đề**: "Hủy đơn hàng"
2. **Mô tả**: "Bạn có chắc chắn muốn hủy đơn hàng này?"
3. **Danh sách lý do** (bao gồm "Cần thay đổi địa chỉ")
4. **Ô nhập địa chỉ** (chỉ hiển thị khi chọn lý do thay đổi địa chỉ)
5. **Nút hành động**: "Đóng" và "Hủy đơn hàng"

### Trải nghiệm user:
1. User nhấn nút "Hủy đơn hàng"
2. Modal hiển thị với danh sách lý do
3. User chọn "Cần thay đổi địa chỉ"
4. Ô nhập địa chỉ mới xuất hiện
5. User nhập địa chỉ mới
6. User nhấn "Hủy đơn hàng" (thực chất là gửi yêu cầu thay đổi)
7. Hiển thị thông báo thành công

## Backend Integration

### Request format:
```json
{
  "cancellation_reason": "Cần thay đổi địa chỉ",
  "new_address": "123 Đường ABC, Quận 1, TP.HCM"
}
```

### Response handling:
- Server có thể xử lý `new_address` để cập nhật địa chỉ đơn hàng
- Hoặc tạo một request riêng cho admin xem xét
- Trả về thông báo thành công cho user

## Testing

### Test case 1: Thay đổi địa chỉ thành công
1. User mở modal hủy đơn hàng
2. User chọn "Cần thay đổi địa chỉ"
3. User nhập địa chỉ mới
4. User nhấn "Hủy đơn hàng"
5. **Kết quả mong đợi**: Hiển thị thông báo "Yêu cầu thay đổi địa chỉ đã được gửi"

### Test case 2: Validation lỗi
1. User chọn "Cần thay đổi địa chỉ"
2. User không nhập địa chỉ mới
3. User nhấn "Hủy đơn hàng"
4. **Kết quả mong đợi**: Hiển thị lỗi "Vui lòng nhập địa chỉ mới"

### Test case 3: Hủy đơn hàng bình thường
1. User chọn lý do khác (không phải thay đổi địa chỉ)
2. User nhấn "Hủy đơn hàng"
3. **Kết quả mong đợi**: Hủy đơn hàng như bình thường

## Lưu ý quan trọng

1. **Server-side handling** - Server cần xử lý `new_address` trong request
2. **Admin workflow** - Admin có thể cần xem xét và phê duyệt thay đổi địa chỉ
3. **Order status** - Đơn hàng có thể cần status mới như "pending_address_change"
4. **User notification** - Thông báo cho user khi admin xử lý xong
5. **Address validation** - Có thể thêm validation cho địa chỉ mới

## Tương lai

### Cải thiện có thể thực hiện:
1. **Address picker** - Tích hợp với Google Places API để chọn địa chỉ
2. **Address validation** - Kiểm tra địa chỉ có hợp lệ không
3. **Real-time tracking** - Theo dõi trạng thái xử lý thay đổi địa chỉ
4. **Multiple changes** - Cho phép thay đổi nhiều thông tin khác ngoài địa chỉ 