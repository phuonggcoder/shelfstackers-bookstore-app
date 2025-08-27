import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ReviewSummary as ReviewSummaryType } from '../services/reviewService';
import RatingStars from './RatingStars';

interface ReviewSummaryProps {
  summary: ReviewSummaryType;
  onRatingFilter?: (rating: number) => void;
}

const ReviewSummary: React.FC<ReviewSummaryProps> = ({
  summary,
  onRatingFilter,
}) => {
  const { averageRating, totalReviews, ratingCounts } = summary;

  const getRatingPercentage = (rating: number) => {
    if (totalReviews === 0) return 0;
    return (ratingCounts[rating as keyof typeof ratingCounts] / totalReviews) * 100;
  };

  const renderRatingBar = (rating: number) => {
    const percentage = getRatingPercentage(rating);
    return (
      <View key={rating} style={styles.ratingBarContainer}>
        <Text style={styles.ratingLabel}>{rating} sao</Text>
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${percentage}%` },
              ]}
            />
          </View>
        </View>
        <Text style={styles.ratingCount}>
          {ratingCounts[rating as keyof typeof ratingCounts]}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Overall Rating */}
      <View style={styles.overallRating}>
        <View style={styles.ratingDisplay}>
          <Text style={styles.averageRatingText}>
            {averageRating.toFixed(1)}
          </Text>
          <RatingStars rating={Math.round(averageRating)} readonly size={20} />
          <Text style={styles.totalReviewsText}>
            {totalReviews} đánh giá
          </Text>
        </View>
      </View>

      {/* Rating Distribution */}
      <View style={styles.ratingDistribution}>
        <Text style={styles.distributionTitle}>Phân bố đánh giá</Text>
        <View style={styles.ratingBars}>
          {[5, 4, 3, 2, 1].map(renderRatingBar)}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  overallRating: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  ratingDisplay: {
    alignItems: 'center',
  },
  averageRatingText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  totalReviewsText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  ratingDistribution: {
    marginTop: 8,
  },
  distributionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  ratingBars: {
    gap: 8,
  },
  ratingBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ratingLabel: {
    fontSize: 14,
    color: '#666',
    width: 40,
  },
  progressBarContainer: {
    flex: 1,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 4,
  },
  ratingCount: {
    fontSize: 12,
    color: '#999',
    width: 30,
    textAlign: 'right',
  },
});

export default ReviewSummary; 
