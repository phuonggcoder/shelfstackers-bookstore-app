import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CustomOutOfStockAlert({ visible, onClose }: { visible: boolean, onClose: () => void }) {
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          friction: 7,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.7,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.overlay}>
        <Animated.View style={[styles.container, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>  
          <View style={styles.iconWrap}>
            <Ionicons name="alert-circle" size={36} color="#fff" />
          </View>
          <Text style={styles.title}>Sách đã hết hàng</Text>
          <Text style={styles.message}>Vui lòng quay lại sau!</Text>
          <TouchableOpacity style={styles.button} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.buttonText}>Okay</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.15)', justifyContent: 'center', alignItems: 'center' },
  container: { backgroundColor: '#fff', borderRadius: 18, padding: 28, alignItems: 'center', width: 300 },
  iconWrap: { backgroundColor: '#F44', borderRadius: 99, padding: 10, marginBottom: 10, marginTop: -36, borderWidth: 4, borderColor: '#fff' },
  title: { fontWeight: 'bold', fontSize: 18, color: '#222', marginTop: 8, marginBottom: 2, textAlign: 'center' },
  message: { color: '#666', fontSize: 15, marginBottom: 18, textAlign: 'center' },
  button: { backgroundColor: '#ccc', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 40, marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
}); 
