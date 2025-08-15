import { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Book } from '../types';
import CoverFlowCarousel from './CoverFlowCarousel';
import CoverFlowCarousel3D from './CoverFlowCarousel3D';

// Mock data for testing
const mockBooks: Book[] = [
  {
    _id: '1',
    title: 'Đắc Nhân Tâm',
    author: 'Dale Carnegie',
    price: 150000,
    thumbnail: 'https://i.imgur.com/gTzT0hA.jpeg',
    cover_image: ['https://i.imgur.com/gTzT0hA.jpeg'],
    description: 'Cuốn sách kinh điển về nghệ thuật đối nhân xử thế',
    category: 'self-help',
    rating: 4.5,
    reviews: 120,
    stock: 50,
  },
  {
    _id: '2',
    title: 'Nhà Giả Kim',
    author: 'Paulo Coelho',
    price: 120000,
    thumbnail: 'https://i.imgur.com/gTzT0hA.jpeg',
    cover_image: ['https://i.imgur.com/gTzT0hA.jpeg'],
    description: 'Hành trình tìm kiếm kho báu và ý nghĩa cuộc sống',
    category: 'fiction',
    rating: 4.8,
    reviews: 89,
    stock: 30,
  },
  {
    _id: '3',
    title: 'Tuổi Trẻ Đáng Giá Bao Nhiêu',
    author: 'Rosie Nguyễn',
    price: 180000,
    thumbnail: 'https://i.imgur.com/gTzT0hA.jpeg',
    cover_image: ['https://i.imgur.com/gTzT0hA.jpeg'],
    description: 'Những trải nghiệm và bài học quý giá từ hành trình du lịch',
    category: 'travel',
    rating: 4.6,
    reviews: 156,
    stock: 25,
  },
  {
    _id: '4',
    title: 'Sách Đen Về Tư Duy',
    author: 'Robert Greene',
    price: 250000,
    thumbnail: 'https://i.imgur.com/gTzT0hA.jpeg',
    cover_image: ['https://i.imgur.com/gTzT0hA.jpeg'],
    description: 'Nghệ thuật thao túng tâm lý và chiến lược tư duy',
    category: 'psychology',
    rating: 4.7,
    reviews: 203,
    stock: 40,
  },
  {
    _id: '5',
    title: 'Cách Nghĩ Để Thành Công',
    author: 'Napoleon Hill',
    price: 160000,
    thumbnail: 'https://i.imgur.com/gTzT0hA.jpeg',
    cover_image: ['https://i.imgur.com/gTzT0hA.jpeg'],
    description: 'Những nguyên tắc vàng để đạt được thành công trong cuộc sống',
    category: 'self-help',
    rating: 4.4,
    reviews: 178,
    stock: 35,
  },
];

const CoverFlowDemo = () => {
  const [selectedCarousel, setSelectedCarousel] = useState<'basic' | '3d'>('3d');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Cover Flow Carousel Demo</Text>
          <Text style={styles.subtitle}>Chọn loại carousel để xem demo</Text>
        </View>

        <View style={styles.selectorContainer}>
          <TouchableOpacity
            style={[
              styles.selectorButton,
              selectedCarousel === 'basic' && styles.selectedButton,
            ]}
            onPress={() => setSelectedCarousel('basic')}
          >
            <Text style={[
              styles.selectorText,
              selectedCarousel === 'basic' && styles.selectedText,
            ]}>
              Basic Cover Flow
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.selectorButton,
              selectedCarousel === '3d' && styles.selectedButton,
            ]}
            onPress={() => setSelectedCarousel('3d')}
          >
            <Text style={[
              styles.selectorText,
              selectedCarousel === '3d' && styles.selectedText,
            ]}>
              3D Cover Flow
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.carouselContainer}>
          {selectedCarousel === 'basic' ? (
            <CoverFlowCarousel
              title="Sách Bán Chạy"
              books={mockBooks}
              categoryId="bestsellers"
              categoryName="Sách Bán Chạy"
            />
          ) : (
            <CoverFlowCarousel3D
              title="Sách Nổi Bật"
              books={mockBooks}
              categoryId="featured"
              categoryName="Sách Nổi Bật"
            />
          )}
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Tính năng của Cover Flow Carousel:</Text>
          <View style={styles.featureList}>
            <Text style={styles.featureItem}>• Hiệu ứng 3D với perspective và rotation</Text>
            <Text style={styles.featureItem}>• Animation mượt mà với Animated API</Text>
            <Text style={styles.featureItem}>• Pagination dots để điều hướng</Text>
            <Text style={styles.featureItem}>• Navigation buttons (3D version)</Text>
            <Text style={styles.featureItem}>• Shadow và reflection effects</Text>
            <Text style={styles.featureItem}>• Responsive design</Text>
            <Text style={styles.featureItem}>• Touch navigation</Text>
          </View>
        </View>

        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>Hướng dẫn sử dụng:</Text>
          <Text style={styles.instructionText}>
            1. Vuốt ngang để chuyển đổi giữa các sách{'\n'}
            2. Chạm vào sách để xem chi tiết{'\n'}
            3. Sử dụng nút điều hướng (3D version){'\n'}
            4. Chạm vào dots để chuyển nhanh
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  selectorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  selectorButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 8,
    borderRadius: 25,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  selectedButton: {
    backgroundColor: '#e74c3c',
    borderColor: '#e74c3c',
  },
  selectorText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  selectedText: {
    color: '#fff',
  },
  carouselContainer: {
    marginBottom: 30,
  },
  infoContainer: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  featureList: {
    marginLeft: 10,
  },
  featureItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  instructions: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
});

export default CoverFlowDemo; 