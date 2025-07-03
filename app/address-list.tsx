import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import BottomAlert from '../components/BottomAlert';
import { useAuth } from '../context/AuthContext';

const API_URL = 'https://server-shelf-stacker.onrender.com/api/addresses';

const AddressListScreen = () => {
  const { token } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAddresses(res.data.addresses || []);
      if (res.data.addresses && res.data.addresses.length > 0) {
        const defaultAddr = res.data.addresses.find((a: any) => a.is_default);
        setSelected(defaultAddr ? defaultAddr._id : res.data.addresses[0]._id);
      }
    } catch (e) {
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (router && router.query && router.query.added === '1') {
      setShowAlert(true);
      fetchAddresses();
    }
  }, [router]);

  const handleDelete = async (id: string) => {
    Alert.alert('Xóa địa chỉ', 'Bạn có chắc muốn xóa địa chỉ này?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: async () => {
        try {
          await axios.delete(`${API_URL}/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          fetchAddresses();
        } catch {}
      }}
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chọn địa chỉ nhận hàng</Text>
      <Text style={styles.sectionTitle}>Địa chỉ</Text>
      <BottomAlert
        type="success"
        title="Thêm địa chỉ thành công!"
        buttonText="Đóng"
        visible={showAlert}
        onButtonPress={() => setShowAlert(false)}
      />
      {loading ? (
        <ActivityIndicator size="large" color="#4A3780" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView style={{ flex: 1 }}>
          {addresses.map((addr: any) => (
            <View key={addr._id} style={styles.addressCard}>
              <TouchableOpacity style={styles.radioRow} onPress={() => setSelected(addr._id)}>
                <Ionicons
                  name={selected === addr._id ? 'radio-button-on' : 'radio-button-off'}
                  size={22}
                  color={selected === addr._id ? '#4A3780' : '#888'}
                />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.name}>{addr.receiver_name}</Text>
                    <Text style={styles.phone}> ({addr.phone_number})</Text>
                    {addr.is_default && (
                      <View style={styles.defaultTag}><Text style={styles.defaultText}>Mặc định</Text></View>
                    )}
                  </View>
                  <Text style={styles.address}>{addr.address_detail}</Text>
                  <Text style={styles.address}>{addr.street}, {addr.ward}, {addr.district}, {addr.province}</Text>
                </View>
                <TouchableOpacity onPress={() => router.push(`/edit-address?id=${addr._id}`)}>
                  <Text style={styles.editText}>Sửa</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(addr._id)}>
                  <Ionicons name="trash-outline" size={20} color="#888" style={{ marginLeft: 8 }} />
                </TouchableOpacity>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/add-address')}>
            <Ionicons name="add-circle-outline" size={20} color="#4A3780" />
            <Text style={styles.addText}>Thêm địa chỉ mới</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginVertical: 16 },
  sectionTitle: { fontSize: 16, color: '#4A3780', fontWeight: 'bold', marginBottom: 8 },
  addressCard: { borderBottomWidth: 1, borderColor: '#E5E5E5', paddingVertical: 10 },
  radioRow: { flexDirection: 'row', alignItems: 'center' },
  name: { fontWeight: 'bold', fontSize: 15, color: '#222' },
  phone: { color: '#888', fontSize: 13, marginLeft: 5 },
  defaultTag: { backgroundColor: '#E5E8FF', borderRadius: 5, marginLeft: 8, paddingHorizontal: 6, paddingVertical: 2 },
  defaultText: { color: '#4A3780', fontSize: 11 },
  address: { color: '#444', fontSize: 13 },
  editText: { color: '#4A3780', fontSize: 13, marginLeft: 8 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  addText: { color: '#4A3780', fontSize: 15, marginLeft: 5 },
});

export default AddressListScreen;
