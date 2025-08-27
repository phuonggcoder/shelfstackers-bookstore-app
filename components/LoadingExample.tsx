import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLoadingScreen } from '../hooks/useLoadingScreen';
import LoadingScreenWrapper from './LoadingScreenWrapper';

const LoadingExample: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const { isLoading, showLoading, hideLoading, withLoading } = useLoadingScreen();

  const handleShowModal = () => {
    setShowModal(true);
    // Tự động ẩn sau 5 giây
    setTimeout(() => {
      setShowModal(false);
    }, 5000);
  };

  const handleShowLoading = () => {
    showLoading();
    // Tự động ẩn sau 3 giây
    setTimeout(() => {
      hideLoading();
    }, 3000);
  };

  const handleAsyncLoading = async () => {
    await withLoading(async () => {
      // Giả lập async operation
      await new Promise(resolve => setTimeout(resolve, 4000));
      console.log('Async operation completed!');
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Loading Screen Examples</Text>
      
      <TouchableOpacity style={styles.button} onPress={handleShowModal}>
        <Text style={styles.buttonText}>Show Modal Loading (5s)</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleShowLoading}>
        <Text style={styles.buttonText}>Show Loading (3s)</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleAsyncLoading}>
        <Text style={styles.buttonText}>Async Loading (4s)</Text>
      </TouchableOpacity>

      {/* Modal Loading */}
      <LoadingScreenWrapper 
        visible={showModal} 
        onRequestClose={() => setShowModal(false)} 
      />

      {/* Hook Loading */}
      <LoadingScreenWrapper 
        visible={isLoading} 
        onRequestClose={hideLoading} 
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

export default LoadingExample;

