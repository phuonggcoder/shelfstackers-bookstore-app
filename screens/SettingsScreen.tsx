import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

const SettingsScreen = () => {
  const router = useRouter();
  const [notifications, setNotifications] = React.useState(true);
  const [darkMode, setDarkMode] = React.useState(false);
  const [soundEffects, setSoundEffects] = React.useState(true);

  const SettingItem = ({ 
    icon, 
    label, 
    value, 
    onPress, 
    showArrow = true,
    toggle,
    danger = false,
  }: { 
    icon: string;
    label: string;
    value?: string;
    onPress?: () => void;
    showArrow?: boolean;
    toggle?: {
      value: boolean;
      onToggle: (value: boolean) => void;
    };
    danger?: boolean;
  }) => (
    <TouchableOpacity 
      style={[styles.settingItem, danger && styles.dangerItem]}
      onPress={onPress}
      disabled={!onPress && !toggle}
    >
      <View style={[styles.settingIcon, danger && styles.dangerIcon]}>
        <Ionicons name={icon as any} size={24} color={danger ? "#FF4444" : "#4A3780"} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingLabel, danger && styles.dangerLabel]}>{label}</Text>
        {value && <Text style={styles.settingValue}>{value}</Text>}
      </View>
      {toggle ? (
        <Switch
          value={toggle.value}
          onValueChange={toggle.onToggle}
          trackColor={{ false: '#D1D1D6', true: '#4A3780' }}
          thumbColor="#fff"
        />
      ) : showArrow ? (
        <Ionicons 
          name="chevron-forward" 
          size={24} 
          color={danger ? "#FF4444" : "#666"} 
        />
      ) : null}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Image
          source={{ uri: 'https://i.pravatar.cc/150' }}
          style={styles.avatar}
        />
        <Text style={styles.name}>Willie Robertson</Text>
        <Text style={styles.email}>willie.robertson@example.com</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Info</Text>
          <SettingItem
            icon="person-outline"
            label="Edit Profile"
            onPress={() => {}}
          />
          <SettingItem
            icon="card-outline"
            label="Payment Methods"
            onPress={() => router.push('/payment')}
          />
          <SettingItem
            icon="location-outline"
            label="Shipping Address"
            onPress={() => {}}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <SettingItem
            icon="lock-closed-outline"
            label="Change Password"
            onPress={() => {}}
          />
          <SettingItem
            icon="finger-print-outline"
            label="Face ID / Touch ID"
            toggle={{
              value: true,
              onToggle: () => {},
            }}
            showArrow={false}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General</Text>
          <SettingItem
            icon="notifications-outline"
            label="Push Notifications"
            toggle={{
              value: notifications,
              onToggle: setNotifications,
            }}
            showArrow={false}
          />
          <SettingItem
            icon="moon-outline"
            label="Dark Mode"
            toggle={{
              value: darkMode,
              onToggle: setDarkMode,
            }}
            showArrow={false}
          />
          <SettingItem
            icon="volume-high-outline"
            label="Sound Effects"
            toggle={{
              value: soundEffects,
              onToggle: setSoundEffects,
            }}
            showArrow={false}
          />
          <SettingItem
            icon="language-outline"
            label="Language"
            value="English (US)"
            onPress={() => {}}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Help & Support</Text>
          <SettingItem
            icon="help-circle-outline"
            label="FAQ"
            onPress={() => {}}
          />
          <SettingItem
            icon="chatbox-outline"
            label="Contact Support"
            onPress={() => {}}
          />
          <SettingItem
            icon="document-text-outline"
            label="Terms of Service"
            onPress={() => {}}
          />
          <SettingItem
            icon="shield-outline"
            label="Privacy Policy"
            onPress={() => {}}
          />
          <SettingItem
            icon="log-out-outline"
            label="Sign Out"
            onPress={() => {}}
            danger
          />
        </View>
      </View>

      <Text style={styles.version}>Version 1.0.0</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#4A3780',
    paddingTop: 40,
    paddingBottom: 20,
    alignItems: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  email: {
    fontSize: 14,
    color: '#E8E8FF',
  },
  content: {
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#666',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  dangerIcon: {
    backgroundColor: '#FFE8E8',
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
  settingValue: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  dangerItem: {
    marginTop: 20,
  },
  dangerLabel: {
    color: '#FF4444',
  },
  version: {
    textAlign: 'center',
    color: '#999',
    marginVertical: 20,
  },
});

export default SettingsScreen;
