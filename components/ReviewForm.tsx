import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CreateReviewData, Review, UpdateReviewData } from '../services/reviewService';
import ConfirmModal from './ConfirmModal';
import RatingStars from './RatingStars';

interface ReviewFormProps {
  productId: string;
  orderId: string;
  existingReview?: Review;
  onSubmit: (data: CreateReviewData | UpdateReviewData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  productId,
  orderId,
  existingReview,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [mediaUrls, setMediaUrls] = useState<string[]>(existingReview?.images || []);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingSubmitData, setPendingSubmitData] = useState<any>(null);

  // Update form data when existingReview changes
  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating);
      setComment(existingReview.comment || '');
      setMediaUrls(existingReview.images || []);
    } else {
      setRating(0);
      setComment('');
      setMediaUrls([]);
    }
  }, [existingReview]);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Lỗi', 'Vui lòng chọn đánh giá từ 1-5 sao');
      return;
    }

    if (!comment.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập nội dung đánh giá');
      return;
    }

    const submitData = existingReview ? {
      rating,
      comment: comment.trim(),
      images: mediaUrls,
    } : {
      productId,
      orderId,
      rating,
      comment: comment.trim(),
      images: mediaUrls,
    };

    if (existingReview) {
      // Show confirmation for updates
      setPendingSubmitData(submitData);
      setShowConfirmModal(true);
    } else {
      // Direct submit for new reviews
      try {
        await onSubmit(submitData);
      } catch (error) {
        Alert.alert('Lỗi', 'Có lỗi xảy ra khi gửi đánh giá');
      }
    }
  };

  const handleConfirmSubmit = async () => {
    setShowConfirmModal(false);
    if (pendingSubmitData) {
      try {
        await onSubmit(pendingSubmitData);
      } catch (error) {
        Alert.alert('Lỗi', 'Có lỗi xảy ra khi cập nhật đánh giá');
      }
    }
  };

  const handleCancelSubmit = () => {
    setShowConfirmModal(false);
    setPendingSubmitData(null);
  };

  const handleCancel = () => {
    // Use setTimeout to avoid setState during render
    setTimeout(() => {
      onCancel();
    }, 0);
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadMedia(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể chọn ảnh');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Quyền truy cập', 'Cần quyền truy cập camera để chụp ảnh');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadMedia(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể chụp ảnh');
    }
  };

  const uploadMedia = async (uri: string) => {
    setUploadingMedia(true);
    try {
      // Trong thực tế, bạn sẽ upload file lên server trước
      // Sau đó lấy URL và thêm vào mediaUrls
      // Ở đây tôi giả lập việc upload thành công
      setTimeout(() => {
        setMediaUrls(prev => [...prev, uri]);
        setUploadingMedia(false);
      }, 1000);
    } catch (error) {
      setUploadingMedia(false);
      Alert.alert('Lỗi', 'Không thể upload ảnh');
    }
  };

  const removeMedia = (index: number) => {
    setMediaUrls(prev => prev.filter((_, i) => i !== index));
  };

  const showMediaOptions = () => {
    Alert.alert(
      'Thêm ảnh/video',
      'Chọn cách thêm media',
      [
        { text: 'Chụp ảnh', onPress: takePhoto },
        { text: 'Chọn từ thư viện', onPress: pickImage },
        { text: 'Hủy', style: 'cancel' },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Swipe down indicator */}
      <View style={styles.swipeIndicator}>
        <View style={styles.swipeBar} />
      </View>
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {existingReview ? 'Chỉnh sửa đánh giá' : 'Viết đánh giá'}
          </Text>
          <TouchableOpacity 
            onPress={handleCancel} 
            style={styles.closeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Rating */}
        <View style={styles.ratingSection}>
          <Text style={styles.sectionTitle}>Đánh giá của bạn</Text>
          <RatingStars
            rating={rating}
            onRatingChange={setRating}
            size={32}
            color="#FFD700"
          />
          <Text style={styles.ratingText}>
            {rating > 0 ? `${rating} sao` : 'Chọn số sao'}
          </Text>
        </View>

        {/* Comment */}
        <View style={styles.commentSection}>
          <Text style={styles.sectionTitle}>Nhận xét</Text>
          <TextInput
            style={styles.commentInput}
            placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
            maxLength={1000}
          />
          <Text style={styles.charCount}>
            {comment.length}/1000 ký tự
          </Text>
        </View>

        {/* Media */}
        <View style={styles.mediaSection}>
          <Text style={styles.sectionTitle}>Thêm ảnh/video</Text>
          <View style={styles.mediaContainer}>
            {mediaUrls.map((url, index) => (
              <View key={index} style={styles.mediaItem}>
                <Image source={{ uri: url }} style={styles.mediaImage} />
                <TouchableOpacity
                  onPress={() => removeMedia(index)}
                  style={styles.removeMediaButton}
                >
                  <Ionicons name="close-circle" size={20} color="#FF4444" />
                </TouchableOpacity>
              </View>
            ))}
            
            {mediaUrls.length < 5 && (
              <TouchableOpacity
                onPress={showMediaOptions}
                style={styles.addMediaButton}
                disabled={uploadingMedia}
              >
                {uploadingMedia ? (
                  <ActivityIndicator size="small" color="#666" />
                ) : (
                  <Ionicons name="add" size={24} color="#666" />
                )}
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.mediaHint}>
            Tối đa 5 ảnh/video (mỗi file tối đa 5MB)
          </Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, (!rating || !comment.trim() || isLoading) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!rating || !comment.trim() || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.submitButtonText}>
              {existingReview ? 'Cập nhật đánh giá' : 'Gửi đánh giá'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Cancel Button */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
        >
          <Text style={styles.cancelButtonText}>Hủy</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>

    {/* Confirmation Modal */}
    <ConfirmModal
      visible={showConfirmModal}
      title="Xác nhận cập nhật"
      message="Bạn có chắc muốn cập nhật đánh giá của mình?"
      confirmText="Cập nhật"
      cancelText="Hủy"
      onConfirm={handleConfirmSubmit}
      onCancel={handleCancelSubmit}
      type="warning"
    />
  </SafeAreaView>
);
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  swipeIndicator: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  swipeBar: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  ratingSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  commentSection: {
    marginBottom: 24,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  mediaSection: {
    marginBottom: 32,
  },
  mediaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mediaItem: {
    position: 'relative',
  },
  mediaImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeMediaButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'white',
    borderRadius: 10,
  },
  addMediaButton: {
    width: 80,
    height: 80,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  submitButton: {
    backgroundColor: '#3255FB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    backgroundColor: 'white',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ReviewForm; 