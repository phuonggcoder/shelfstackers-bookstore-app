import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Image,
    StyleSheet,
    Text,
    View
} from 'react-native';

const { width, height } = Dimensions.get('window');

// Danh sách các câu trích dẫn về sách
const bookQuotes = [
  "Sách là người bạn tốt nhất của con người",
  "Đọc sách là cách để sống nhiều cuộc đời khác nhau",
  "Một cuốn sách hay là một người bạn hiền",
  "Sách mở ra những chân trời mới",
  "Đọc sách là cuộc hành trình của tâm hồn",
  "Sách là kho tàng tri thức nhân loại",
  "Mỗi trang sách là một cánh cửa mới",
  "Sách nuôi dưỡng tâm hồn và trí tuệ",
  "Đọc sách để khám phá thế giới",
  "Sách là ngọn đèn soi sáng con đường",
  "Một cuốn sách hay có thể thay đổi cuộc đời",
  "Sách là nguồn cảm hứng vô tận",
  "Đọc sách là cách học hỏi từ những người thông minh nhất",
  "Sách mở ra những góc nhìn mới về cuộc sống",
  "Mỗi cuốn sách là một cuộc phiêu lưu",
];

interface PullToRefreshLoadingScreenProps {
  onLoadingComplete?: () => void;
  duration?: number; // Thời gian loading (ms)
  isVisible?: boolean;
  onSlideUp?: () => void;
}

const PullToRefreshLoadingScreen: React.FC<PullToRefreshLoadingScreenProps> = ({
  onLoadingComplete,
  duration = 3000,
  isVisible = true,
  onSlideUp,
}) => {
  const [currentQuote, setCurrentQuote] = useState('');
  const [progress, setProgress] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isVisible) return;

    // Chọn câu trích dẫn ngẫu nhiên
    const randomQuote = bookQuotes[Math.floor(Math.random() * bookQuotes.length)];
    setCurrentQuote(randomQuote);

    // Animation cho fade in - ngay lập tức
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 100, // Nhanh hơn nữa
      useNativeDriver: true,
    }).start();

    // Animation cho thanh loading
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: duration,
      useNativeDriver: false,
    }).start();

    // Animation pulse cho GIF
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Slide up animation sau khi loading xong
    setTimeout(() => {
      setIsLoading(false);
      setTimeout(() => {
        Animated.timing(slideAnim, {
          toValue: -height,
          duration: 500, // Nhanh hơn
          useNativeDriver: true,
        }).start(() => {
          onSlideUp?.();
        });
      }, 200); // Giảm delay
    }, duration);

  }, [isVisible, duration, onSlideUp]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  if (!isVisible) return null;

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        }
      ]}
    >
      {/* Background image */}
      <Image
        source={require('../assets/images/bgbookloading.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      />

      {/* Overlay để làm tối background */}
      <View style={styles.overlay} />

      {/* Nội dung chính */}
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* GIF Loading với animation pulse */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Image
            source={require('../assets/images/loadingbook.gif')}
            style={styles.loadingGif}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Thanh loading */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressWidth,
                },
              ]}
            />
          </View>
        </View>

        {/* Text ngẫu nhiên */}
        <Text style={styles.quoteText}>{currentQuote}</Text>

        {/* Loading complete message */}
        {!isLoading && (
          <Animated.View style={[styles.completeMessage, { opacity: fadeAnim }]}>
            <Text style={styles.completeText}>Tải xong!</Text>
          </Animated.View>
        )}
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    zIndex: 9999, // Đè hoàn toàn lên tất cả layout
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 1,
  },
  content: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 2,
  },
  loadingGif: {
    width: 80,
    height: 80,
    marginBottom: 30,
  },
  progressContainer: {
    width: '70%',
    marginBottom: 25,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00CED1',
    borderRadius: 2,
  },
  quoteText: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '400',
    maxWidth: '85%',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  completeMessage: {
    marginTop: 15,
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 206, 209, 0.2)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#00CED1',
  },
  completeText: {
    color: '#00CED1',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default PullToRefreshLoadingScreen;
