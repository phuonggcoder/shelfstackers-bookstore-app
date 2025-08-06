# 🧪 Hướng Dẫn Test Migration UnifiedCustomComponent

## 📋 Tổng Quan
Hướng dẫn này sẽ giúp bạn test từng component đã được migrate từ `Alert.alert()` sang `UnifiedCustomComponent` để đảm bảo tất cả hoạt động bình thường.

---

## 🎯 **Phase 1: Authentication System**

### 1.1 Test Login (`app/(auth)/login.tsx`)
**Các thông báo cần test:**
- ❌ **Lỗi validation:** Nhập sai email/password
- ❌ **Lỗi đăng nhập:** Email không tồn tại
- ❌ **Lỗi mạng:** Không có internet
- ✅ **Thành công:** Đăng nhập thành công

**Cách test:**
1. Vào màn hình Login
2. Nhập email sai format → Nhấn "Đăng nhập"
3. Nhập email không tồn tại → Nhấn "Đăng nhập"
4. Tắt internet → Nhấn "Đăng nhập"
5. Nhập thông tin đúng → Nhấn "Đăng nhập"

### 1.2 Test Register (`app/(auth)/register.tsx`)
**Các thông báo cần test:**
- ❌ **Lỗi validation:** Email đã tồn tại
- ❌ **Lỗi mật khẩu:** Mật khẩu không khớp
- ❌ **Lỗi mạng:** Không có internet
- ✅ **Thành công:** Đăng ký thành công

**Cách test:**
1. Vào màn hình Register
2. Nhập email đã tồn tại → Nhấn "Đăng ký"
3. Nhập mật khẩu không khớp → Nhấn "Đăng ký"
4. Tắt internet → Nhấn "Đăng ký"
5. Nhập thông tin hợp lệ → Nhấn "Đăng ký"

### 1.3 Test Change Password (`app/ChangePassword.tsx`)
**Các thông báo cần test:**
- ❌ **Lỗi mật khẩu cũ:** Sai mật khẩu hiện tại
- ❌ **Lỗi mật khẩu mới:** Mật khẩu mới không khớp
- ✅ **Thành công:** Đổi mật khẩu thành công

**Cách test:**
1. Vào Profile → Change Password
2. Nhập sai mật khẩu hiện tại → Nhấn "Đổi mật khẩu"
3. Nhập mật khẩu mới không khớp → Nhấn "Đổi mật khẩu"
4. Nhập đúng thông tin → Nhấn "Đổi mật khẩu"

---

## 🛒 **Phase 2: Cart System**

### 2.1 Test Cart (`app/cart.tsx`)
**Các thông báo cần test:**
- ⚠️ **Xác nhận xóa:** Xóa sản phẩm khỏi giỏ hàng
- ❌ **Lỗi xóa:** Không thể xóa sản phẩm
- ❌ **Lỗi cập nhật:** Không thể cập nhật số lượng

**Cách test:**
1. Vào giỏ hàng có sản phẩm
2. Nhấn nút xóa sản phẩm → Chọn "Xóa"
3. Thay đổi số lượng sản phẩm
4. Tắt internet → Thử xóa/cập nhật

---

## 📦 **Phase 3: Order System**

### 3.1 Test Order Review (`app/order-review.tsx`)
**Các thông báo cần test:**
- ❌ **Lỗi validation:** Thiếu thông tin giao hàng
- ❌ **Lỗi voucher:** Voucher không hợp lệ
- ❌ **Lỗi đặt hàng:** Không thể tạo đơn hàng
- ✅ **Thành công:** Đặt hàng thành công

**Cách test:**
1. Vào Order Review
2. Bỏ trống địa chỉ giao hàng → Nhấn "Đặt hàng"
3. Nhập voucher sai → Nhấn "Áp dụng"
4. Tắt internet → Nhấn "Đặt hàng"
5. Điền đầy đủ thông tin → Nhấn "Đặt hàng"

### 3.2 Test Order Detail (`app/order-detail.tsx`)
**Các thông báo cần test:**
- ⚠️ **Xác nhận hủy:** Hủy đơn hàng
- ❌ **Lỗi hủy:** Không thể hủy đơn hàng
- ✅ **Thành công:** Hủy đơn hàng thành công

**Cách test:**
1. Vào Order History → Chọn đơn hàng
2. Nhấn "Hủy đơn hàng" → Chọn "Đồng ý"
3. Tắt internet → Thử hủy đơn hàng

### 3.3 Test Order Success (`app/order-success.tsx`)
**Các thông báo cần test:**
- ✅ **Thành công:** Đặt hàng thành công
- ❌ **Lỗi thanh toán:** Thanh toán thất bại

**Cách test:**
1. Hoàn thành đặt hàng → Kiểm tra thông báo thành công
2. Thử thanh toán với thẻ sai → Kiểm tra thông báo lỗi

### 3.4 Test Zalo Pay (`app/zalo-pay.tsx`)
**Các thông báo cần test:**
- ❌ **Lỗi thanh toán:** Không thể kết nối Zalo Pay
- ❌ **Lỗi validation:** Số tiền không hợp lệ
- ✅ **Thành công:** Thanh toán thành công

**Cách test:**
1. Vào Zalo Pay
2. Nhập số tiền sai → Nhấn "Thanh toán"
3. Tắt internet → Nhấn "Thanh toán"
4. Nhập thông tin đúng → Nhấn "Thanh toán"

---

## ⭐ **Phase 4: Review System**

### 4.1 Test My Reviews (`app/my-reviews.tsx`)
**Các thông báo cần test:**
- ❌ **Lỗi tải:** Không thể tải danh sách đánh giá
- ⚠️ **Xác nhận xóa:** Xóa đánh giá
- ✅ **Thành công:** Xóa đánh giá thành công
- ❌ **Lỗi xóa:** Không thể xóa đánh giá

**Cách test:**
1. Vào My Reviews
2. Tắt internet → Refresh trang
3. Nhấn nút xóa đánh giá → Chọn "Xóa"
4. Tắt internet → Thử xóa đánh giá

### 4.2 Test Product Reviews (`app/product-reviews.tsx`)
**Các thông báo cần test:**
- ❌ **Lỗi tải:** Không thể tải đánh giá
- ❌ **Lỗi gửi:** Không thể gửi đánh giá
- ✅ **Thành công:** Xóa đánh giá thành công
- ❌ **Lỗi xóa:** Không thể xóa đánh giá

**Cách test:**
1. Vào chi tiết sản phẩm → Tab Reviews
2. Tắt internet → Refresh trang
3. Gửi đánh giá → Tắt internet trước khi gửi
4. Xóa đánh giá → Tắt internet trước khi xóa

---

## 💳 **Phase 5: Payment & Vouchers**

### 5.1 Test Order Payment Screen (`screens/OrderPaymentScreen.tsx`)
**Các thông báo cần test:**
- ✅ **Thành công:** Đặt hàng và thanh toán thành công
- ❌ **Lỗi:** Không thể đặt hàng/thanh toán

**Cách test:**
1. Vào Order Payment
2. Chọn phương thức thanh toán → Nhấn "Thanh toán"
3. Tắt internet → Nhấn "Thanh toán"

### 5.2 Test Campaign (`app/campaign/[id].tsx`)
**Các thông báo cần test:**
- ⚠️ **Cảnh báo:** Cần đăng nhập để sử dụng voucher
- ✅ **Thành công:** Chọn voucher thành công

**Cách test:**
1. Vào Campaign (chưa đăng nhập)
2. Nhấn chọn voucher → Kiểm tra thông báo đăng nhập
3. Đăng nhập → Chọn voucher → Kiểm tra thông báo thành công

---

## ⚙️ **Phase 6: Settings & Profile**

### 6.1 Test Auth Context (`context/AuthContext.tsx`)
**Các thông báo cần test:**
- ✅ **Thành công:** Đăng nhập thành công
- ❌ **Lỗi xác thực:** Không thể hoàn thành xác thực
- ❌ **Lỗi đăng xuất:** Không thể đăng xuất
- ❌ **Lỗi đăng ký:** Đăng ký thất bại
- ✅ **Thành công:** Cập nhật thông tin thành công
- ❌ **Lỗi cập nhật:** Cập nhật thông tin thất bại

**Cách test:**
1. Đăng nhập/đăng ký → Kiểm tra thông báo
2. Cập nhật profile → Tắt internet → Nhấn "Lưu"
3. Đăng xuất → Tắt internet → Nhấn "Đăng xuất"

### 6.2 Test OTP Login (`components/OTPLogin.tsx`)
**Các thông báo cần test:**
- ❌ **Lỗi validation:** Số điện thoại không hợp lệ
- ✅ **Thành công:** Gửi OTP thành công
- ❌ **Lỗi gửi OTP:** Không thể gửi OTP
- ❌ **Lỗi validation:** Mã OTP không đúng format
- ✅ **Thành công:** Đăng nhập thành công
- ❌ **Lỗi OTP:** Mã OTP không đúng

**Cách test:**
1. Nhập số điện thoại sai format → Nhấn "Gửi OTP"
2. Nhập số điện thoại đúng → Nhấn "Gửi OTP"
3. Tắt internet → Nhấn "Gửi OTP"
4. Nhập OTP sai format → Nhấn "Xác nhận"
5. Nhập OTP đúng → Nhấn "Xác nhận"
6. Nhập OTP sai → Nhấn "Xác nhận"

---

## 🔐 **Phase 7: Google Authentication**

### 7.1 Test Google Sign In Button (`components/GoogleSignInButton.tsx`)
**Các thông báo cần test:**
- ❌ **Lỗi đăng nhập:** Đăng nhập Google thất bại
- ❌ **Lỗi Play Services:** Google Play Services không khả dụng
- ❌ **Lỗi xác thực:** Không thể xác thực với Google
- ❌ **Lỗi mạng:** Không thể kết nối server

**Cách test:**
1. Nhấn "Đăng nhập với Google"
2. Hủy quá trình đăng nhập
3. Tắt internet → Nhấn "Đăng nhập với Google"
4. Đăng nhập thành công

### 7.2 Test Google Sign In With Account Picker (`components/GoogleSignInWithAccountPicker.tsx`)
**Các thông báo cần test:**
- ❌ **Lỗi đăng nhập:** Đăng nhập Google thất bại
- ❌ **Lỗi Play Services:** Google Play Services không khả dụng
- ❌ **Lỗi xác thực:** Không thể xác thực với Google
- ❌ **Lỗi mạng:** Không thể kết nối server

**Cách test:**
1. Nhấn "Chọn tài khoản Google"
2. Chọn tài khoản → Hủy
3. Tắt internet → Nhấn "Chọn tài khoản Google"
4. Chọn tài khoản → Đăng nhập thành công

---

## 📍 **Phase 8: Address Management**

### 8.1 Test Address List (`app/address-list.tsx`)
**Các thông báo cần test:**
- ❌ **Lỗi:** Không thể đặt địa chỉ mặc định
- ❌ **Lỗi:** Vui lòng chọn một địa chỉ

**Cách test:**
1. Vào Address List
2. Nhấn nút "Mặc định" → Tắt internet
3. Chọn địa chỉ → Nhấn "Xác nhận" (không chọn địa chỉ nào)

### 8.2 Test Add Address (`app/add-address.tsx`)
**Các thông báo cần test:**
- ❌ **Lỗi:** Vui lòng đăng nhập để thêm địa chỉ
- ❌ **Lỗi validation:** Thiếu thông tin bắt buộc
- ✅ **Thành công:** Thêm địa chỉ thành công
- ❌ **Lỗi:** Không thể thêm địa chỉ

**Cách test:**
1. Vào Add Address (chưa đăng nhập)
2. Nhấn "Hoàn thành" → Kiểm tra thông báo đăng nhập
3. Đăng nhập → Bỏ trống các trường bắt buộc → Nhấn "Hoàn thành"
4. Điền đầy đủ thông tin → Nhấn "Hoàn thành"
5. Tắt internet → Nhấn "Hoàn thành"

---

## 🎨 **Test Visual Components**

### Test UnifiedCustomComponent Types:
1. **Alert:** Thông báo đơn giản với 1 nút
2. **Dialog:** Thông báo với 2 nút (Xác nhận/Hủy)
3. **Popup:** Modal overlay với nội dung tùy chỉnh
4. **Toast:** Thông báo nhỏ ở góc màn hình

### Test Modes:
- **success:** Màu xanh lá, icon check
- **error:** Màu đỏ, icon error
- **warning:** Màu cam, icon warning
- **info:** Màu xanh dương, icon info

---

## 📝 **Checklist Test**

### ✅ **Trước khi test:**
- [ ] Đảm bảo app đã compile thành công
- [ ] Kiểm tra internet connection
- [ ] Chuẩn bị tài khoản test

### ✅ **Trong khi test:**
- [ ] Test từng thông báo theo hướng dẫn
- [ ] Kiểm tra giao diện thông báo
- [ ] Kiểm tra animation hiển thị/ẩn
- [ ] Kiểm tra responsive trên các kích thước màn hình

### ✅ **Sau khi test:**
- [ ] Ghi chú các lỗi phát hiện
- [ ] Kiểm tra console log
- [ ] Báo cáo kết quả test

---

## 🚨 **Lưu ý quan trọng:**

1. **Test offline:** Tắt internet để test các trường hợp lỗi mạng
2. **Test validation:** Nhập dữ liệu sai để test validation
3. **Test edge cases:** Test các trường hợp biên
4. **Test performance:** Kiểm tra không có memory leak
5. **Test accessibility:** Đảm bảo thông báo có thể đọc được

---

## 📞 **Hỗ trợ:**

Nếu gặp vấn đề trong quá trình test, hãy:
1. Kiểm tra console log
2. Chụp ảnh lỗi
3. Ghi chú các bước thực hiện
4. Báo cáo chi tiết vấn đề

**Chúc bạn test thành công! 🎉** 