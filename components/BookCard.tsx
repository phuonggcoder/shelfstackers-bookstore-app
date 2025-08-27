import { useRouter } from 'expo-router';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Book } from '../types';

export default function BookCard({ book }: { book: Book }) {
  const router = useRouter();
  // Tính giá gốc (giá gạch ngang): nếu có original_price thì dùng, không thì lấy price * 1.2
  const originalPrice = (book as any).original_price || book.price * 1.2;
  // Giá ảo (giá gạch ngang) dựa trên discount cố định
  const discount = getDiscountPercent(book._id);
  const fakeOriginalPrice = Math.round(book.price / (1 - discount / 100));

  // Badge giảm giá random cố định theo _id
  function getDiscountPercent(id: string) {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    // Giới hạn từ 10 đến 50%
    const percent = Math.abs(hash % 41) + 10;
    return percent;
  }

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => router.push({ pathname: '/book/[id]', params: { id: book._id } })}>
      {/* Badge giảm giá ở góc trên bên phải */}
      <View style={styles.badgeTopRight}>
        <Text style={styles.badgeText}>-{getDiscountPercent(book._id)}%</Text>
      </View>
      <View style={styles.imagesRow}>
        <Image
          source={{ uri: book.thumbnail || (book.cover_image && book.cover_image[0]) || '' }}
          style={styles.mainImage}
          resizeMode="cover"
        />
      </View>
      <View style={styles.infoSection}>
        <Text style={styles.title} numberOfLines={2}>{book.title}</Text>
        {book.author && <Text style={styles.author} numberOfLines={1}>{book.author}</Text>}
        <View style={styles.priceRow}>
          <Text style={styles.price}>{book.price?.toLocaleString()} đ</Text>
          <Text style={styles.oldPrice}>{fakeOriginalPrice.toLocaleString()} đ</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 150,
    height: 270,
    backgroundColor: '#fff',
    borderRadius: 14,
    margin: 8,
    padding: 8,
    elevation: 3,
  },
  imagesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 170,
    backgroundColor: '#fff',
    position: 'relative',
  },
  mainImage: {
    width: 120,
    height: 165,
    borderRadius: 12,
    alignSelf: 'center',
  },
  subImage: {
    width: 70,
    height: 100,
    borderRadius: 12,
    marginLeft: -16,
    zIndex: 1,
    opacity: 0.85,
    borderWidth: 2,
    borderColor: '#fff',
    alignSelf: 'center',
  },
  infoSection: {
    flex: 1,
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
    justifyContent: 'space-between',
    height: 80,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
    minHeight: 34,
  },
  author: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  price: {
    color: '#E53935',
    fontWeight: 'bold',
    fontSize: 15,
    marginRight: 6,
  },
  oldPrice: {
    color: '#aaa',
    fontSize: 11,
    textDecorationLine: 'line-through',
    marginRight: 4,
    marginLeft: 0,
  },
  badge: {
    backgroundColor: '#E53935',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginLeft: 0,
    marginRight: 0,
    alignSelf: 'center',
  },
  badgeTopRight: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#E53935',
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    zIndex: 10,
  },
  badgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 11,
  },
}); 
