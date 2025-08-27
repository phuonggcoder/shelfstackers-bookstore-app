# Voucher System Frontend Integration Guide

## Overview

This guide provides step-by-step instructions for integrating the voucher system frontend components into your existing React Native app. The implementation includes all the components specified in your requirements.

## Components Created

### 1. VoucherInput Component (`components/VoucherInput.tsx`)
**Priority: High**

Allows users to manually input voucher codes with real-time validation.

**Features:**
- Manual voucher code input
- Real-time validation feedback
- Applied voucher display with remove option
- Error handling and loading states

**Usage:**
```tsx
<VoucherInput
  orderValue={500000}
  onVoucherApplied={(voucher, discountAmount) => {
    // Handle applied voucher
  }}
  onVoucherRemoved={() => {
    // Handle voucher removal
  }}
  appliedVoucher={currentVoucher}
/>
```

### 2. CheckoutSummary Component (`components/CheckoutSummary.tsx`)
**Priority: High**

Displays comprehensive order summary with voucher discounts.

**Features:**
- Order breakdown (subtotal, shipping, discounts)
- Applied vouchers list
- Total calculation with savings display
- Edit vouchers functionality

**Usage:**
```tsx
<CheckoutSummary
  subtotal={500000}
  shippingFee={30000}
  appliedVouchers={[
    { voucher: voucherData, discountAmount: 50000 }
  ]}
  onEditVouchers={() => setShowVoucherSelector(true)}
  showVoucherSection={true}
/>
```

### 3. VoucherSelectionScreen (`screens/VoucherSelectionScreen.tsx`)
**Priority: Medium**

Dedicated screen for browsing and selecting available vouchers.

**Features:**
- Categorized voucher display (discount vs shipping)
- Multiple voucher selection
- Validation and application
- Empty states and loading

**Usage:**
```tsx
navigation.navigate('VoucherSelection', {
  orderValue: 500000,
  shippingCost: 30000,
  onVouchersSelected: (result) => {
    // Handle selected vouchers
  }
});
```

### 4. MyVouchersScreen (`screens/MyVouchersScreen.tsx`)
**Priority: Medium**

User's voucher management page with usage history.

**Features:**
- Available vouchers tab
- Usage history tab
- Refresh functionality
- Detailed voucher information

**Usage:**
```tsx
navigation.navigate('MyVouchers');
```

### 5. VoucherNotification Component (`components/VoucherNotification.tsx`)
**Priority: Low**

Displays voucher promotions and notifications.

**Features:**
- Voucher availability notifications
- Preview of top vouchers
- Clickable to navigate to voucher selection

**Usage:**
```tsx
<VoucherNotification
  onVoucherPress={() => navigation.navigate('VoucherSelection')}
  showCount={true}
  maxCount={3}
/>
```

### 6. EnhancedCheckoutScreen (`components/EnhancedCheckoutScreen.tsx`)
**Priority: High**

Complete checkout flow example integrating all voucher components.

**Features:**
- Product summary
- Voucher input integration
- Checkout summary with vouchers
- Address and payment selection
- Complete payment flow

## Integration Steps

### Step 1: Update CartScreen

Replace the existing voucher bar in `screens/CartScreen.tsx`:

```tsx
// Replace this section in CartScreen.tsx
<TouchableOpacity style={styles.voucherBar} onPress={() => router.push('/allcategories')}>
  <Ionicons name="pricetag-outline" size={22} color="#3255FB" style={{ marginRight: 8 }} />
  <Text style={styles.voucherText}>{t('selectPromoCode')}</Text>
  <Ionicons name="chevron-forward" size={20} color="#888" style={{ marginLeft: 4 }} />
</TouchableOpacity>

// With this:
<TouchableOpacity 
  style={styles.voucherBar} 
  onPress={() => router.push('/voucher-selection', {
    orderValue: calculateTotal(),
    shippingCost: 30000, // Get from shipping calculation
    onVouchersSelected: (result) => {
      // Store voucher result for checkout
      setVoucherResult(result);
    }
  })}
>
  <Ionicons name="pricetag-outline" size={22} color="#3255FB" style={{ marginRight: 8 }} />
  <Text style={styles.voucherText}>
    {voucherResult ? `${voucherResult.results.length} voucher đã chọn` : t('selectPromoCode')}
  </Text>
  <Ionicons name="chevron-forward" size={20} color="#888" style={{ marginLeft: 4 }} />
</TouchableOpacity>
```

### Step 2: Update Order Review Screen

Integrate voucher components into `app/order-review.tsx`:

```tsx
// Add imports
import VoucherInput from '../components/VoucherInput';
import CheckoutSummary from '../components/CheckoutSummary';
import VoucherSelector from '../components/VoucherSelector';

// Add state for vouchers
const [appliedVouchers, setAppliedVouchers] = useState([]);
const [showVoucherSelector, setShowVoucherSelector] = useState(false);

// Add voucher handlers
const handleVoucherApplied = (voucher, discountAmount) => {
  setAppliedVouchers(prev => [...prev, { voucher, discountAmount }]);
};

const handleVoucherRemoved = () => {
  setAppliedVouchers([]);
};

// Replace the voucher section with:
<View style={styles.sectionRow}>
  <Text style={styles.sectionLabel}>Voucher</Text>
</View>
<VoucherInput
  orderValue={subtotal}
  onVoucherApplied={handleVoucherApplied}
  onVoucherRemoved={handleVoucherRemoved}
  appliedVoucher={appliedVouchers[0]?.voucher}
/>

// Replace the order summary section with:
<CheckoutSummary
  subtotal={subtotal}
  shippingFee={shippingFee}
  appliedVouchers={appliedVouchers}
  onEditVouchers={() => setShowVoucherSelector(true)}
  showVoucherSection={true}
/>

// Add VoucherSelector modal
<VoucherSelector
  visible={showVoucherSelector}
  orderValue={subtotal}
  shippingCost={shippingFee}
  onVouchersSelected={(result) => {
    const newAppliedVouchers = result.results
      .filter(v => v.valid)
      .map(v => ({
        voucher: v.voucher,
        discountAmount: v.discount_amount,
      }));
    setAppliedVouchers(newAppliedVouchers);
    setShowVoucherSelector(false);
  }}
  onClose={() => setShowVoucherSelector(false)}
/>
```

### Step 3: Add Navigation Routes

Add the new screens to your navigation configuration:

```tsx
// In your navigation stack
<Stack.Screen 
  name="VoucherSelection" 
  component={VoucherSelectionScreen}
  options={{ headerShown: false }}
/>
<Stack.Screen 
  name="MyVouchers" 
  component={MyVouchersScreen}
  options={{ headerShown: false }}
/>
```

### Step 4: Add Voucher Notification to Home Screen

Add voucher notifications to your home screen or main dashboard:

```tsx
// In your home screen
import VoucherNotification from '../components/VoucherNotification';

// Add to your render method
<VoucherNotification
  onVoucherPress={() => navigation.navigate('VoucherSelection')}
  showCount={true}
  maxCount={3}
/>
```

### Step 5: Add My Vouchers to User Menu

Add a menu item for "My Vouchers" in your user profile or settings screen:

```tsx
<TouchableOpacity 
  style={styles.menuItem} 
  onPress={() => navigation.navigate('MyVouchers')}
>
  <Ionicons name="ticket-outline" size={24} color="#3255FB" />
  <Text style={styles.menuText}>Voucher của tôi</Text>
  <Ionicons name="chevron-forward" size={20} color="#666" />
</TouchableOpacity>
```

## API Integration

### Required API Endpoints

Ensure your backend provides these endpoints:

1. **GET /api/vouchers/available** - Get available vouchers
2. **POST /api/vouchers/validate** - Validate single voucher
3. **POST /api/vouchers/validate-multiple** - Validate multiple vouchers
4. **POST /api/vouchers/use** - Use single voucher
5. **POST /api/vouchers/use-multiple** - Use multiple vouchers
6. **GET /api/vouchers/my-usage/:user_id** - Get user voucher usage history

### Service Layer

The components use the existing `voucherService.ts` file. Ensure it's properly configured with your API base URL and authentication.

## Styling and Theming

### Color Scheme

The components use your app's existing color scheme:
- Primary: `#3255FB` (Blue)
- Success: `#28a745` (Green)
- Danger: `#dc3545` (Red)
- Background: `#f8f9fa` (Light Gray)

### Consistent Styling

All components follow the same design patterns:
- Rounded corners (12px border radius)
- Consistent shadows and elevation
- Proper spacing and typography
- Responsive design for different screen sizes

## Testing

### Component Testing

Test each component individually:

1. **VoucherInput**: Test voucher code input, validation, and removal
2. **CheckoutSummary**: Test different voucher combinations and calculations
3. **VoucherSelectionScreen**: Test voucher browsing and selection
4. **MyVouchersScreen**: Test voucher history and availability
5. **VoucherNotification**: Test notification display and interaction

### Integration Testing

Test the complete flow:
1. Add items to cart
2. Navigate to checkout
3. Apply vouchers
4. Complete order with vouchers
5. Verify voucher usage in history

## Error Handling

### Common Error Scenarios

1. **Network Errors**: Components show appropriate error messages
2. **Invalid Vouchers**: Clear validation feedback
3. **Expired Vouchers**: Automatic filtering and user notification
4. **Insufficient Order Value**: Clear minimum order requirements

### User Feedback

- Loading states for all async operations
- Error messages with actionable suggestions
- Success confirmations for voucher applications
- Clear validation feedback for invalid inputs

## Performance Considerations

### Optimization Tips

1. **Lazy Loading**: Voucher lists are loaded on demand
2. **Caching**: Voucher data can be cached locally
3. **Debouncing**: Input validation is debounced to reduce API calls
4. **Pagination**: Large voucher lists can be paginated

### Memory Management

- Proper cleanup of event listeners
- Unmounting of modals and overlays
- Clearing state when components unmount

## Deployment Checklist

- [ ] All components are properly imported and exported
- [ ] Navigation routes are configured
- [ ] API endpoints are working and tested
- [ ] Error handling is implemented
- [ ] Loading states are working
- [ ] Styling is consistent across devices
- [ ] Voucher calculations are accurate
- [ ] User flow is smooth and intuitive

## Support and Maintenance

### Monitoring

- Track voucher usage and conversion rates
- Monitor API performance and error rates
- User feedback and satisfaction metrics

### Updates

- Regular updates to voucher validation logic
- UI/UX improvements based on user feedback
- Performance optimizations as needed

## Conclusion

This implementation provides a complete voucher system frontend that integrates seamlessly with your existing app. The components are modular, reusable, and follow React Native best practices. The system supports both manual voucher input and voucher selection, with comprehensive validation and user feedback.

For any questions or issues, refer to the individual component documentation or the backend API documentation.
