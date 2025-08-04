import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LanguageSelector from './LanguageSelector';

// Ví dụ về cách thêm LanguageSelector vào profile screen
const ProfileLanguageExample = () => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings')}</Text>
        
        {/* Cách 1: Sử dụng LanguageSelector component */}
        <LanguageSelector />
        
        {/* Cách 2: Tự tạo UI tương tự */}
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Ionicons name="notifications-outline" size={22} color="#3255FB" style={styles.icon} />
            <View style={styles.textContainer}>
              <Text style={styles.settingLabel}>{t('notifications')}</Text>
              <Text style={styles.settingSubtext}>{t('manageNotifications')}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Ionicons name="help-circle-outline" size={22} color="#3255FB" style={styles.icon} />
            <View style={styles.textContainer}>
              <Text style={styles.settingLabel}>{t('help')}</Text>
              <Text style={styles.settingSubtext}>{t('getHelp')}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Ionicons name="information-circle-outline" size={22} color="#3255FB" style={styles.icon} />
            <View style={styles.textContainer}>
              <Text style={styles.settingLabel}>{t('about')}</Text>
              <Text style={styles.settingSubtext}>{t('appInfo')}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: '#fff',
    marginVertical: 8,
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  settingSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
});

export default ProfileLanguageExample; 