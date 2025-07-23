import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

interface SearchBarProps {
  onApplySimpleFilter?: (filter: { price: number; sort: 'az' | 'za' | null }) => void;
}

const SearchBar = ({ onApplySimpleFilter }: SearchBarProps) => {
  const router = useRouter();
  const [isFocused, setIsFocused] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [lastFilter, setLastFilter] = useState<{ price: number; sort: 'az' | 'za' | null }>({ price: 0, sort: null });

  const handleSearchPress = () => {
    // Navigate đến trang search và truyền param để tự động focus
    // Thêm timestamp để tránh cache
    const timestamp = Date.now();
    router.push(`/(tabs)/search?autoFocus=true&t=${timestamp}`);
  };

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  const handleFilterPress = () => {
    // Chuyển thẳng sang trang filtered-books.tsx
    router.push('/filtered-books');
  };

  const handleApplyFilter = (filter: { price: number; sort: 'az' | 'za' | null }) => {
    setLastFilter(filter);
    setShowFilterModal(false);
    setTimeout(() => {
      router.push({ pathname: '/filtered-books', params: filter });
    }, 300);
  };

  const handleAdvanced = () => {
    setShowFilterModal(false);
    setTimeout(() => {
      router.push({ pathname: '/filtered-books', params: lastFilter });
    }, 300);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.searchSection, isFocused && styles.searchSectionFocused]}
        onPress={handleSearchPress}
        activeOpacity={0.8}
        onFocus={handleFocus}
        onBlur={handleBlur}
      >
        <Ionicons name="search" size={22} color="#888" style={styles.searchIcon} />
        <TextInput
          placeholder="Tìm kiếm sách, tác giả..."
          style={styles.input}
          editable={false} // Disable input để chỉ cho phép click
          pointerEvents="none" // Disable pointer events cho input
        />
      </TouchableOpacity>
      <TouchableOpacity style={styles.filterButton} onPress={handleFilterPress}>
        <Ionicons name="filter" size={22} color="#fff" />
      </TouchableOpacity>
      {/* Đã bỏ SimpleFilterModal */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  searchSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F8',
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 50,
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
  },
  filterButton: {
    marginLeft: 15,
    backgroundColor: '#5E5CE6',
    padding: 14,
    borderRadius: 15,
  },
  searchSectionFocused: {
    borderColor: '#5E5CE6',
    borderWidth: 2,
    shadowColor: '#5E5CE6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
});

export default SearchBar; 