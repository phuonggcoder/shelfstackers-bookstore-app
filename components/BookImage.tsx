import { Image } from 'expo-image';
import React from 'react';
import { getFirstValidImage } from '../utils/format';

interface BookImageProps {
  images?: string[] | null;
  style?: any;
  contentFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  transition?: number;
}

const BookImage: React.FC<BookImageProps> = ({ 
  images, 
  style, 
  contentFit = 'cover',
  transition = 200 
}) => {
  return (
    <Image
      source={{ uri: getFirstValidImage(images) }}
      style={style}
      contentFit={contentFit}
      transition={transition}
      placeholder="https://i.imgur.com/gTzT0hA.jpeg"
    />
  );
};

export default BookImage; 
