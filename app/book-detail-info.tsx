import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import RenderHTML from 'react-native-render-html';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getBookById } from '../services/api';

const FIELD_LABELS = [
  { key: 'title', label: 'Tên sách' },
  { key: 'author', label: 'Tác giả' },
  { key: 'price', label: 'Giá bán' },
  { key: 'description', label: 'Mô tả' },
  { key: 'cover_image', label: 'Ảnh bìa' },
  { key: 'stock', label: 'Tồn kho' },
  { key: 'publication_date', label: 'Ngày xuất bản' },
  { key: 'publisher', label: 'Nhà xuất bản' },
  { key: 'weight', label: 'Khối lượng' },
  { key: 'dimensions', label: 'Kích thước' },
  { key: 'page_count', label: 'Số trang' },
  { key: 'supplier', label: 'Nhà cung cấp' },
  { key: 'language', label: 'Ngôn ngữ' },
  { key: 'categories', label: 'Thể loại' },
];

const BookDetailInfoScreen = () => {
  const { id } = useLocalSearchParams();
  const [book, setBook] = useState<any>(null);
  const router = useRouter();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const contentWidth = useMemo(() => width, [width]);

  useEffect(() => {
    if (id) {
      getBookById(id as string).then(setBook).catch(() => setBook(null));
    }
  }, [id]);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Header với nút back */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="black" accessibilityLabel="Quay lại" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông tin chi tiết sách</Text>
      </View>
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 16 + (insets.bottom || 0) }]}>
        {FIELD_LABELS.map(field => (
          <View style={styles.row} key={field.key}>
            <Text style={styles.label}>{field.label}:</Text>
            <View style={styles.valueContainer}>
              {(() => {
                if (!book) return <Text style={styles.value}>Không có</Text>;
                const value = book[field.key];
                if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) return <Text style={styles.value}>Không có</Text>;
                if (field.key === 'price') return <Text style={styles.value}>{value.toLocaleString('vi-VN')}₫</Text>;
                if (field.key === 'publication_date') return <Text style={styles.value}>{new Date(value).toLocaleDateString('vi-VN')}</Text>;
                if (field.key === 'cover_image') return <Text style={styles.value}>{Array.isArray(value) ? value.join(', ') : value}</Text>;
                if (field.key === 'categories') {
                  if (Array.isArray(value)) {
                    // Loại bỏ trùng lặp theo _id hoặc id
                    const seen = new Set();
                    const uniqueCats = value.filter((cat: any) => {
                      const key = cat?._id || cat?.id || cat;
                      if (seen.has(key)) return false;
                      seen.add(key);
                      return true;
                    });
                    return (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                        {uniqueCats.map((cat: any, idx: number) => (
                          <TouchableOpacity
                            key={(cat?._id || cat?.id || cat) + '-' + idx}
                            onPress={() => router.push({ pathname: '/category/[id]', params: { id: cat?._id || cat?.id || cat } })}
                          >
                            <Text style={{ color: '#5E5CE6', fontWeight: 'bold', marginRight: 8, marginBottom: 4 }}>
                              {cat?.name || cat?._id || cat}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    );
                  }
                  // Nếu chỉ là object hoặc string
                  return (
                    <TouchableOpacity onPress={() => router.push({ pathname: '/category/[id]', params: { id: value?._id || value?.id || value } })}>
                      <Text style={{ color: '#5E5CE6', fontWeight: 'bold' }}>{value?.name || value?._id || value}</Text>
                    </TouchableOpacity>
                  );
                }
                if (field.key === 'description') {
                  return (
                    <RenderHTML
                      contentWidth={contentWidth}
                      source={{ html: value }}
                    />
                  );
                }
                return <Text style={styles.value}>{value}</Text>;
              })()}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backBtn: {
    padding: 8,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  container: {
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 12,
    alignItems: 'flex-start',
  },
  label: {
    flex: 1,
    color: '#444',
    fontWeight: '500',
    fontSize: 15,
    marginTop: 2,
  },
  valueContainer: {
    flex: 2,
    minHeight: 20,
  },
  value: {
    color: '#222',
    fontSize: 15,
  },
});

export default BookDetailInfoScreen; 