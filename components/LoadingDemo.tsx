import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useBookDetailLoading } from '../hooks/useBookDetailLoading';
import { useHomeLoading } from '../hooks/useHomeLoading';
import PullToRefreshLoadingScreen from '../screens/PullToRefreshLoadingScreen';

const LoadingDemo: React.FC = () => {
  const [showHomeDemo, setShowHomeDemo] = useState(false);
  const [showBookDemo, setShowBookDemo] = useState(false);
  
  const { 
    isLoading: homeLoading, 
    showLoadingScreen: homeShowLoading, 
    startLoading: homeStartLoading, 
    stopLoading: homeStopLoading 
  } = useHomeLoading();
  
  const { 
    isLoading: bookLoading, 
    showLoadingScreen: bookShowLoading, 
    startLoading: bookStartLoading, 
    stopLoading: bookStopLoading 
  } = useBookDetailLoading();

  const handleHomeLoading = () => {
    setShowHomeDemo(true);
    homeStartLoading(5000); // 5 seconds
  };

  const handleBookLoading = () => {
    setShowBookDemo(true);
    bookStartLoading(3000); // 3 seconds
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Loading Screen Demo</Text>
      
      <TouchableOpacity style={styles.button} onPress={handleHomeLoading}>
        <Text style={styles.buttonText}>Test Home Loading (5s)</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleBookLoading}>
        <Text style={styles.buttonText}>Test Book Loading (3s)</Text>
      </TouchableOpacity>

      {/* Home Loading Demo */}
      <PullToRefreshLoadingScreen
        isVisible={homeShowLoading}
        duration={5000}
        onSlideUp={() => {
          homeStopLoading();
          setShowHomeDemo(false);
        }}
      />

      {/* Book Loading Demo */}
      <PullToRefreshLoadingScreen
        isVisible={bookShowLoading}
        duration={3000}
        onSlideUp={() => {
          bookStopLoading();
          setShowBookDemo(false);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
  },
  button: {
    backgroundColor: '#00CED1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 10,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LoadingDemo;

