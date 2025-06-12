import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const SettingScreen = () => {
  const renderItem = (title: string, iconName: string) => (
    <TouchableOpacity style={styles.item} key={title}>
      <View style={styles.itemLeft}>
        <Icon name={iconName} size={20} color="#4460EF" style={styles.itemIcon} />
        <Text style={styles.itemText}>{title}</Text>
      </View>
      <Icon name="chevron-right" size={20} color="#999" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity>
          <Icon name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Setting</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require('../assets/images/profile.png')}
            style={styles.avatar}
          />
          <View>
            <Text style={styles.name}>Adam Smith</Text>
            <Text style={styles.role}>Author</Text>
          </View>
        </View>

        {/* Personal Info */}
        <Text style={styles.section}>Personal infor</Text>
        {renderItem('Profile', 'user')}
        {renderItem('Voucher', 'gift')}
        {renderItem('Wishlist Book', 'heart')}
        {renderItem('Purchase History', 'shopping-cart')}
        {renderItem('Payment Method', 'credit-card')}

        {/* Security */}
        <Text style={styles.section}>Security</Text>
        {renderItem('Change Password', 'key')}
        {renderItem('Forgot Password', 'lock')}
        {renderItem('Security', 'shield')}

        {/* General */}
        <Text style={styles.section}>General</Text>
        {renderItem('Language', 'globe')}
      </ScrollView>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton}>
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>
    </View>
  );
};

export default SettingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topBar: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: 20,
  paddingTop: 10, 
  paddingBottom: 10,
  backgroundColor: '#fff',
},

  topBarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#fff',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  role: {
    fontSize: 14,
    fontWeight: '400',
    color: '#888',
    marginTop: 2,
  },
  section: {
    marginTop: 15,
    marginLeft: 20,
    marginBottom: 5,
    fontWeight: 'bold',
    color: '#444',
    fontSize: 13,
  },
  item: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemIcon: {
    marginRight: 15,
  },
  itemText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#000',
  },
  logoutButton: {
    backgroundColor: '#4460EF',
    paddingVertical: 14,
    margin: 20,
    borderRadius: 30,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
