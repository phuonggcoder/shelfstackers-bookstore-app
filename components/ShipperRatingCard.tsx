import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useCanRateShipper } from '../hooks/useShipperRating';
import RatingStars from './RatingStars';

interface ShipperRatingCardProps {
  orderId: string;
  orderStatus: string;
  shipperInfo?: {
    _id: string;
    full_name?: string;
    phone_number?: string;
  };
  onRatePress: () => void;
}

const ShipperRatingCard: React.FC<ShipperRatingCardProps> = ({
  orderId,
  orderStatus,
  shipperInfo,
  onRatePress
}) => {
  const { t } = useTranslation();
  const { canRate, existingRating, loading, error } = useCanRateShipper(orderId);

  // Chỉ hiển thị khi đơn hàng đã giao hoặc đã trả
  const allowedStatuses = ['delivered', 'returned'];
  if (!orderStatus || !allowedStatuses.includes(orderStatus.toLowerCase())) {
    return null;
  }

  // Chỉ cho phép đánh giá khi đơn hàng đã giao (không phải đã trả)
  const canRateOrder = orderStatus?.toLowerCase() === 'delivered';

  // Không hiển thị nếu không có shipper
  if (!shipperInfo?._id) {
    return null;
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="hourglass-outline" size={24} color="#667eea" />
          <Text style={styles.loadingText}>{t('checkingRatingStatus')}</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={24} color="#e74c3c" />
          <Text style={styles.errorText}>
            {error.includes('login') ? t('pleaseLoginToRateShipper') : t('errorCheckingRating')}
          </Text>
        </View>
      </View>
    );
  }

  // Helper function để kiểm tra có thể chỉnh sửa đánh giá không (trong 24h và chỉ 1 lần)
  const canEditRating = (rating: any) => {
    if (!rating?.created_at) return false;
    
    // Nếu đã có updated_at, nghĩa là đã chỉnh sửa rồi -> không cho phép chỉnh sửa nữa
    if (rating.updated_at && rating.updated_at !== rating.created_at) {
      return false;
    }
    
    const createdAt = new Date(rating.created_at);
    const now = new Date();
    const timeDiff = now.getTime() - createdAt.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    
    return hoursDiff <= 24;
  };

  // Nếu đã có đánh giá
  if (existingRating) {
    const canEdit = canEditRating(existingRating);
    
    return (
      <View style={styles.container}>
        <View style={styles.ratingHeader}>
          <Text style={styles.ratingTitle}>{t('yourRating')}</Text>
          {canEdit ? (
            <TouchableOpacity style={styles.editButton} onPress={onRatePress}>
              <Ionicons name="create-outline" size={20} color="#667eea" />
              <Text style={styles.editButtonText}>{t('editRating')}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.timeExpiredContainer}>
              <Ionicons name="time-outline" size={16} color="#95a5a6" />
              <Text style={styles.timeExpiredText}>{t('editTimeExpired')}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.ratingDisplay}>
          <RatingStars
            rating={existingRating.rating}
            readonly
            size={20}
            color="#FFD700"
          />
          <Text style={styles.ratingText}>
            {existingRating.rating}/5 {t('stars')}
          </Text>
        </View>
        
        {existingRating.comment && (
          <Text style={styles.commentText} numberOfLines={2}>
            "{existingRating.comment}"
          </Text>
        )}
        
        {existingRating.selected_prompts && existingRating.selected_prompts.length > 0 && (
          <View style={styles.promptsContainer}>
            {existingRating.selected_prompts.slice(0, 3).map((prompt, index) => (
              <View key={index} style={styles.promptChip}>
                <Text style={styles.promptText}>{prompt}</Text>
              </View>
            ))}
            {existingRating.selected_prompts.length > 3 && (
              <Text style={styles.morePromptsText}>
                +{existingRating.selected_prompts.length - 3} {t('more')}
              </Text>
            )}
          </View>
        )}
      </View>
    );
  }

  // Nếu có thể đánh giá và đơn hàng đã giao (không phải đã trả)
  if (canRate && canRateOrder) {
    return (
      <View style={styles.container}>
        <View style={styles.ratingPrompt}>
          <Text style={styles.ratingPromptTitle}>{t('rateShipper')}</Text>
          <Text style={styles.ratingPromptSubtitle}>
            {t('shareYourExperienceWithShipper')}
          </Text>
          
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons
                key={star}
                name="star-outline"
                size={24}
                color="#FFD700"
              />
            ))}
          </View>
          
          <TouchableOpacity style={styles.rateButton} onPress={onRatePress}>
            <Ionicons name="star" size={20} color="white" />
            <Text style={styles.rateButtonText}>{t('rateNow')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Nếu đơn hàng đã trả và không có đánh giá, hiển thị thông báo
  if (!canRate && !existingRating && !canRateOrder) {
    return (
      <View style={styles.container}>
        <View style={styles.returnedOrderContainer}>
          <Ionicons name="information-circle-outline" size={24} color="#95a5a6" />
          <Text style={styles.returnedOrderText}>{t('orderReturnedNoRating')}</Text>
        </View>
      </View>
    );
  }

  // Nếu không thể đánh giá
  return null;
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginLeft: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#e74c3c',
    marginLeft: 8,
  },
  ratingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  shipperInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  shipperAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f3f4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  shipperDetails: {
    flex: 1,
  },
  shipperName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  shipperPhone: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 2,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editButtonText: {
    fontSize: 14,
    color: '#667eea',
    marginLeft: 4,
  },
  timeExpiredContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  timeExpiredText: {
    fontSize: 12,
    color: '#95a5a6',
    marginLeft: 4,
  },
  returnedOrderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  returnedOrderText: {
    fontSize: 14,
    color: '#95a5a6',
    marginLeft: 8,
    textAlign: 'center',
  },
  ratingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  ratingDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 16,
    color: '#2c3e50',
    marginLeft: 8,
  },
  commentText: {
    fontSize: 14,
    color: '#7f8c8d',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  promptsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  promptChip: {
    backgroundColor: '#f1f3f4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  promptText: {
    fontSize: 12,
    color: '#2c3e50',
  },
  morePromptsText: {
    fontSize: 12,
    color: '#7f8c8d',
    alignSelf: 'center',
  },
  ratingPrompt: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
    padding: 16,
    alignItems: 'center',
  },
  ratingPromptTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  ratingPromptSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#667eea',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  rateButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 6,
  },
});

export default ShipperRatingCard;
