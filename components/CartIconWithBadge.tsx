import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

type Props = {
  count: number;
  color?: string;
  size?: number;
  animated?: boolean;
};

export default function CartIconWithBadge({ count, color = '#222', size = 26, animated = false }: Props) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (animated) {
      scaleAnim.setValue(1.3);
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start();
    }
  }, [count, animated]);
  if (!count || count < 1) return <Ionicons name="cart-outline" size={size} color={color} />;
  return (
    <View>
      <Ionicons name="cart-outline" size={size} color={color} />
      <Animated.View style={[styles.badge, { transform: [{ scale: scaleAnim }] }]}> 
        <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: '#F44',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    paddingHorizontal: 4,
    zIndex: 10,
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
}); 
