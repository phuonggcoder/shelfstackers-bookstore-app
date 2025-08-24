# Shipper Rating System Implementation

## Overview
The shipper rating system allows users to rate and review delivery personnel (shippers) after their orders are completed. This system provides transparency and accountability for delivery services.

## Features Implemented

### 1. Core Components

#### ShipperRatingModal
- **Location**: `components/ShipperRatingModal.tsx`
- **Purpose**: Modal for rating shippers with star rating, prompts selection, comments, and anonymous option
- **Features**:
  - 5-star rating system
  - Multiple prompt selection (positive/negative/neutral categories)
  - Optional comment field (500 character limit)
  - Anonymous rating option
  - Edit existing ratings
  - Form validation

#### ShipperRatingDisplay
- **Location**: `components/ShipperRatingDisplay.tsx`
- **Purpose**: Display shipper rating summary and statistics
- **Features**:
  - Average rating display
  - Total ratings count
  - Rating distribution chart
  - Compact and detailed view modes
  - Color-coded rating indicators

#### ShipperRatingList
- **Location**: `components/ShipperRatingList.tsx`
- **Purpose**: Display list of shipper ratings with pagination
- **Features**:
  - Paginated rating list
  - User and order information display
  - Anonymous rating indicators
  - Edited rating badges
  - Pull-to-refresh functionality
  - Infinite scroll for loading more ratings

### 2. Service Layer

#### ShipperRatingService
- **Location**: `services/shipperRatingService.ts`
- **Purpose**: API service for shipper rating operations
- **Endpoints**:
  - `GET /api/shipper-ratings/prompts` - Get rating prompts
  - `POST /api/shipper-ratings/rate` - Create new rating
  - `GET /api/shipper-ratings/order/:orderId` - Get order rating
  - `GET /api/shipper-ratings/shipper/:shipperId` - Get shipper ratings
  - `GET /api/shipper-ratings/shipper/:shipperId/summary` - Get rating summary
  - `GET /api/shipper-ratings/my-ratings` - Get user's ratings
  - `PUT /api/shipper-ratings/update/:orderId` - Update rating
  - `DELETE /api/shipper-ratings/delete/:orderId` - Delete rating
  - `GET /api/shipper-ratings/can-rate/:orderId` - Check rating eligibility

### 3. Custom Hooks

#### useShipperRating
- **Location**: `hooks/useShipperRating.ts`
- **Purpose**: Hook for managing shipper rating data
- **Features**:
  - Fetch shipper rating summary
  - Loading and error states
  - Refetch functionality

#### useRatingModal
- **Purpose**: Hook for managing rating modal state
- **Features**:
  - Modal open/close state
  - Order and shipper data management
  - Prompts loading
  - Existing rating handling

#### useShipperRatingsList
- **Purpose**: Hook for managing shipper ratings list
- **Features**:
  - Paginated ratings fetching
  - Load more functionality
  - Refresh capability
  - Error handling

#### useMyRatings
- **Purpose**: Hook for managing user's own ratings
- **Features**:
  - User's rating history
  - Pagination support
  - Refresh and load more

#### useRatingSubmission
- **Purpose**: Hook for rating submission operations
- **Features**:
  - Create new ratings
  - Update existing ratings
  - Delete ratings
  - Loading states and error handling

#### useCanRateShipper
- **Purpose**: Hook for checking rating eligibility
- **Features**:
  - Check if user can rate a shipper
  - Get existing rating if any
  - Reason for inability to rate

### 4. Pages

#### My Ratings Page
- **Location**: `app/my-ratings.tsx`
- **Purpose**: Display user's shipper rating history
- **Features**:
  - Rating summary statistics
  - List of user's ratings
  - Navigation to order details
  - Pull-to-refresh

#### Test Page
- **Location**: `app/shipper-rating-test.tsx`
- **Purpose**: Test and demonstrate rating system functionality
- **Features**:
  - Test all rating components
  - Sample data demonstration
  - Modal testing

### 5. Integration

#### Order Detail Page Integration
- **Location**: `app/order-detail.tsx`
- **Integration Points**:
  - Shipper rating button for completed orders
  - Rating modal integration
  - Eligibility checking
  - UI updates after rating submission

#### Profile Page Integration
- **Location**: `app/(tabs)/profile.tsx`
- **Integration Points**:
  - Navigation to "My Shipper Ratings" page
  - Menu item with car icon

## Data Models

### ShipperRating Interface
```typescript
interface ShipperRating {
  _id: string;
  order_id: string | { _id: string; order_code?: string; };
  shipper_id: string | { _id: string; full_name?: string; phone_number?: string; };
  user_id: string | { _id: string; name: string; avatar?: string; };
  rating: number;
  selected_prompts: string[];
  comment?: string;
  is_anonymous: boolean;
  is_edited: boolean;
  edited_at?: Date;
  is_deleted: boolean;
  deleted_at?: Date;
  createdAt: string;
  updatedAt: string;
  timeAgo?: string;
}
```

### ShipperRatingSummary Interface
```typescript
interface ShipperRatingSummary {
  averageRating: number;
  totalRatings: number;
  ratingCounts: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  promptStats: {
    [promptId: string]: number;
  };
}
```

## Translation Support

### English Translations
- **Location**: `app/locales/en/en.json`
- **Coverage**: All UI text, error messages, and user feedback

### Vietnamese Translations
- **Location**: `app/locales/vi/vi.json`
- **Coverage**: Complete Vietnamese localization

### Key Translation Keys
- Rating-related: `rateShipper`, `editShipperRating`, `rateYourExperience`
- UI elements: `selectRating`, `stars`, `additionalComments`
- Status messages: `ratingSubmittedSuccessfully`, `failedToSubmitRating`
- Time formatting: `yesterday`, `daysAgo`, `weeksAgo`, etc.

## Usage Examples

### Rating a Shipper
```typescript
import { useRatingModal } from '../hooks/useShipperRating';

const { openModal } = useRatingModal();

const handleRateShipper = () => {
  const shipperData = {
    _id: order.assigned_shipper_id,
    full_name: order.assigned_shipper_name,
    phone_number: order.assigned_shipper_phone
  };
  
  openModal(order, shipperData, existingRating);
};
```

### Displaying Shipper Rating
```typescript
import ShipperRatingDisplay from '../components/ShipperRatingDisplay';

<ShipperRatingDisplay
  shipperId={shipperId}
  showDetails={true}
  compact={false}
  onViewAllPress={() => navigation.navigate('shipper-ratings')}
/>
```

### Listing Ratings
```typescript
import ShipperRatingList from '../components/ShipperRatingList';

<ShipperRatingList
  shipperId={shipperId}
  showUserInfo={true}
  showOrderInfo={true}
  isMyRatings={false}
  onRatingPress={(rating) => console.log(rating)}
/>
```

## API Endpoints

### Base URL
```
https://server-shelf-stacker-w1ds.onrender.com/api
```

### Authentication
All endpoints require Bearer token authentication:
```
Authorization: Bearer <token>
```

### Response Format
```json
{
  "success": true,
  "data": { ... },
  "message": "Success message"
}
```

## Error Handling

### Network Errors
- Automatic retry with exponential backoff
- User-friendly error messages
- Offline state handling

### Validation Errors
- Form validation with real-time feedback
- Server-side validation error display
- Required field highlighting

### Permission Errors
- Authentication state checking
- Rating eligibility validation
- User-friendly permission messages

## Future Enhancements

### Planned Features
1. **Rating Analytics Dashboard** - For shippers to view their performance
2. **Rating Notifications** - Real-time notifications for new ratings
3. **Rating Filters** - Filter ratings by date, rating value, etc.
4. **Rating Export** - Export rating data for analysis
5. **Rating Moderation** - Admin tools for managing inappropriate ratings

### Performance Optimizations
1. **Caching** - Cache rating data to reduce API calls
2. **Lazy Loading** - Implement lazy loading for rating lists
3. **Image Optimization** - Optimize user avatar loading
4. **Bundle Splitting** - Split rating components into separate bundles

## Testing

### Test Page
- **Location**: `app/shipper-rating-test.tsx`
- **Purpose**: Manual testing of all rating components
- **Features**:
  - Test rating modal functionality
  - Test rating display components
  - Test rating list components
  - Sample data demonstration

### Unit Tests (Future)
- Component rendering tests
- Hook functionality tests
- Service API tests
- Error handling tests

## Deployment Notes

### Environment Variables
- `API_BASE_URL` - Backend API base URL
- `RATING_ENABLED` - Feature flag for rating system

### Build Configuration
- No additional build steps required
- Uses existing React Native configuration
- Compatible with Expo and bare React Native

### Dependencies
- `@react-native-async-storage/async-storage` - Token storage
- `react-i18next` - Internationalization
- `expo-router` - Navigation
- `@expo/vector-icons` - Icons

## Support and Maintenance

### Monitoring
- API response times
- Error rates
- User engagement metrics
- Rating distribution analytics

### Maintenance Tasks
- Regular API endpoint health checks
- Translation updates
- Performance monitoring
- User feedback collection

### Troubleshooting
- Common error scenarios and solutions
- Debug logging implementation
- User support documentation
- Developer debugging tools
