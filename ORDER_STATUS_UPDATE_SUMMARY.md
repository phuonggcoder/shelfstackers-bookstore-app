# Cập nhật Trạng thái Đơn hàng - Tóm tắt

## Tổng quan
Đã cập nhật hệ thống trạng thái đơn hàng để đồng bộ với backend và cải thiện trải nghiệm người dùng.

## Các trạng thái đơn hàng mới

### Trạng thái chính:
1. **Pending** - Chờ xử lý
   - Đơn hàng mới được tạo, chờ admin xác nhận
   - Màu: #f39c12 (Cam)

2. **AwaitingPickup** - Chờ lấy hàng
   - Đơn hàng đã được xác nhận, shipper sẽ đến lấy hàng
   - Màu: #1976D2 (Xanh dương)

3. **OutForDelivery** - Đang giao hàng
   - Shipper đang giao hàng đến khách hàng
   - Màu: #FF9800 (Cam đậm)

4. **Delivered** - Đã giao hàng
   - Đơn hàng đã được giao thành công
   - Màu: #4CAF50 (Xanh lá)

5. **Cancelled** - Đã hủy
   - Đơn hàng đã bị hủy (bởi user hoặc admin)
   - Màu: #e74c3c (Đỏ)

6. **Refunded** - Đã hoàn tiền
   - Đơn hàng đã được hoàn tiền
   - Màu: #9C27B0 (Tím)

7. **Returned** - Đã trả hàng
   - Đơn hàng đã được trả lại
   - Màu: #E91E63 (Hồng)

## Các file đã cập nhật

### 1. Components
- **`components/OrderStatusBadge.tsx`**
  - Cập nhật hiển thị trạng thái với icon và mô tả
  - Thêm các trạng thái mới
  - Cải thiện UI/UX

- **`components/OrderStatusTimeline.tsx`** (Mới)
  - Component timeline hiển thị tiến trình đơn hàng
  - Hiển thị trạng thái hiện tại và các bước đã hoàn thành
  - Hỗ trợ trạng thái đặc biệt (hủy, hoàn tiền)

### 2. Pages
- **`app/order-history.tsx`**
  - Cập nhật tabs để hiển thị đúng trạng thái
  - Cải thiện logic filter theo trạng thái
  - Thêm các trạng thái mới vào tabs

- **`app/order-detail.tsx`**
  - Cập nhật logic canCancelOrder và canRequestRefund
  - Cải thiện hiển thị trạng thái thanh toán
  - Thêm xử lý các trạng thái mới

### 3. Hooks
- **`hooks/useOrders.ts`**
  - Cập nhật mapping dữ liệu từ backend
  - Ưu tiên order_status từ backend
  - Thêm các trường mới (refund, shipper info)

### 4. Ngôn ngữ
- **`app/locales/vi/vi.json`**
  - Thêm bản dịch cho các trạng thái mới
  - Thêm mô tả chi tiết cho từng trạng thái
  - Thêm bản dịch cho payment status

- **`app/locales/en/en.json`**
  - Thêm bản dịch tiếng Anh tương ứng
  - Đồng bộ với bản dịch tiếng Việt

## Logic nghiệp vụ

### Quyền hủy đơn hàng:
- Có thể hủy khi đơn hàng ở trạng thái: `Pending`, `AwaitingPickup`

### Quyền yêu cầu hoàn tiền:
- Chỉ có thể yêu cầu hoàn tiền khi đơn hàng ở trạng thái: `Delivered`

### Trạng thái thanh toán:
- **Pending** - Chờ thanh toán
- **Completed** - Đã thanh toán
- **Failed** - Thanh toán thất bại
- **Refunded** - Đã hoàn tiền
- **PartiallyRefunded** - Hoàn tiền một phần
- **Cancelled** - Thanh toán đã hủy

## Cải thiện UX

### 1. Hiển thị trạng thái rõ ràng
- Icon trực quan cho từng trạng thái
- Mô tả chi tiết giúp user hiểu rõ tình trạng
- Màu sắc phân biệt các trạng thái

### 2. Timeline trạng thái
- Hiển thị tiến trình đơn hàng
- Chỉ ra bước hiện tại và các bước đã hoàn thành
- Hỗ trợ trạng thái đặc biệt (hủy, hoàn tiền)

### 3. Filter và tìm kiếm
- Tabs filter theo trạng thái
- Logic filter chính xác với các biến thể trạng thái
- Hỗ trợ cả tiếng Việt và tiếng Anh

## Tương thích Backend

### Mapping trạng thái:
- `order_status` từ backend được ưu tiên
- Fallback về `status` cũ nếu cần
- Hỗ trợ các biến thể: `awaiting_pickup`, `out_for_delivery`

### Dữ liệu mới:
- `refund_requested`, `refund_status`, `refund_reason`
- `assigned_shipper_id`, `assigned_shipper_name`, `shipper_ack`
- `shipping_address_snapshot`

## Kết luận

Việc cập nhật trạng thái đơn hàng đã:
1. **Đồng bộ hoàn toàn** với backend
2. **Cải thiện UX** với hiển thị trực quan và timeline
3. **Hỗ trợ đa ngôn ngữ** đầy đủ
4. **Mở rộng tính năng** với các trạng thái mới
5. **Duy trì tương thích** với dữ liệu cũ

Hệ thống hiện tại đã sẵn sàng xử lý tất cả các trạng thái đơn hàng từ backend một cách chính xác và trực quan.
