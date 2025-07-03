import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface Address {
  _id: string;
  receiver_name: string;
  phone_number: string;
  province: string;
  district: string;
  ward: string;
  address_detail: string;
  is_default: boolean;
  type: 'office' | 'home';
}

interface AddressSelectorProps {
  visible: boolean;
  addresses: Address[];
  selectedAddress: Address | null;
  onSelectAddress: (address: Address) => void;
  onAddNewAddress: () => void;
  onClose: () => void;
}

const AddressSelector: React.FC<AddressSelectorProps> = ({
  visible,
  addresses,
  selectedAddress,
  onSelectAddress,
  onAddNewAddress,
  onClose,
}) => {
  const formatAddress = (address: Address) => {
    const parts = [];
    if (address.address_detail) parts.push(address.address_detail);
    if (address.ward) parts.push(address.ward);
    if (address.district) parts.push(address.district);
    if (address.province) parts.push(address.province);
    return parts.join(', ');
  };

  const renderAddressItem = ({ item }: { item: Address }) => (
    <TouchableOpacity
      style={[
        styles.addressItem,
        selectedAddress?._id === item._id && styles.selectedAddressItem,
      ]}
      onPress={() => onSelectAddress(item)}
    >
      <View style={styles.addressHeader}>
        <Text style={styles.addressName}>{item.receiver_name}</Text>
        {item.is_default && (
          <View style={styles.defaultBadge}>
            <Text style={styles.defaultText}>Mặc định</Text>
          </View>
        )}
      </View>
      <Text style={styles.addressPhone}>{item.phone_number}</Text>
      <Text style={styles.addressText}>{formatAddress(item)}</Text>
      <View style={styles.addressType}>
        <Ionicons
          name={item.type === 'home' ? 'home-outline' : 'business-outline'}
          size={16}
          color="#666"
        />
        <Text style={styles.typeText}>
          {item.type === 'home' ? 'Nhà riêng' : 'Văn phòng'}
        </Text>
      </View>
      {selectedAddress?._id === item._id && (
        <View style={styles.checkmark}>
          <Ionicons name="checkmark-circle" size={24} color="#3255FB" />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#222" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chọn địa chỉ giao hàng</Text>
          <View style={{ width: 24 }} />
        </View>

        <FlatList
          data={addresses}
          keyExtractor={(item) => item._id}
          renderItem={renderAddressItem}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="location-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>Chưa có địa chỉ nào</Text>
            </View>
          }
        />

        <View style={styles.footer}>
          <TouchableOpacity style={styles.addButton} onPress={onAddNewAddress}>
            <Ionicons name="add-circle-outline" size={24} color="#fff" />
            <Text style={styles.addButtonText}>Thêm địa chỉ mới</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  listContainer: {
    padding: 16,
  },
  addressItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    position: 'relative',
  },
  selectedAddressItem: {
    backgroundColor: '#f0f8ff',
    borderWidth: 2,
    borderColor: '#3255FB',
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
  },
  defaultBadge: {
    backgroundColor: '#3255FB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  defaultText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  addressPhone: {
    color: '#666',
    fontSize: 14,
    marginBottom: 8,
  },
  addressText: {
    color: '#333',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  addressType: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeText: {
    color: '#666',
    fontSize: 12,
    marginLeft: 4,
  },
  checkmark: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  separator: {
    height: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
    marginTop: 12,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  addButton: {
    backgroundColor: '#3255FB',
    borderRadius: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
});

export default AddressSelector; 