import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Review } from '../services/reviewService';
import { getUserAvatar, getUserName } from '../utils/reviewUtils';
import RatingStars from './RatingStars';

interface ReviewCardProps {
  review: Review;
  onVoteHelpful?: (reviewId: string) => void;
  onEdit?: (review: Review) => void;
  onDelete?: (reviewId: string) => void;
  isOwnReview?: boolean;
}

const { width } = Dimensions.get('window');

const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  onVoteHelpful,
  onEdit,
  onDelete,
  isOwnReview = false
}) => {
  const handleVoteHelpful = () => {
    if (onVoteHelpful) {
      onVoteHelpful(review._id);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(review);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(review._id);
    }
  };

  const renderMedia = () => {
    const allMedia = [
      ...review.images.map(url => ({ url, type: 'image' as const })),
      ...review.videos.map(url => ({ url, type: 'video' as const })),
      ...review.media
    ];

    if (allMedia.length === 0) return null;

    return (
      <View style={styles.mediaContainer}>
        {allMedia.slice(0, 3).map((media, index) => (
          <View key={index} style={styles.mediaItem}>
            {media.type === 'image' ? (
              <Image source={{ uri: media.url }} style={styles.mediaImage} />
            ) : (
              <View style={styles.videoContainer}>
                <Image source={{ uri: media.url }} style={styles.mediaImage} />
                <View style={styles.playButton}>
                  <Ionicons name="play" size={16} color="white" />
                </View>
              </View>
            )}
          </View>
        ))}
        {allMedia.length > 3 && (
          <View style={styles.moreMedia}>
            <Text style={styles.moreMediaText}>+{allMedia.length - 3}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Image
            source={{ 
              uri: getUserAvatar(review) || 'https://via.placeholder.com/40'
            }}
            style={styles.avatar}
          />
          <View style={styles.userDetails}>
            <Text style={styles.userName}>
              {getUserName(review)}
            </Text>
            <View style={styles.ratingContainer}>
              <RatingStars rating={review.rating} readonly size={16} />
              <Text style={styles.ratingText}>{review.rating}/5</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.headerActions}>
          {review.is_verified_purchase && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.verifiedText}>Đã mua</Text>
            </View>
          )}
          {isOwnReview && (
            <View style={styles.ownReviewActions}>
              <TouchableOpacity onPress={handleEdit} style={styles.actionButton}>
                <Ionicons name="pencil" size={16} color="#666" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} style={styles.actionButton}>
                <Ionicons name="trash" size={16} color="#FF4444" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {review.comment && (
          <Text style={styles.comment}>{review.comment}</Text>
        )}
        
        {renderMedia()}
        
        {review.is_edited && (
          <View style={styles.editedContainer}>
            <Ionicons name="time-outline" size={14} color="#999" />
            <Text style={styles.editedText}>
              Đã chỉnh sửa {review.edited_at ? 
                new Date(review.edited_at).toLocaleDateString('vi-VN') : 
                'gần đây'
              }
            </Text>
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.timeText}>
          {review.timeAgo || new Date(review.createdAt).toLocaleDateString('vi-VN')}
        </Text>
        
        <TouchableOpacity onPress={handleVoteHelpful} style={styles.helpfulButton}>
          <Ionicons name="thumbs-up" size={16} color="#666" />
          <Text style={styles.helpfulText}>
            Hữu ích ({review.helpful_votes})
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  verifiedText: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 4,
    fontWeight: '500',
  },
  ownReviewActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 4,
    marginLeft: 8,
  },
  content: {
    marginBottom: 12,
  },
  comment: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
  },
  mediaContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  mediaItem: {
    marginRight: 8,
  },
  mediaImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  videoContainer: {
    position: 'relative',
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -12 }, { translateY: -12 }],
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreMedia: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreMediaText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  editedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  editedText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginLeft: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  timeText: {
    fontSize: 12,
    color: '#999',
  },
  helpfulButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  helpfulText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
});

export default ReviewCard; 