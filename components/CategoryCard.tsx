import { Image } from 'expo-image';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

interface CategoryCardProps {
  id: string;
  name: string;
  image: string;
  slug: string;
}

export default function CategoryCard({ id, name, image, slug }: CategoryCardProps) {
  // Default image to use if the remote image fails to load
  const defaultImage = require('../assets/images/Categories.png');
  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={() => router.push({
        pathname: '/category/[id]',
        params: { id, name }
      })}
    >
      <Image
        source={image || defaultImage}
        style={styles.image}
        contentFit="cover"
        transition={200}
      />
      <Text style={styles.name} numberOfLines={2}>{name}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '48%', // For 2 columns with gap
    marginBottom: 15,
    borderRadius: 10,
    backgroundColor: '#F8F9FF',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 120,
    backgroundColor: '#E8E8FF',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    padding: 12,
    textAlign: 'center',
  },
});
