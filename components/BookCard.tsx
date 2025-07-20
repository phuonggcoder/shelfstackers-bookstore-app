import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import React, { memo, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { addToWishlist, removeFromWishlist } from '../services/api';
import { Book } from '../types';
import { formatVND, getBookImageUrl } from '../utils/format';

interface Props {
  book: Book;
  isFavorited?: boolean;
  onFavoriteChange?: (bookId: string, isFavorited: boolean) => void;
}

const BookCard = ({ book, isFavorited = false, onFavoriteChange }: Props) => {
  const { token } = useAuth();
  const [favorited, setFavorited] = useState(isFavorited);
  const [loading, setLoading] = useState(false);
  
  const firstCategory = book.categories && book.categories.length > 0 ? book.categories[0] : null;

  useEffect(() => {
    setFavorited(isFavorited);
  }, [isFavorited]);

  const handleFavoritePress = async () => {
    if (!token) {
      Alert.alert('Thông báo', 'Vui lòng đăng nhập để thêm sách yêu thích');
      return;
    }

    if (loading) return;

    try {
      setLoading(true);
      
      if (favorited) {
        // Remove from favorites
        await removeFromWishlist(token, book._id);
        setFavorited(false);
        onFavoriteChange?.(book._id, false);
      } else {
        // Add to favorites
        await addToWishlist(token, book._id);
        setFavorited(true);
        onFavoriteChange?.(book._id, true);
      }
    } catch (error) {
      console.error('Favorite error:', error);
      Alert.alert('Lỗi', 'Không thể thay đổi trạng thái yêu thích');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Link href={`/book/${book._id}` as any} asChild>
      <TouchableOpacity style={styles.container}>
        <View>
            <Image 
                source={{ uri: getBookImageUrl(book) }} 
                style={styles.image}
                contentFit="cover"
                transition={300}
            />
            <TouchableOpacity 
              style={[styles.favIcon, favorited && styles.favIconActive]}
              onPress={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleFavoritePress();
              }}
              disabled={loading}
            >
                <Feather 
                  name={favorited ? "heart" : "heart"} 
                  size={18} 
                  color={favorited ? "#ff4757" : "#fff"} 
                  fill={favorited ? "#ff4757" : "none"}
                />
            </TouchableOpacity>
        </View>
        <View style={styles.content}>
            <View>
                <Text style={styles.author} numberOfLines={1}>{book.author}</Text>
                <Text style={styles.title} numberOfLines={2}>{book.title}</Text>
                {firstCategory && (
                  <Link href={`/category/${firstCategory._id}?name=${encodeURIComponent(firstCategory.name)}` as any} asChild>
                    <TouchableOpacity>
                      <Text style={styles.category}>{firstCategory.name}</Text>
                    </TouchableOpacity>
                  </Link>
                )}
            </View>
            <View style={styles.priceContainer}>
                <Text style={styles.price}>{formatVND(book.price)}</Text>
                <Text style={styles.oldPrice}>{formatVND(book.price * 1.2)}</Text>
            </View>
        </View>
      </TouchableOpacity>
    </Link>
  );
};

const styles = StyleSheet.create({
    container: {
        width: 130,
        marginRight: 15,
    },
    image: {
        width: '100%',
        height: 170,
        borderRadius: 10,
    },
    favIcon: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.3)',
        padding: 5,
        borderRadius: 15,
    },
    favIconActive: {
        backgroundColor: 'rgba(255, 71, 87, 0.3)',
    },
    content: {
        marginTop: 8,
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'space-between',
    },
    author: {
        fontSize: 12,
        color: '#888',
    },
    title: {
        fontSize: 14,
        fontWeight: '600',
        marginVertical: 3,
        color: '#333'
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    price: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#5E5CE6',
    },
    oldPrice: {
        fontSize: 12,
        color: '#999',
        textDecorationLine: 'line-through',
        marginLeft: 8,
    },
    category: {
        fontSize: 12,
        color: '#5E5CE6',
        marginTop: 2,
    },
});

export default memo(BookCard); 