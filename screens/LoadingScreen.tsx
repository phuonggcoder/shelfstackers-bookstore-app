import { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Image,
    StyleSheet,
    Text,
    View,
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

const LoadingScreen = () => {
  const [currentQuote, setCurrentQuote] = useState('');
  const [progress, setProgress] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Chọn câu trích dẫn ngẫu nhiên
    const randomQuote = bookQuotes[Math.floor(Math.random() * bookQuotes.length)];
    setCurrentQuote(randomQuote);

    // Animation cho fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Animation cho thanh loading
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false,
    }).start();

    // Animation pulse cho GIF
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Cập nhật progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 300);

    return () => clearInterval(interval);
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
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
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
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
});

export default LoadingScreen;
