import Slider from '@react-native-community/slider';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Dimensions, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import BookCard from '../components/BookCard';
import { useData } from '../context/DataContext';

const { width } = Dimensions.get('window');
const SORT_OPTIONS = [
  { label: 'Mới nhất', value: 'newest' },
  { label: 'Giá tăng dần', value: 'price_asc' },
  { label: 'Giá giảm dần', value: 'price_desc' },
  { label: 'A-Z', value: 'az' },
  { label: 'Z-A', value: 'za' },
  { label: 'Bán chạy tuần', value: 'week' },
  { label: 'Bán chạy tháng', value: 'month' },
  { label: 'Bán chạy năm', value: 'year' },
  { label: 'Nổi bật', value: 'featured' },
];
const ITEM_PER_ROW_OPTIONS = [2, 3, 4];
const PAGE_SIZE_OPTIONS = [12, 24, 48];
const MAX_PRICE = 1000000;

const FilteredBooksScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { books, categories } = useData();
  // Lấy tất cả ngôn ngữ có trong books
  const languages = Array.from(new Set(books.map(b => b.language).filter(Boolean)));

  // State filter nâng cao
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [price, setPrice] = useState(MAX_PRICE);
  const [sort, setSort] = useState<string>('newest');
  const [itemPerRow, setItemPerRow] = useState(2);
  const [pageSize, setPageSize] = useState(24);
  const [page, setPage] = useState(1);

  // Lọc và sắp xếp toàn bộ sách
  const filteredBooks = useMemo(() => {
    let result = books;
    if (selectedCategories.length > 0) {
      result = result.filter(book => book.categories.some(cat => selectedCategories.includes(cat._id)));
    }
    if (selectedLanguages.length > 0) {
      result = result.filter(book => selectedLanguages.includes(book.language));
    }
    if (price < MAX_PRICE) {
      result = result.filter(book => book.price <= price);
    }
    switch (sort) {
      case 'price_asc':
        result = [...result].sort((a, b) => a.price - b.price); break;
      case 'price_desc':
        result = [...result].sort((a, b) => b.price - a.price); break;
      case 'az':
        result = [...result].sort((a, b) => a.title.localeCompare(b.title)); break;
      case 'za':
        result = [...result].sort((a, b) => b.title.localeCompare(a.title)); break;
      case 'newest':
        result = [...result].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
      // TODO: week, month, year, featured
      default: break;
    }
    return result;
  }, [books, selectedCategories, selectedLanguages, price, sort]);

  const totalPages = Math.ceil(filteredBooks.length / pageSize);
  const pagedBooks = filteredBooks.slice((page - 1) * pageSize, page * pageSize);
  const ITEM_WIDTH = (width - 32 - (itemPerRow - 1) * 12) / itemPerRow;

  // UI filter nâng cao
  const renderAdvancedFilter = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.advancedFilterBar}>
      {/* Danh mục */}
      {categories.map(cat => (
        <TouchableOpacity
          key={cat._id}
          style={[styles.chip, selectedCategories.includes(cat._id) && styles.chipSelected]}
          onPress={() => setSelectedCategories(selectedCategories.includes(cat._id)
            ? selectedCategories.filter(id => id !== cat._id)
            : [...selectedCategories, cat._id])}
        >
          <Text style={[styles.chipText, selectedCategories.includes(cat._id) && styles.chipTextSelected]}>{cat.name}</Text>
          {selectedCategories.includes(cat._id) && (
            <Text style={styles.chipRemove}>×</Text>
          )}
        </TouchableOpacity>
      ))}
      {/* Ngôn ngữ */}
      {languages.map(lang => (
        <TouchableOpacity
          key={lang}
          style={[styles.chip, selectedLanguages.includes(lang) && styles.chipSelected]}
          onPress={() => setSelectedLanguages(selectedLanguages.includes(lang)
            ? selectedLanguages.filter(l => l !== lang)
            : [...selectedLanguages, lang])}
        >
          <Text style={[styles.chipText, selectedLanguages.includes(lang) && styles.chipTextSelected]}>{lang}</Text>
          {selectedLanguages.includes(lang) && (
            <Text style={styles.chipRemove}>×</Text>
          )}
        </TouchableOpacity>
      ))}
      {/* Giá */}
      <View style={styles.sliderContainer}>
        <Text style={styles.sliderLabel}>Giá ≤ {price === MAX_PRICE ? '∞' : price.toLocaleString() + 'đ'}</Text>
        <Slider
          style={{ width: 120, height: 30 }}
          minimumValue={0}
          maximumValue={MAX_PRICE}
          step={10000}
          value={price}
          onValueChange={setPrice}
          minimumTrackTintColor="#5E5CE6"
          maximumTrackTintColor="#ddd"
          thumbTintColor="#5E5CE6"
        />
      </View>
      {/* Sắp xếp */}
      <View style={styles.sortSelectContainer}>
        {SORT_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.sortBtn, sort === opt.value && styles.sortBtnActive]}
            onPress={() => setSort(opt.value)}
          >
            <Text style={[styles.sortBtnText, sort === opt.value && styles.sortBtnTextActive]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* Số item/hàng */}
      <View style={styles.itemPerRowContainer}>
        <Text style={styles.sliderLabel}>Số item/hàng:</Text>
        {ITEM_PER_ROW_OPTIONS.map(opt => (
          <TouchableOpacity key={opt} onPress={() => setItemPerRow(opt)}>
            <Text style={[styles.itemPerRowBtn, itemPerRow === opt && styles.itemPerRowBtnActive]}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* Số item/trang */}
      <View style={styles.pageSizeContainer}>
        <Text style={styles.sliderLabel}>Số item/trang:</Text>
        {PAGE_SIZE_OPTIONS.map(opt => (
          <TouchableOpacity key={opt} onPress={() => setPageSize(opt)}>
            <Text style={[styles.pageSizeBtn, pageSize === opt && styles.pageSizeBtnActive]}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>{'<'} Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kết quả lọc & sắp xếp</Text>
      </View>
      {/* Filter nâng cao */}
      {renderAdvancedFilter()}
      {/* Danh sách sách dạng lưới */}
      <FlatList
        data={pagedBooks}
        keyExtractor={item => item._id}
        numColumns={itemPerRow}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <View style={{ width: ITEM_WIDTH, marginBottom: 18 }}>
            <BookCard book={item} />
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>Không có sách phù hợp</Text>}
      />
      {/* Phân trang */}
      <View style={styles.paginationRow}>
        <TouchableOpacity disabled={page === 1} onPress={() => setPage(page - 1)}>
          <Text style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.pageNum}>{page} / {totalPages || 1}</Text>
        <TouchableOpacity disabled={page === totalPages || totalPages === 0} onPress={() => setPage(page + 1)}>
          <Text style={[styles.pageBtn, (page === totalPages || totalPages === 0) && styles.pageBtnDisabled]}>{'>'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  backBtn: {
    marginRight: 12,
    padding: 4,
  },
  backText: {
    color: '#1976D2',
    fontWeight: 'bold',
    fontSize: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  advancedFilterPlaceholder: {
    padding: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#eee',
    marginBottom: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  row: {
    justifyContent: 'space-between',
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 32,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: '#eee',
    gap: 8,
  },
  pageBtn: {
    fontSize: 18,
    color: '#1976D2',
    paddingHorizontal: 8,
    fontWeight: 'bold',
  },
  pageBtnDisabled: {
    color: '#ccc',
  },
  pageNum: {
    fontSize: 16,
    color: '#333',
    marginHorizontal: 8,
  },
  advancedFilterBar: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingBottom: 8,
    marginBottom: 8,
    backgroundColor: '#f8f8ff',
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 4,
  },
  chipSelected: {
    backgroundColor: '#5E5CE6',
    borderColor: '#5E5CE6',
  },
  chipText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#fff',
  },
  chipRemove: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 4,
    fontSize: 16,
  },
  sliderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  sliderLabel: {
    fontSize: 13,
    color: '#444',
    marginBottom: 2,
  },
  sortSelectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  sortBtn: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    backgroundColor: '#fff',
  },
  sortBtnActive: {
    backgroundColor: '#5E5CE6',
    borderColor: '#5E5CE6',
  },
  sortBtnText: {
    color: '#333',
    fontSize: 13,
  },
  sortBtnTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  itemPerRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  itemPerRowBtn: {
    fontSize: 14,
    color: '#1976D2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#1976D2',
    marginHorizontal: 2,
  },
  itemPerRowBtnActive: {
    backgroundColor: '#1976D2',
    color: '#fff',
  },
  pageSizeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  pageSizeBtn: {
    fontSize: 14,
    color: '#1976D2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#1976D2',
    marginHorizontal: 2,
  },
  pageSizeBtnActive: {
    backgroundColor: '#1976D2',
    color: '#fff',
  },
});

export default FilteredBooksScreen; 