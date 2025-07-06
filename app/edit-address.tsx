import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AutocompleteInput from '../components/AutocompleteInput';
import { useAuth } from '../context/AuthContext';
import { LocationItem, deleteAddress, getAddresses, getDistricts, getProvinces, getWards, updateAddress } from '../services/addressService';

const EditAddressScreen = () => {
  const { token } = useAuth();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [receiver_name, setReceiverName] = useState('');
  const [phone_number, setPhoneNumber] = useState('');
  const [province, setProvince] = useState<LocationItem | null>(null);
  const [district, setDistrict] = useState<LocationItem | null>(null);
  const [ward, setWard] = useState<LocationItem | null>(null);
  const [address_detail, setAddressDetail] = useState('');
  const [is_default, setIsDefault] = useState(false);
  const [type, setType] = useState<'office' | 'home'>('office');
  const router = useRouter();

  useEffect(() => {
    if (id) {
      fetchAddress();
    }
  }, [id]);

  const fetchAddress = async () => {
    setLoading(true);
    try {
      const addresses = await getAddresses(token);
      const addr = addresses.find((a: any) => a._id === id);
      
      if (!addr) {
        console.error('Address not found');
        return;
      }

      // Fetch id for province
      let provinceObj = null, districtObj = null, wardObj = null;
      if (addr.province) {
        const provinces = await getProvinces(addr.province);
        provinceObj = provinces.find(p => p.name === addr.province) || { id: '', name: addr.province };
      }
      if (addr.district && provinceObj?.id) {
        const districts = await getDistricts(provinceObj.id, addr.district);
        districtObj = districts.find(d => d.name === addr.district) || { id: '', name: addr.district };
      }
      if (addr.ward && districtObj?.id) {
        const wards = await getWards(districtObj.id, addr.ward);
        wardObj = wards.find(w => w.name === addr.ward) || { id: '', name: addr.ward };
      }

      setReceiverName(addr.receiver_name);
      setPhoneNumber(addr.phone_number);
      setProvince(provinceObj);
      setDistrict(districtObj);
      setWard(wardObj);
      setAddressDetail(addr.address_detail);
      setIsDefault(addr.is_default);
      setType(addr.type || 'office');
    } catch (e) {
      console.error('Error fetching address:', e);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (!id) {
        console.error('Address ID is missing');
        return;
      }
      await updateAddress(token, id as string, {
        receiver_name,
        phone_number,
        province: province?.name || '',
        district: district?.name || '',
        ward: ward?.name || '',
        address_detail,
        is_default,
        type,
      });
      router.replace('/address-list');
    } catch (e) {
      console.error('Error updating address:', e);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      if (!id) {
        console.error('Address ID is missing');
        return;
      }
      await deleteAddress(token, id as string);
      router.replace('/address-list');
    } catch (e) {
      console.error('Error deleting address:', e);
    }
    setLoading(false);
  };

  if (loading) return <ActivityIndicator size="large" color="#4A3780" style={{ marginTop: 40 }} />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chỉnh sửa địa chỉ</Text>
      <View style={styles.formBox}>
        <Text style={styles.label}>Họ và tên</Text>
        <TextInput style={styles.input} value={receiver_name} onChangeText={setReceiverName} placeholder="Họ và tên" />
        <Text style={styles.label}>Số điện thoại</Text>
        <TextInput style={styles.input} value={phone_number} onChangeText={setPhoneNumber} placeholder="Số điện thoại" keyboardType="phone-pad" />
        
        <AutocompleteInput
          label="Tỉnh/Thành phố"
          placeholder="Chọn Tỉnh/Thành phố"
          value={province}
          onSelect={setProvince}
          level="province"
        />
        
        <AutocompleteInput
          label="Quận/Huyện"
          placeholder="Chọn Quận/Huyện"
          value={district}
          onSelect={setDistrict}
          level="district"
          provinceId={province?.id}
          disabled={!province}
        />
        
        <AutocompleteInput
          label="Phường/Xã"
          placeholder="Chọn Phường/Xã"
          value={ward}
          onSelect={setWard}
          level="ward"
          districtId={district?.id}
          disabled={!district}
        />
        
        <Text style={styles.label}>Chi tiết địa chỉ</Text>
        <TextInput style={styles.input} value={address_detail} onChangeText={setAddressDetail} placeholder="Chi tiết địa chỉ" multiline />
        
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
