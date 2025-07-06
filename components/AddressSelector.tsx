import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
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
  const formatAddress = (addr: Address) => {
    const parts = [];
    if (addr.address_detail) parts.push(addr.address_detail);
    if (addr.ward) parts.push(addr.ward);
    if (addr.district) parts.push(addr.district);
    if (addr.province) parts.push(addr.province);
    return parts.join(', ');
  };

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
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chọn địa chỉ giao hàng</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {addresses.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="location-outline" size={64} color="#ccc" />
              <Text style={styles.emptyTitle}>Chưa có địa chỉ nào</Text>
              <Text style={styles.emptySubtitle}>Thêm địa chỉ để nhận hàng</Text>
            </View>
          ) : (
            addresses.map((address) => (
              <TouchableOpacity
                key={address._id}
                style={[
                  styles.addressCard,
                  selectedAddress?._id === address._id && styles.selectedCard,
                ]}
                onPress={() => onSelectAddress(address)}
                activeOpacity={0.7}
              >
                <View style={styles.radioContainer}>
                  <Ionicons
                    name={
                      selectedAddress?._id === address._id
                        ? 'radio-button-on'
                        : 'radio-button-off'
                    }
                    size={24}
                    color={
                      selectedAddress?._id === address._id ? '#3255FB' : '#ccc'
                    }
                  />
                </View>
                <View style={styles.addressInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name}>{address.receiver_name}</Text>
                    <Text style={styles.phone}>{address.phone_number}</Text>
                    {address.is_default && (
                      <View style={styles.defaultTag}>
                        <Text style={styles.defaultText}>Mặc định</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.addressText}>{formatAddress(address)}</Text>
                  <View style={styles.typeTag}>
                    <Ionicons
                      name={
                        address.type === 'office'
                          ? 'business-outline'
                          : 'home-outline'
                      }
                      size={16}
                      color="#666"
                    />
                    <Text style={styles.typeText}>
                      {address.type === 'office' ? 'Văn phòng' : 'Nhà riêng'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={onAddNewAddress}
          >
            <Ionicons name="add" size={24} color="#fff" />
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  addressCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedCard: {
    borderColor: '#3255FB',
    backgroundColor: '#f8fbff',
  },
  radioContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  addressInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  name: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
    marginRight: 8,
  },
  phone: {
    color: '#666',
    fontSize: 14,
  },
  defaultTag: {
    backgroundColor: '#e8f4fd',
    borderRadius: 12,
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  defaultText: {
    color: '#3255FB',
    fontSize: 12,
    fontWeight: '500',
  },
  addressText: {
    color: '#333',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  typeTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeText: {
    color: '#666',
    fontSize: 12,
    marginLeft: 4,
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  addButton: {
    backgroundColor: '#3255FB',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default AddressSelector; 