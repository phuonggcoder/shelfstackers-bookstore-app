import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLanguage } from '../context/LanguageContext';

const LanguageScreen = () => {
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage, isLoading } = useLanguage();
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage);

  const languages = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  ];

  useEffect(() => {
    setSelectedLanguage(currentLanguage);
  }, [currentLanguage]);

  const onLanguageSelect = async (lang: string) => {
    try {
      setSelectedLanguage(lang);
      await changeLanguage(lang);
      
      // Show success message
      Alert.alert(
        t('languageChanged'),
        t('languageChangedMessage'),
        [{ text: t('ok'), onPress: () => {} }]
      );
    } catch (error) {
      console.error('Error changing language:', error);
      Alert.alert(
        t('error'),
        t('languageChangeError'),
        [{ text: t('ok'), onPress: () => {} }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backIcon} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('language')}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.description}>{t('selectLanguage')}</Text>
        
        <View style={styles.list}>
          {languages.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.languageOption,
                selectedLanguage === lang.code && styles.selectedOption,
              ]}
              onPress={() => onLanguageSelect(lang.code)}
            >
              <View style={styles.languageInfo}>
                <Text style={styles.flag}>{lang.flag}</Text>
                <Text style={[
                  styles.languageText,
                  selectedLanguage === lang.code && styles.selectedLanguageText
                ]}>
                  {lang.label}
                </Text>
              </View>
              {selectedLanguage === lang.code ? (
                <Ionicons name="checkmark-circle" size={24} color="#2f6ff2" />
              ) : (
                <Ionicons name="ellipse-outline" size={24} color="#ccc" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.bottomTab}>
        <TouchableOpacity style={styles.tabItem} onPress={() => router.replace('/(tabs)')}>
          <Ionicons name="home" size={22} color="#6C4AB6" />
          <Text style={[styles.tabText, { color: '#6C4AB6' }]}>{t('home')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => router.replace('/(tabs)/search')}>
          <Ionicons name="search-outline" size={22} color="gray" />
          <Text style={styles.tabText}>{t('search')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => router.replace('/(tabs)/categories')}>
          <Ionicons name="grid-outline" size={22} color="gray" />
          <Text style={styles.tabText}>{t('category')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => router.replace('/(tabs)/favourite')}>
          <Ionicons name="heart-outline" size={22} color="gray" />
          <Text style={styles.tabText}>{t('favorite')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => router.replace('/(tabs)/profile')}>
          <Ionicons name="person-outline" size={22} color="gray" />
          <Text style={styles.tabText}>{t('profile')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default LanguageScreen;

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  header: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backIcon: {
    position: 'absolute',
    left: 16,
    top: 18,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  list: {
    marginTop: 10,
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    marginBottom: 15,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  selectedOption: {
    backgroundColor: '#e6ecfd',
    borderColor: '#2f6ff2',
  },
  languageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flag: {
    fontSize: 24,
    marginRight: 12,
  },
  languageText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  selectedLanguageText: {
    color: '#2f6ff2',
    fontWeight: '600',
  },
  bottomTab: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 12,
    marginTop: 2,
    color: 'gray',
  },
});
