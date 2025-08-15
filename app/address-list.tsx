import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Modal, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useUnifiedModal } from '../context/UnifiedModalContext';
import AddressService, { UserAddress } from '../services/addressService';

const AddressListScreen = () => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const { showErrorToast, showDialog, hideModal } = useUnifiedModal();
  const { from } = useLocalSearchParams();
  const isFromOrderReview = from === 'order-review';
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const router = useRouter();
  const [showLoginModal, setShowLoginModal] = useState(false);
  

  // ...existing code...

  const fetchAddresses = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await AddressService.getAddresses(token);
      const arr = Array.isArray(res) ? res : [];
      setAddresses(arr);
      console.log('Fetched addresses:', arr);
      if (!selected && arr.length > 0) {
        // Support both isDefault and is_default
        const defaultAddr = arr.find((addr) => addr.isDefault || addr.is_default);
        setSelected(defaultAddr ? defaultAddr._id : arr[0]._id);
      }
    } catch (e) {
      setAddresses([]);
      console.error('Error fetching addresses:', e);
    } finally {
      setLoading(false);
    }
  }, [token, selected]);

  // Tự động fetch địa chỉ khi vào màn hình
  useFocusEffect(
    React.useCallback(() => {
      fetchAddresses();
    }, [fetchAddresses])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAddresses();
    setRefreshing(false);
  }, [fetchAddresses]);

  const handleDelete = async (id: string) => {
    if (!id || !token) return;
    setLoading(true);
    try {
      await AddressService.deleteAddress(token, id);
      fetchAddresses();
    } catch (error) {
      console.error('Error deleting address:', error);
      showErrorToast(t('error'), t('cannotDeleteAddress'));
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    if (!token) return;
    const addrArr = addresses as any[];
    const currentDefault = addrArr.find((a) => a.is_default);
    const newDefault = addrArr.find((a) => a._id === id);
    if (currentDefault && newDefault && currentDefault._id !== id) {
      showDialog(
        t('changeDefaultAddress'),
        t('confirmChangeDefaultAddress', { current: currentDefault.fullName, new: newDefault.fullName }),
        t('confirm'),
        t('cancel'),
        'info',
        () => {
          hideModal();
          confirmSetDefault(id);
        },
        () => {
          hideModal();
          console.log('Change default cancelled');
        }
      );
    } else if (!currentDefault && newDefault) {
      // Nếu chưa có mặc định, cho phép set luôn
      try {
        await AddressService.setDefaultAddress(token, id);
        fetchAddresses();
      } catch (error) {
        console.error('Error setting default address:', error);
        showErrorToast(t('error'), t('cannotSetDefaultAddress'));
      }
    }
  };

  const confirmSetDefault = async (id: string) => {
    if (!id || !token) return;
    setLoading(true);
    try {
      const addrArr = addresses as UserAddress[];
      // Set tất cả địa chỉ thành false trước
      const targetAddr = addrArr.find(addr => addr._id === id);
      if (!targetAddr) {
        throw new Error('Address not found');
      }

      // Update all addresses to not default, including the province information
      const updatePromises = addrArr.map((addr) => 
        AddressService.updateAddress(token, addr._id, { 
          isDefault: false,
          province: {
            code: addr.province,
            name: addr.province,
            type: '0',
            typeText: ''
          }
        })
      );
      await Promise.all(updatePromises);
      
      // Sau đó set địa chỉ mới thành true
      await AddressService.setDefaultAddress(token, id);
      fetchAddresses();
    } catch (error) {
      console.error('Error setting default address:', error);
      showErrorToast(t('error'), t('cannotSetDefaultAddress'));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!selected) {
      showErrorToast(t('pleaseSelectAddress'));
      return;
    }
    // Support both isDefault and is_default
    const selectedAddress = addresses.find((addr: any) => addr._id === selected);
    if (selectedAddress) {
      AsyncStorage.setItem('selected_address', JSON.stringify(selectedAddress));
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isFromOrderReview ? t('selectShippingAddress') : t('shippingAddress')}
        </Text>
        <TouchableOpacity onPress={() => router.push('/add-address')}>
          <Ionicons name="add" size={24} color="#3255FB" />
        </TouchableOpacity>
      </View>

   

      {/* Modal đăng nhập nếu chưa đăng nhập */}
      <Modal
        visible={showLoginModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLoginModal(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 32, alignItems: 'center', width: 320 }}>
            <Ionicons name="log-in-outline" size={48} color="#3255FB" style={{ marginBottom: 16 }} />
            <Text style={{ fontWeight: 'bold', fontSize: 20, marginBottom: 8 }}>{t('notLoggedIn')}</Text>
            <Text style={{ color: '#666', marginBottom: 24, textAlign: 'center' }}>{t('pleaseLoginToUseFeature')}</Text>
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <TouchableOpacity
                style={{ backgroundColor: '#3255FB', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 24, marginRight: 8 }}
                onPress={() => {
                  setShowLoginModal(false);
                  router.push('/(auth)/login');
                }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{t('login')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ backgroundColor: '#eee', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 24 }}
                onPress={() => setShowLoginModal(false)}
              >
                <Text style={{ color: '#3255FB', fontWeight: 'bold', fontSize: 16 }}>{t('skip')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>





      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3255FB" />
          <Text style={styles.loadingText}>{t('loadingAddresses')}</Text>
        </View>
      ) : (
        <FlatList
          style={styles.content}
          data={addresses}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          windowSize={5}
          initialNumToRender={10}
          maxToRenderPerBatch={5}
          updateCellsBatchingPeriod={50}
          removeClippedSubviews={true}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#3255FB']}
              tintColor="#3255FB"
            />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Ionicons name="location-outline" size={64} color="#ccc" />
              <Text style={styles.emptyTitle}>{t('noAddressesYet')}</Text>
              <Text style={styles.emptySubtitle}>{t('addAddressForQuickDelivery')}</Text>
            </View>
          )}
          renderItem={({ item: addr }) => (
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
                    <Text style={styles.name}>{addr.fullName} <Text style={styles.phone}>| {addr.phone}</Text></Text>
                    {(addr.isDefault || addr.is_default) && (
                      <View style={styles.defaultTag}>
                        <Text style={styles.defaultText}>{t('default')}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.addressText}>{addr.fullAddress}</Text>
                  {/* Hiển thị loại địa chỉ */}
                  <View style={styles.addressTypeRow}>
                    <View style={styles.typeTag}>
                      <Text style={styles.typeText}>
                        {addr.type === 'office' ? t('office') : t('home')}
                      </Text>
                    </View>
                  </View>
                  {addr.note && (
                    <Text style={styles.noteText}>{t('note')}: {addr.note}</Text>
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
                    {!(addr.isDefault || addr.is_default) && (
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
          )}
          ListFooterComponent={() => (
            <TouchableOpacity 
              style={styles.addAddressInList}
              onPress={() => router.push('/add-address')}
            >
              <Ionicons name="add" size={20} color="#3255FB" />
              <Text style={styles.addAddressInListText}>{t('addNewAddress')}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      {isFromOrderReview && addresses.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.confirmButton, !selected && styles.confirmButtonDisabled]} 
            onPress={handleConfirm}
            disabled={!selected}
          >
            <Text style={styles.confirmButtonText}>{t('confirmAddress')}</Text>
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
  addButton: {
    backgroundColor: '#3255FB',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 12,
    alignSelf: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: 300,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#222',
  },
  modalMessage: {
    fontSize: 14,
    color: '#888',
    marginBottom: 24,
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: '#3255FB',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 8,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
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
    fontWeight: 'normal',
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
