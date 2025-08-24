# 🧪 Hướng dẫn Test PayOS Payment - Complete Guide

## 📋 Tổng quan

Hướng dẫn này sẽ giúp bạn test chức năng thanh toán PayOS một cách toàn diện, bao gồm QR code, WebView, và refund functionality.

## ✅ Trạng thái Hiện tại

### Frontend (✅ Hoàn thành)
- ✅ PayOS screen với QR code display
- ✅ WebView integration cho checkout
- ✅ Mock service cho testing
- ✅ Error handling và loading states
- ✅ Bank info display với copy functionality
- ✅ Navigation giữa QR và WebView modes

### Backend (🔄 Cần implement)
- ⏳ POST /api/payments/create endpoint
- ⏳ PayOS API integration
- ⏳ Refund endpoints
- ⏳ Webhook handling

## 🚀 Quick Start Test

### 1. Test Mock Service (Frontend Only)

```bash
# Chạy test script
cd guide/scriptTest
node test-payos-payment.js
```

### 2. Test trong App

1. **Tạo đơn hàng test**
2. **Chọn PayOS làm phương thức thanh toán**
3. **Kiểm tra QR code và bank info hiển thị**
4. **Test WebView mode**
5. **Verify navigation flow**

## 🔧 Cấu hình Environment

### Frontend Environment Variables
```bash
# .env file
API_BASE_URL=http://localhost:3000
PAYOS_SANDBOX_URL=https://sandbox.payos.vn
```

### Backend Environment Variables (Khi implement)
```bash
# .env file
PAYOS_CLIENT_ID=your_client_id
PAYOS_API_KEY=your_api_key
PAYOS_CHECKSUM_KEY=your_checksum_key
PAYOS_SANDBOX_URL=https://api-merchant-sandbox.payos.vn
```

## 🧪 Test Cases

### Test Case 1: QR Code Display
**Mục tiêu**: Kiểm tra QR code hiển thị đúng và có thể quét được

**Các bước**:
1. Vào PayOS payment screen
2. Kiểm tra QR code hiển thị trong WebView
3. Verify QR code có thể quét bằng app ngân hàng
4. Kiểm tra bank info hiển thị đầy đủ

**Expected Result**:
- ✅ QR code hiển thị rõ ràng
- ✅ Bank info đầy đủ và chính xác
- ✅ Copy functionality hoạt động

### Test Case 2: WebView Integration
**Mục tiêu**: Kiểm tra WebView load PayOS checkout page

**Các bước**:
1. Nhấn "Thanh toán qua WebView"
2. Kiểm tra WebView load checkout URL
3. Test navigation trong WebView
4. Verify deep link handling

**Expected Result**:
- ✅ WebView load thành công
- ✅ Checkout page hiển thị đúng
- ✅ Navigation hoạt động
- ✅ Deep link redirect đúng

### Test Case 3: Error Handling
**Mục tiêu**: Kiểm tra error handling khi API fail

**Các bước**:
1. Simulate network error
2. Test invalid order ID
3. Test expired payment
4. Verify error messages

**Expected Result**:
- ✅ Error messages hiển thị rõ ràng
- ✅ Retry functionality hoạt động
- ✅ User có thể quay lại

### Test Case 4: Payment Success Flow
**Mục tiêu**: Kiểm tra flow khi thanh toán thành công

**Các bước**:
1. Complete payment (mock)
2. Verify redirect to order success
3. Check order status update
4. Test notification

**Expected Result**:
- ✅ Redirect to order success page
- ✅ Order status updated
- ✅ Success notification hiển thị

## 📱 UI/UX Test Checklist

### QR Code Screen
- [ ] QR code hiển thị rõ ràng và đúng kích thước
- [ ] Bank info layout đẹp và dễ đọc
- [ ] Copy buttons hoạt động
- [ ] Amount hiển thị đúng format
- [ ] Description text đúng

### WebView Screen
- [ ] Header có back button
- [ ] Loading indicator hiển thị
- [ ] WebView responsive
- [ ] Navigation smooth
- [ ] Error handling tốt

### General
- [ ] Loading states đẹp
- [ ] Error messages rõ ràng
- [ ] Buttons có proper styling
- [ ] Navigation flow mượt mà
- [ ] Responsive trên các screen sizes

## 🔍 Debug Commands

### Frontend Debug
```javascript
// Trong PayOS screen
console.log('PayOS response:', res);
console.log('QR URL:', qrUrl);
console.log('Bank info:', bankInfo);
console.log('Checkout URL:', checkoutUrl);
```

### Network Debug
```bash
# Test API endpoint
curl -X POST http://localhost:3000/api/payments/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"order_id":"test","payment_method":"PAYOS"}'
```

### QR Code Debug
```bash
# Test QR code URL
curl -I https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=TEST
```

## 🐛 Troubleshooting

### Lỗi thường gặp:

#### 1. QR Code không hiển thị
**Nguyên nhân**: WebView không load được QR URL
**Giải pháp**:
- Kiểm tra QR URL có valid không
- Verify WebView permissions
- Check network connectivity

#### 2. WebView không load
**Nguyên nhân**: Checkout URL không accessible
**Giải pháp**:
- Verify checkout URL
- Check CORS settings
- Test URL trong browser

#### 3. Bank info không hiển thị
**Nguyên nhân**: Response structure không đúng
**Giải pháp**:
- Check API response format
- Verify bank_info object structure
- Debug response parsing

#### 4. Navigation không hoạt động
**Nguyên nhân**: Deep link handling issue
**Giải pháp**:
- Check deep link configuration
- Verify URL patterns
- Test deep link manually

## 📊 Performance Testing

### Load Time Targets
- QR code load: < 2 seconds
- WebView load: < 3 seconds
- Bank info display: < 1 second
- Error handling: < 1 second

### Memory Usage
- Monitor WebView memory usage
- Check for memory leaks
- Optimize image loading

## 🔄 Integration Testing

### Backend Integration (Khi ready)
1. **Test real PayOS API**
2. **Verify webhook handling**
3. **Test refund flow**
4. **Check database updates**

### Payment Gateway Integration
1. **Test sandbox environment**
2. **Verify production credentials**
3. **Test webhook callbacks**
4. **Monitor transaction logs**

## 📈 Monitoring & Analytics

### Key Metrics
- Payment success rate
- QR code scan rate
- WebView completion rate
- Error rate by type
- User drop-off points

### Logging
```javascript
// Add logging for key events
console.log('PayOS payment initiated:', { orderId, amount });
console.log('QR code displayed:', { qrUrl });
console.log('WebView loaded:', { checkoutUrl });
console.log('Payment completed:', { orderId, status });
```

## 🎯 Next Steps

### Immediate (Frontend)
1. ✅ Complete UI/UX improvements
2. ✅ Add loading animations
3. ✅ Improve error messages
4. ✅ Add accessibility features

### Backend Integration
1. ⏳ Implement /api/payments/create
2. ⏳ Add PayOS SDK integration
3. ⏳ Create webhook handlers
4. ⏳ Add refund endpoints

### Production Ready
1. ⏳ Add proper error handling
2. ⏳ Implement retry logic
3. ⏳ Add monitoring
4. ⏳ Security audit

## 📞 Support

### Development Issues
1. Check console logs
2. Verify API responses
3. Test network connectivity
4. Review error messages

### PayOS Support
- Documentation: https://docs.payos.vn
- Sandbox: https://sandbox.payos.vn
- Support: support@payos.vn

---

**Lưu ý**: Đây là hướng dẫn test cho development environment. Trong production, cần thay đổi URLs và credentials tương ứng.

