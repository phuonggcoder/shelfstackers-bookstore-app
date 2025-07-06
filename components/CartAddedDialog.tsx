import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Modal, StyleSheet, Text, View } from 'react-native';

export default function CartAddedDialog({ visible, onHide }) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
      const timer = setTimeout(onHide, 1200);
      return () => clearTimeout(timer);
    } else {
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.overlay}>
        <Animated.View style={[styles.box, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}> 
          <Ionicons name="checkmark" size={32} color="#fff" style={{ marginBottom: 8 }} />
          <Text style={styles.text}>Đã thêm vào giỏ hàng</Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' },
  box: { backgroundColor: '#181A20', borderRadius: 16, paddingVertical: 18, paddingHorizontal: 32, alignItems: 'center', minWidth: 180 },
  text: { color: '#fff', fontSize: 16, fontWeight: '400' },
}); 