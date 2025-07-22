import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import i18n from '../app/i18n'; 

const LanguageScreen = () => {
  const { t } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language || 'vi');

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'vi', label: 'Tiếng Việt' },
  ];

  const onLanguageSelect = async (lang: string) => {
    setSelectedLanguage(lang);
    await i18n.changeLanguage(lang);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backIcon} onPress={() => router.push('/(tabs)/profile')}>
          <Ionicons name="chevron-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('language')}</Text>
      </View>

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
            <Text style={styles.languageText}>{lang.label}</Text>
            {selectedLanguage === lang.code ? (
              <Ionicons name="checkmark-circle" size={20} color="#2f6ff2" />
            ) : (
              <Ionicons name="ellipse-outline" size={20} color="#f2c2c2" />
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.bottomTab}>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="home" size={22} color="#6C4AB6" />
          <Text style={[styles.tabText, { color: '#6C4AB6' }]}>{t('home')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="search-outline" size={22} color="gray" />
          <Text style={styles.tabText}>{t('search')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="grid-outline" size={22} color="gray" />
          <Text style={styles.tabText}>{t('category')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="heart-outline" size={22} color="gray" />
          <Text style={styles.tabText}>{t('favorite')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="person-outline" size={22} color="gray" />
          <Text style={styles.tabText}>{t('profile')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default LanguageScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
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
  list: {
    marginTop: 20,
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  selectedOption: {
    backgroundColor: '#e6ecfd',
  },
  languageText: {
    fontSize: 16,
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
