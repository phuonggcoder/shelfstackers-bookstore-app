import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Review } from '../services/reviewService';
import ReviewCard from './ReviewCard';

interface UserReviewSectionProps {
  review: Review;
  orderCode?: string;
  onVoteHelpful: (reviewId: string) => void;
  onEdit: (review: Review) => void;
  onDelete: (reviewId: string) => void;
}

const UserReviewSection: React.FC<UserReviewSectionProps> = ({
  review,
  orderCode,
  onVoteHelpful,
  onEdit,
  onDelete
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Đánh giá của bạn</Text>
        {orderCode && (
          <Text style={styles.subtitle}>
            Bạn đã đánh giá sản phẩm này cho đơn hàng {orderCode}
          </Text>
        )}
      </View>
      
      <ReviewCard
        review={review}
        onVoteHelpful={onVoteHelpful}
        onEdit={onEdit}
        onDelete={onDelete}
        isOwnReview={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
});

export default UserReviewSection; 
