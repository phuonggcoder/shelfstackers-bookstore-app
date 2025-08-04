import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getAvailableVouchers, Voucher } from '../services/voucherService';

const VoucherScreen = () => {
  const { t } = useTranslation();
  const { user, token } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState('all');
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const TABS = [
    { key: 'all', label: t('all') },
    { key: 'active', label: t('active') },
    { key: 'expired', label: t('expired') },
  ];

  useEffect(() => {
    fetchVouchers();
  }, [tab]);

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const response = await getAvailableVouchers(token || '');
      let all: Voucher[] = response.vouchers || [];
      const now = new Date();
      if (tab === 'active') {
        all = all.filter(v => v.is_active && new Date(v.end_date) > now);
      } else if (tab === 'expired') {
        all = all.filter(v => new Date(v.end_date) <= now);
      }
      setVouchers(all);
    } catch (error: any) {
      console.error('Error fetching vouchers:', error);
      // Handle admin-only error gracefully
      if (error.msg?.includes('Admins only')) {
        setVouchers([]);
        console.log('Voucher API requires admin access, showing empty list');
      } else {
        setVouchers([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderVoucher = (v: Voucher) => {
    const now = new Date();
    const expired = new Date(v.end_date) <= now;
    const daysLeft = Math.ceil((new Date(v.end_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const isCollected = false; // TODO: Add collected status from backend
    return (
      <View style={[styles.voucherBox, expired ? styles.voucherBoxExpired : isCollected ? styles.voucherBoxCollected : styles.voucherBoxActive]}> 
        <View style={styles.voucherHeaderRow}>
          <Text style={[styles.voucherHeader, expired && { color: '#ccc' }, !expired && !isCollected && { color: '#E14D4D' }]}>{t('voucher')}</Text>
          {expired ? (
            <Text style={styles.voucherExpiredText}>{t('expired')}</Text>
          ) : daysLeft <= 3 ? (
            <View style={styles.voucherTimeRow}>
              <Text style={styles.voucherDaysLeft}>{t('daysLeft', { count: daysLeft })}</Text>
              <Text style={styles.voucherValidUntil}>{t('validUntil')} {new Date(v.end_date).toLocaleDateString('en-GB')}</Text>
            </View>
          ) : (
            <Text style={styles.voucherValidUntil}>{t('validUntil')} {new Date(v.end_date).toLocaleDateString('en-GB')}</Text>
          )}
        </View>
        <View style={styles.voucherContentRow}>
          <Ionicons name="gift-outline" size={24} color="#3255FB" style={{ marginRight: 8 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.voucherTitle}>{v.title || v.voucher_id || t('giftFromCustomerCare')}</Text>
            <Text style={styles.voucherDesc}>{v.description || (v.voucher_type === 'percentage' ? t('percentageDiscount', { value: v.discount_value }) : t('amountDiscount', { value: v.discount_value.toLocaleString() }))}</Text>
          </View>
          <TouchableOpacity style={[styles.collectedBtn, expired ? styles.collectedBtnExpired : isCollected ? styles.collectedBtnActive : styles.collectedBtnNormal]} disabled>
            <Text style={styles.collectedBtnText}>{expired ? t('expired') : isCollected ? t('collected') : t('collect')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('vouchers')}</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.tabRow}>
        {TABS.map(t => (
          <TouchableOpacity key={t.key} style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]} onPress={() => setTab(t.key)}>
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.inputRow}>
        <View style={styles.inputBox}>
          <Ionicons name="ticket-outline" size={20} color="#3255FB" style={{ marginRight: 6 }} />
          <TextInput
            style={styles.input}
            placeholder={t('enterVoucherCode')}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity style={styles.findBtn}>
          <Ionicons name="search" size={20} color="#3255FB" />
          <Text style={styles.findBtnText}>{t('findMoreVouchers')}</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={vouchers}
        keyExtractor={v => v._id}
        renderItem={({ item }) => renderVoucher(item)}
        style={{ marginTop: 10 }}
        ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#888', marginTop: 40 }}>{t('noVouchers')}</Text>}
        refreshing={loading}
        onRefresh={fetchVouchers}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: 'bold', color: '#222' },
  tabRow: { flexDirection: 'row', marginBottom: 16 },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: '#F5F6FA', marginHorizontal: 2 },
  tabBtnActive: { backgroundColor: '#3255FB' },
  tabText: { textAlign: 'center', color: '#888', fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  inputBox: { flex: 1, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#3255FB', borderRadius: 8, paddingHorizontal: 10, backgroundColor: '#fff', marginRight: 8 },
  input: { flex: 1, height: 40, fontSize: 15 },
  findBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F6FA', borderRadius: 8, paddingHorizontal: 10, height: 40 },
  findBtnText: { color: '#3255FB', fontWeight: '600', marginLeft: 4 },
  voucherBox: { borderWidth: 2, borderRadius: 12, marginBottom: 16, padding: 14, backgroundColor: '#fff' },
  voucherBoxActive: { borderColor: '#3255FB' },
  voucherBoxCollected: { borderColor: '#3255FB', borderStyle: 'dashed' },
  voucherBoxExpired: { borderColor: '#E14D4D', backgroundColor: '#fff5f5' },
  voucherHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  voucherHeader: { fontWeight: 'bold', fontSize: 16, color: '#3255FB', flex: 1 },
  voucherTimeRow: { flexDirection: 'row', alignItems: 'center' },
  voucherDaysLeft: { color: '#E14D4D', fontWeight: 'bold', marginRight: 8 },
  voucherValidUntil: { color: '#888', fontSize: 13 },
  voucherExpiredText: { color: '#E14D4D', fontWeight: 'bold', fontSize: 13 },
  voucherContentRow: { flexDirection: 'row', alignItems: 'center' },
  voucherTitle: { fontWeight: 'bold', fontSize: 15, marginBottom: 2 },
  voucherDesc: { color: '#333', fontSize: 13 },
  collectedBtn: { marginLeft: 10, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 },
  collectedBtnNormal: { backgroundColor: '#3255FB' },
  collectedBtnActive: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#3255FB' },
  collectedBtnExpired: { backgroundColor: '#eee' },
  collectedBtnText: { color: '#fff', fontWeight: 'bold' },
});

export default VoucherScreen; 