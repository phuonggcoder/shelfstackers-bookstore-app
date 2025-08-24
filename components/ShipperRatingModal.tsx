import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useUnifiedModal } from '../context/UnifiedModalContext';
import { useRatingSubmission } from '../hooks/useShipperRating';
import { ShipperRating, ShipperRatingPrompt } from '../services/shipperRatingService';
import RatingStars from './RatingStars';

interface ShipperRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  shipperInfo: {
    _id: string;
    full_name?: string;
    phone_number?: string;
  };
  existingRating?: ShipperRating | null;
  prompts: ShipperRatingPrompt[];
  promptsLoading: boolean;
  onRatingSubmit?: () => void;
}

const ShipperRatingModal: React.FC<ShipperRatingModalProps> = ({
  isOpen,
  onClose,
  orderId,
  shipperInfo,
  existingRating,
  prompts,
  promptsLoading,
  onRatingSubmit
}) => {
  const { t } = useTranslation();
  const { showSuccessToast, showErrorToast } = useUnifiedModal();
  const { submitting, submitRating, updateRating } = useRatingSubmission();

  const [rating, setRating] = useState(existingRating?.rating || 0);
  const [selectedPrompts, setSelectedPrompts] = useState<string[]>(
    existingRating?.selected_prompts || []
  );
  const [comment, setComment] = useState(existingRating?.comment || '');
  const [isAnonymous, setIsAnonymous] = useState(existingRating?.is_anonymous || false);

  // Reset form when modal opens/closes or existingRating changes
  useEffect(() => {
    if (isOpen) {
      setRating(existingRating?.rating || 0);
      setSelectedPrompts(existingRating?.selected_prompts || []);
      setComment(existingRating?.comment || '');
      setIsAnonymous(existingRating?.is_anonymous || false);
    }
  }, [isOpen, existingRating]);

  const handlePromptToggle = (promptId: string) => {
    setSelectedPrompts(prev => 
      prev.includes(promptId) 
        ? prev.filter(id => id !== promptId)
        : [...prev, promptId]
    );
  };

  const validateForm = () => {
    if (rating === 0) {
      showErrorToast(t('error'), t('pleaseSelectRating'));
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const ratingData = {
        rating,
        selectedPrompts,
        comment: comment.trim(),
        isAnonymous,
      };

      if (existingRating) {
        await updateRating(orderId, ratingData);
        showSuccessToast(t('success'), t('ratingUpdatedSuccessfully'));
      } else {
        await submitRating({
          orderId,
          shipperId: shipperInfo._id,
          ...ratingData,
        });
        showSuccessToast(t('success'), t('ratingSubmittedSuccessfully'));
      }

      onRatingSubmit?.();
      onClose();
    } catch (error) {
      console.error('Error submitting rating:', error);
      showErrorToast(t('error'), t('failedToSubmitRating'));
    }
  };

  const handleCancel = () => {
    if (rating > 0 || comment.trim() || selectedPrompts.length > 0) {
      Alert.alert(
        t('confirmCancel'),
        t('unsavedChangesWarning'),
        [
          { text: t('cancel'), style: 'cancel' },
          { text: t('discard'), style: 'destructive', onPress: onClose }
        ]
      );
    } else {
      onClose();
    }
  };

  const getShipperName = () => {
    return shipperInfo?.full_name || t('shipper');
  };

  const groupedPrompts = prompts.reduce((acc, prompt) => {
    if (!acc[prompt.category]) {
      acc[prompt.category] = [];
    }
    acc[prompt.category].push(prompt);
    return acc;
  }, {} as Record<string, ShipperRatingPrompt[]>);

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCancel}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#2c3e50" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {existingRating ? t('editShipperRating') : t('rateShipper')}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Shipper Info */}
          <View style={styles.shipperInfo}>
            <View style={styles.shipperAvatar}>
              <Ionicons name="person" size={32} color="#667eea" />
            </View>
            <View style={styles.shipperDetails}>
              <Text style={styles.shipperName}>{getShipperName()}</Text>
              <Text style={styles.shipperPhone}>
                {shipperInfo?.phone_number || t('phoneNotAvailable')}
              </Text>
            </View>
          </View>

          {/* Rating Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('rateYourExperience')}</Text>
            <View style={styles.ratingContainer}>
              <RatingStars
                rating={rating}
                onRatingChange={setRating}
                size={32}
                color="#FFD700"
              />
              <Text style={styles.ratingText}>
                {rating > 0 ? `${rating}/5 ${t('stars')}` : t('selectRating')}
              </Text>
            </View>
          </View>

          {/* Prompts Section */}
          {!promptsLoading && prompts.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('selectReasons')}</Text>
              <Text style={styles.sectionSubtitle}>{t('selectMultiplePrompts')}</Text>
              
              {Object.entries(groupedPrompts).map(([category, categoryPrompts]) => (
                <View key={category} style={styles.promptCategory}>
                  <Text style={styles.categoryTitle}>
                    {category === 'positive' ? t('positive') : 
                     category === 'negative' ? t('negative') : t('neutral')}
                  </Text>
                  <View style={styles.promptsGrid}>
                    {categoryPrompts.map((prompt) => (
                      <TouchableOpacity
                        key={prompt._id}
                        style={[
                          styles.promptChip,
                          selectedPrompts.includes(prompt._id) && styles.promptChipSelected
                        ]}
                        onPress={() => handlePromptToggle(prompt._id)}
                      >
                        <Text style={[
                          styles.promptText,
                          selectedPrompts.includes(prompt._id) && styles.promptTextSelected
                        ]}>
                          {prompt.text}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Loading Prompts */}
          {promptsLoading && (
            <View style={styles.section}>
              <ActivityIndicator size="small" color="#667eea" />
              <Text style={styles.loadingText}>{t('loadingPrompts')}</Text>
            </View>
          )}

          {/* Comment Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('additionalComments')}</Text>
            <Text style={styles.sectionSubtitle}>{t('optional')}</Text>
            <TextInput
              style={styles.commentInput}
              value={comment}
              onChangeText={setComment}
              placeholder={t('shareYourExperience')}
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>
              {comment.length}/500 {t('characters')}
            </Text>
          </View>

          {/* Anonymous Option */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.anonymousOption}
              onPress={() => setIsAnonymous(!isAnonymous)}
            >
              <View style={styles.checkboxContainer}>
                <Ionicons
                  name={isAnonymous ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={isAnonymous ? '#667eea' : '#95a5a6'}
                />
              </View>
              <View style={styles.anonymousTextContainer}>
                <Text style={styles.anonymousTitle}>{t('rateAnonymously')}</Text>
                <Text style={styles.anonymousSubtitle}>{t('anonymousRatingDescription')}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="star" size={20} color="white" />
            )}
            <Text style={styles.submitButtonText}>
              {submitting 
                ? t('submitting') 
                : existingRating 
                  ? t('updateRating') 
                  : t('submitRating')
              }
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  content: {
    flex: 1,
  },
  shipperInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  shipperAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
  section: {
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 16,
  },
  ratingContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  ratingText: {
    fontSize: 16,
    color: '#2c3e50',
    marginTop: 8,
  },
  promptCategory: {
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  promptsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  promptChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f1f3f4',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  promptChipSelected: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  promptText: {
    fontSize: 12,
    color: '#2c3e50',
  },
  promptTextSelected: {
    color: 'white',
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#2c3e50',
    backgroundColor: '#f8f9fa',
    minHeight: 100,
  },
  charCount: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'right',
    marginTop: 4,
  },
  anonymousOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkboxContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  anonymousTextContainer: {
    flex: 1,
  },
  anonymousTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  anonymousSubtitle: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2,
  },
  loadingText: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 8,
  },
  footer: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#667eea',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default ShipperRatingModal;
