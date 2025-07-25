import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomAlert from '../components/BottomAlert';
import { useAuth } from '../context/AuthContext';
import { deleteAddress, getAddresses, setDefaultAddress, updateAddress } from '../services/addressService';

const AddressListScreen = () => {
  const { token } = useAuth();
  const { from } = useLocalSearchParams();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDefaultModal, setShowDefaultModal] = useState(false);
  const [defaultChangeData, setDefaultChangeData] = useState<{
    currentName: string;
    newName: string;
    newId: string;
  } | null>(null);
  const router = useRouter();

  const isFromOrderReview = from === 'order-review';

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAddresses();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchAddresses();
    }, [])
  );

  const fetchAddresses = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await getAddresses(token);
      const arr = Array.isArray(res) ? res : res.addresses || [];
      setAddresses(arr);
      console.log('Fetched addresses:', arr);
      if (!selected && arr.length > 0) {
        const defaultAddr = arr.find((a: any) => a.is_default);
        setSelected(defaultAddr ? defaultAddr._id : arr[0]._id);
      }
    } catch (e) {
      setAddresses([]);
      console.error('Error fetching addresses:', e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    // Check if we're coming from add address screen
    const checkAddedAddress = async () => {
      try {
        const added = await AsyncStorage.getItem('address_added');
        if (added === 'true') {
          setShowAlert(true);
          await AsyncStorage.removeItem('address_added');
        }
      } catch (error) {
        console.error('Error checking added address:', error);
      }
    };
    checkAddedAddress();
  }, []);

  const handleDelete = async (id: string) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteId || !token) return;
    setShowDeleteModal(false);
    setLoading(true);
    try {
      await deleteAddress(token, deleteId);
      fetchAddresses();
    } catch (error) {
      console.error('Error deleting address:', error);
    }
    setLoading(false);
    setDeleteId(null);
  };

  const handleSetDefault = async (id: string) => {
    if (!token) return;
    const addrArr = addresses as any[];
    const currentDefault = addrArr.find((a) => a.is_default);
    const newDefault = addrArr.find((a) => a._id === id);
    if (currentDefault && newDefault && currentDefault._id !== id) {
      setDefaultChangeData({
        currentName: currentDefault.receiver_name,
        newName: newDefault.receiver_name,
        newId: id
      });
      setShowDefaultModal(true);
    } else if (!currentDefault && newDefault) {
      // Nếu chưa có mặc định, cho phép set luôn
      try {
        await setDefaultAddress(token, id);
        fetchAddresses();
      } catch (error) {
        console.error('Error setting default address:', error);
        Alert.alert('Lỗi', 'Không thể đặt địa chỉ mặc định');
      }
    }
  };

  const confirmSetDefault = async () => {
    if (!defaultChangeData || !token) return;
    setShowDefaultModal(false);
    setLoading(true);
    try {
      const addrArr = addresses as any[];
      // Set tất cả địa chỉ thành false trước
      const updatePromises = addrArr.map((addr) => 
        updateAddress(token, addr._id, { is_default: false })
      );
      await Promise.all(updatePromises);
      
      // Sau đó set địa chỉ mới thành true
      await setDefaultAddress(token, defaultChangeData.newId);
      fetchAddresses();
    } catch (error) {
      console.error('Error setting default address:', error);
      Alert.alert('Lỗi', 'Không thể đặt địa chỉ mặc định');
    } finally {
      setLoading(false);
      setDefaultChangeData(null);
    }
  };

  const handleConfirm = () => {
    if (!selected) {
      Alert.alert('Lỗi', 'Vui lòng chọn một địa chỉ');
      return;
    }
    
    const selectedAddress = addresses.find((addr: any) => addr._id === selected);
    if (selectedAddress) {
      // Store selected address and go back to order review
      AsyncStorage.setItem('selected_address', JSON.stringify(selectedAddress));
      router.back();
    }
  };

  const formatAddress = (addr: any) => {
    const parts = [];
    if (addr.address_detail) parts.push(addr.address_detail);
    if (addr.street) parts.push(addr.street);
    if (addr.ward) parts.push(addr.ward);
    if (addr.district) parts.push(addr.district);
    if (addr.province) parts.push(addr.province);
    return parts.join(', ');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isFromOrderReview ? 'Chọn địa chỉ giao hàng' : 'Địa chỉ giao hàng'}
        </Text>
        <TouchableOpacity onPress={() => router.push('/add-address')}>
          <Ionicons name="add" size={24} color="#3255FB" />
        </TouchableOpacity>
      </View>

      <BottomAlert
        title="Thêm địa chỉ thành công!"
        visible={showAlert}
        onHide={() => setShowAlert(false)}
      />

      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalBox}>
            <Text style={styles.deleteTitle}>Xóa địa chỉ</Text>
            <Text style={styles.deleteDesc}>Không thể khôi phục địa chỉ đã xóa.</Text>
            <View style={styles.deleteBtnRow}>
              <TouchableOpacity style={styles.keepBtn} onPress={() => setShowDeleteModal(false)}>
                <Text style={styles.keepBtnText}>Giữ lại</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmDeleteBtn} onPress={confirmDelete}>
                <Text style={styles.confirmDeleteText}>Đồng ý</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showDefaultModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDefaultModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.defaultChangeModalBox}>
            <Text style={styles.defaultChangeTitle}>Thay đổi địa chỉ mặc định</Text>
            <Text style={styles.defaultChangeDesc}>
              Bạn có muốn thay đổi địa chỉ mặc định từ "{defaultChangeData?.currentName}" thành "{defaultChangeData?.newName}" không?
            </Text>
            <View style={styles.defaultChangeBtnRow}>
              <TouchableOpacity style={styles.cancelDefaultChangeBtn} onPress={() => setShowDefaultModal(false)}>
                <Text style={styles.cancelDefaultChangeText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmDefaultChangeBtn} onPress={confirmSetDefault}>
                <Text style={styles.confirmDefaultChangeText}>Đồng ý</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3255FB" />
          <Text style={styles.loadingText}>Đang tải địa chỉ...</Text>
        </View>
      ) : (
        <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3255FB']}
            tintColor="#3255FB"
          />
        }
      >
          {addresses.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="location-outline" size={64} color="#ccc" />
              <Text style={styles.emptyTitle}>Chưa có địa chỉ nào</Text>
              <Text style={styles.emptySubtitle}>Thêm địa chỉ để nhận hàng nhanh chóng</Text>
            </View>
          ) : (
            <>
              {addresses.map((addr: any) => (
                <View key={addr._id} style={styles.addressCard}>
                  <TouchableOpacity 
                    style={styles.radioRow} 
                    onPress={() => setSelected(addr._id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.radioContainer}>
                      <Ionicons
                        name={selected === addr._id ? 'radio-button-on' : 'radio-button-off'}
                        size={24}
                        color={selected === addr._id ? '#3255FB' : '#ccc'}
                      />
                    </View>
                    <View style={styles.addressInfo}>
                      <View style={styles.nameRow}>
                        <Text style={styles.name}>{addr.receiver_name}</Text>
                        <Text style={styles.phone}>{addr.phone_number}</Text>
                        {/* Chỉ hiển thị Mặc định cho địa chỉ mặc định thực sự */}
                        {addr.is_default && (
                          <View style={styles.defaultTag}>
                            <Text style={styles.defaultText}>Mặc định</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.addressText}>{formatAddress(addr)}</Text>
                      {/* Hiển thị loại địa chỉ */}
                      <View style={styles.addressTypeRow}>
                        <View style={styles.typeTag}>
                          <Text style={styles.typeText}>
                            {addr.type === 'office' ? '🏢 Văn phòng' : '🏠 Nhà riêng'}
                          </Text>
                        </View>
                      </View>
                      {addr.note && (
                        <Text style={styles.noteText}>Ghi chú: {addr.note}</Text>
                      )}
                    </View>
                    {!isFromOrderReview && (
                      <View style={styles.actionButtons}>
                        <TouchableOpacity 
                          style={styles.editButton}
                          onPress={() => router.push(`/edit-address?id=${addr._id}`)}
                        >
                          <Ionicons name="create-outline" size={20} color="#3255FB" />
                        </TouchableOpacity>
                        {!addr.is_default && (
                          <TouchableOpacity 
                            style={styles.defaultButton}
                            onPress={() => handleSetDefault(addr._id)}
                          >
                            <Ionicons name="star-outline" size={20} color="#FFD700" />
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity 
                          style={styles.deleteButton}
                          onPress={() => handleDelete(addr._id)}
                        >
                          <Ionicons name="trash-outline" size={20} color="#4A90E2" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              ))}
              
              {/* Add address button in list */}
              <TouchableOpacity 
                style={styles.addAddressInList}
                onPress={() => router.push('/add-address')}
              >
                <Ionicons name="add" size={20} color="#3255FB" />
                <Text style={styles.addAddressInListText}>Thêm địa chỉ mới</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      )}

      {isFromOrderReview && addresses.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.confirmButton, !selected && styles.confirmButtonDisabled]} 
            onPress={handleConfirm}
            disabled={!selected}
          >
            <Text style={styles.confirmButtonText}>Xác nhận địa chỉ</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff' 
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
  headerTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#333' 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
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
    paddingHorizontal: 20,
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
  radioRow: { 
    flexDirection: 'row', 
    alignItems: 'flex-start',
    padding: 16,
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
    paddingVertical: 2 
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
  noteText: {
    color: '#666',
    fontSize: 12,
    fontStyle: 'italic',
  },
  addressTypeRow: {
    flexDirection: 'row',
    marginTop: 8,
    alignItems: 'center',
  },
  typeTag: {
    backgroundColor: '#e0f2fe',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  typeText: {
    fontSize: 12,
    color: '#3255FB',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    marginLeft: 12,
  },
  editButton: {
    padding: 8,
    marginRight: 8,
  },
  defaultButton: {
    padding: 8,
    marginRight: 8,
  },
  deleteButton: {
    padding: 8,
  },
  addAddressInList: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
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
  addAddressInListText: {
    color: '#3255FB',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  confirmButton: {
    backgroundColor: '#3255FB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
  },
  confirmButtonDisabled: {
    backgroundColor: '#ccc',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteModalBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: 280,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  deleteTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#222',
  },
  deleteDesc: {
    fontSize: 14,
    color: '#888',
    marginBottom: 24,
    textAlign: 'center',
  },
  deleteBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  keepBtn: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    paddingVertical: 12,
    marginRight: 8,
    alignItems: 'center',
  },
  keepBtnText: {
    color: '#e57373',
    fontWeight: 'bold',
    fontSize: 16,
  },
  confirmDeleteBtn: {
    flex: 1,
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  confirmDeleteText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  defaultChangeModalBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: 280,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  defaultChangeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#222',
  },
  defaultChangeDesc: {
    fontSize: 14,
    color: '#888',
    marginBottom: 24,
    textAlign: 'center',
  },
  defaultChangeBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cancelDefaultChangeBtn: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    paddingVertical: 12,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelDefaultChangeText: {
    color: '#e57373',
    fontWeight: 'bold',
    fontSize: 16,
  },
  confirmDefaultChangeBtn: {
    flex: 1,
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  confirmDefaultChangeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default AddressListScreen;
