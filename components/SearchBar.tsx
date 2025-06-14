import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

const SearchBar = () => {
  return (
    <View style={styles.container}>
      <View style={styles.searchSection}>
        <Ionicons name="search" size={22} color="#888" style={styles.searchIcon} />
        <TextInput
          placeholder="Tìm kiếm sách, tác giả..."
          style={styles.input}
        />
      </View>
      <TouchableOpacity style={styles.filterButton}>
        <Ionicons name="filter" size={22} color="#fff" />
      </TouchableOpacity>
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
});

export default SearchBar; 