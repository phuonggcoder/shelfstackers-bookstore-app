import { Image } from 'expo-image'
import { router } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { getCategories } from '../../services/api'
import { Category } from '../../types'

const CategoriesScreen = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);
  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data); // Show all categories
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Danh mục</Text>
        <TouchableOpacity 
          onPress={() => router.push('/allcategories')}
          style={styles.seeAll}
        >
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {categories.map((category) => (
          <TouchableOpacity 
            key={category._id}
            style={styles.categoryItem}
            onPress={() => router.push(`/category/${category._id}`)}
          >
            <Image
              source={category.image}
              style={styles.categoryIcon}
              contentFit="contain"
            />
            <Text style={styles.categoryName}>{category.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAll: {
    padding: 8,
  },
  seeAllText: {
    color: '#4A3780',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContent: {
    gap: 15,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#F8F9FF',
    borderRadius: 10,
    gap: 15,
  },
  categoryIcon: {
    width: 40,
    height: 40,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
})

export default CategoriesScreen