import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface SimpleFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filter: { price: number; sort: 'az' | 'za' | null }) => void;
  onAdvanced: () => void;
}

const MAX_PRICE = 1000000;

const SimpleFilterModal = ({ visible, onClose, onApply, onAdvanced }: SimpleFilterModalProps) => {
  const [price, setPrice] = useState(0);
  const [sort, setSort] = useState<'az' | 'za' | null>(null);

  const handleApply = () => {
    onApply({ price, sort });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={styles.modalContent}>
        <Text style={styles.label}>( N: số tiền sẽ tương ứng với khoảng sẽ hiện ở trên đầu )</Text>
        <Slider
          style={{ width: '100%', height: 40 }}
          minimumValue={0}
          maximumValue={MAX_PRICE}
          step={10000}
          value={price}
          onValueChange={setPrice}
          minimumTrackTintColor="#5E5CE6"
          maximumTrackTintColor="#ddd"
          thumbTintColor="#5E5CE6"
        />
        <View style={styles.priceRow}>
          <Text style={styles.priceText}>0đ</Text>
          <Text style={styles.priceText}>{MAX_PRICE.toLocaleString()}đ</Text>
        </View>
        <Text style={styles.selectedPrice}>N: {price.toLocaleString()}đ</Text>
        <View style={styles.sortRow}>
          <TouchableOpacity style={styles.checkboxRow} onPress={() => setSort(sort === 'az' ? null : 'az')}>
            <View style={[styles.checkbox, sort === 'az' && styles.checkboxChecked]}>
              {sort === 'az' && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
            <Text style={styles.sortLabel}>A-Z (tăng dần)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.checkboxRow} onPress={() => setSort(sort === 'za' ? null : 'za')}>
            <View style={[styles.checkbox, sort === 'za' && styles.checkboxChecked]}>
              {sort === 'za' && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
            <Text style={styles.sortLabel}>Z-A (giảm dần)</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity onPress={onAdvanced}>
            <Text style={styles.advanced}>Nâng Cao</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
            <Text style={styles.applyText}>Xác nhận</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  modalContent: {
    position: 'absolute',
    top: '30%',
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  label: {
    fontSize: 13,
    color: '#444',
    marginBottom: 8,
    textAlign: 'center',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  priceText: {
    fontSize: 14,
    color: '#888',
  },
  selectedPrice: {
    fontSize: 15,
    color: '#5E5CE6',
    textAlign: 'center',
    marginVertical: 8,
    fontWeight: 'bold',
  },
  sortRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10,
    gap: 24,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#5E5CE6',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  checkboxChecked: {
    backgroundColor: '#5E5CE6',
    borderColor: '#5E5CE6',
  },
  sortLabel: {
    fontSize: 15,
    color: '#222',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
  },
  advanced: {
    color: '#1976D2',
    fontWeight: 'bold',
    fontSize: 15,
  },
  applyBtn: {
    backgroundColor: '#5E5CE6',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 22,
  },
  applyText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});

export default SimpleFilterModal; 
