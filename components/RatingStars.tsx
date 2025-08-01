import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface RatingStarsProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  size?: number;
  readonly?: boolean;
  color?: string;
  emptyColor?: string;
}

const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  onRatingChange,
  size = 24,
  readonly = false,
  color = '#FFD700',
  emptyColor = '#E0E0E0'
}) => {
  const handleStarPress = (starIndex: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(starIndex + 1);
    }
  };

  return (
    <View style={styles.container}>
      {[0, 1, 2, 3, 4].map((index) => (
        <TouchableOpacity
          key={index}
          onPress={() => handleStarPress(index)}
          disabled={readonly}
          style={styles.starContainer}
        >
          <Ionicons
            name={index < rating ? 'star' : 'star-outline'}
            size={size}
            color={index < rating ? color : emptyColor}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starContainer: {
    marginRight: 2,
  },
});

export default RatingStars; 