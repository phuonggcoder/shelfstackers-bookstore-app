import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';

const API_URL = 'https://server-shelf-stacker.onrender.com/api/addresses';

const EditAddressScreen = () => {
  const { token } = useAuth();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [receiver_name, setReceiverName] = useState('');
  const [phone_number, setPhoneNumber] = useState('');
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [ward, setWard] = useState('');
  const [street, setStreet] = useState('');
  const [address_detail, setAddressDetail] = useState('');
  const [is_default, setIsDefault] = useState(false);
  const [type, setType] = useState<'office' | 'home'>('office');
  const router = useRouter();

  useEffect(() => {
    fetchAddress();
  }, [id]);

  const fetchAddress = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const addr = res.data.address;
      setReceiverName(addr.receiver_name);
      setPhoneNumber(addr.phone_number);
      setProvince(addr.province);
      setDistrict(addr.district);
      setWard(addr.ward);
      setStreet(addr.street);
      setAddressDetail(addr.address_detail);
      setIsDefault(addr.is_default);
      setType(addr.type || 'office');
    } catch {}
    setLoading(false);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await axios.put(`${API_URL}/${id}`, {
        receiver_name,
        phone_number,
        province,
        district,
        ward,
        street,
        address_detail,
        is_default,
        type,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      router.replace('/address-list');
    } catch (e) {}
    setLoading(false);
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await axios.delete(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      router.replace('/address-list');
    } catch (e) {}
    setLoading(false);
  };

  if (loading) return <ActivityIndicator size="large" color="#4A3780" style={{ marginTop: 40 }} />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chọn địa chỉ</Text>
      <View style={styles.formBox}>
        <Text style={styles.label}>Họ và tên</Text>
        <TextInput style={styles.input} value={receiver_name} onChangeText={setReceiverName} placeholder="Họ và tên" />
        <Text style={styles.label}>Số điện thoại</Text>
        <TextInput style={styles.input} value={phone_number} onChangeText={setPhoneNumber} placeholder="Số điện thoại" keyboardType="phone-pad" />
        <Text style={styles.label}>Tỉnh/Thành phố, Quận/Huyện, Phường/Xã</Text>
        <TextInput style={styles.input} value={province} onChangeText={setProvince} placeholder="Tỉnh/Thành phố" />
        <TextInput style={styles.input} value={district} onChangeText={setDistrict} placeholder="Quận/Huyện" />
        <TextInput style={styles.input} value={ward} onChangeText={setWard} placeholder="Phường/Xã" />
        <Text style={styles.label}>Tên đường, Tòa nhà, Số nhà</Text>
        <TextInput style={styles.input} value={street} onChangeText={setStreet} placeholder="Tên đường, Tòa nhà, Số nhà" />
        <TextInput style={styles.input} value={address_detail} onChangeText={setAddressDetail} placeholder="Chi tiết địa chỉ" />
        <View style={styles.switchRow}>
          <Text style={styles.label}>Đặt làm địa chỉ mặc định</Text>
          <Switch value={is_default} onValueChange={setIsDefault} />
        </View>
        <View style={styles.typeRow}>
          <Text style={styles.label}>Loại địa chỉ</Text>
          <TouchableOpacity style={[styles.typeBtn, type === 'office' && styles.typeBtnActive]} onPress={() => setType('office')}>
            <Text style={[styles.typeText, type === 'office' && styles.typeTextActive]}>Văn Phòng</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.typeBtn, type === 'home' && styles.typeBtnActive]} onPress={() => setType('home')}>
            <Text style={[styles.typeText, type === 'home' && styles.typeTextActive]}>Nhà riêng</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.btnRow}>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteText}>Xóa địa chỉ</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveText}>Hoàn thành</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginVertical: 16 },
  formBox: { backgroundColor: '#F8F9FF', borderRadius: 12, padding: 16, marginBottom: 20 },
  label: { fontSize: 15, color: '#333', marginTop: 10 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E5E5', borderRadius: 8, padding: 10, marginTop: 5 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 15 },
  typeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 15 },
  typeBtn: { borderWidth: 1, borderColor: '#4A3780', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 16, marginLeft: 10 },
  typeBtnActive: { backgroundColor: '#4A3780' },
  typeText: { color: '#4A3780', fontSize: 14 },
  typeTextActive: { color: '#fff' },
  btnRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  deleteBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#4A3780', borderRadius: 25, paddingVertical: 15, alignItems: 'center', flex: 1, marginRight: 10 },
  deleteText: { color: '#4A3780', fontSize: 16, fontWeight: 'bold' },
  saveBtn: { backgroundColor: '#4A3780', borderRadius: 25, paddingVertical: 15, alignItems: 'center', flex: 1, marginLeft: 10 },
  saveText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default EditAddressScreen;
