import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getCategories } from '../services/api';
import { Category } from '../types';

const CategoryFilters = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const fetchedCategories = await getCategories();
        setCategories(fetchedCategories);
        if (fetchedCategories.length > 0) {
          setSelectedCategory(fetchedCategories[0]._id);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };

    fetchCategories();
  }, []);

  return (
    <View style={styles.container}>
        <View style={styles.titleContainer}>
            <Text style={styles.title}>All Categories</Text>
            <TouchableOpacity>
                <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.map((category) => (
            <TouchableOpacity
                key={category._id}
                style={[
                styles.chip,
                selectedCategory === category._id && styles.selectedChip,
                ]}
                onPress={() => setSelectedCategory(category._id)}
            >
                <Text
                style={[
                    styles.chipText,
                    selectedCategory === category._id && styles.selectedChipText,
                ]}
                >
                {category.name}
                </Text>
            </TouchableOpacity>
            ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
    },
    titleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    seeAll: {
        color: '#666',
    },
    chip: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#EAEAEA'
    },
    selectedChip: {
        backgroundColor: '#4A3780',
        borderWidth: 1,
        borderColor: '#4A3780'
    },
    chipText: {
        color: '#333',
        fontSize: 14,
        fontWeight: '500'
    },
    selectedChipText: {
        color: '#fff',
    },
});

export default CategoryFilters; 