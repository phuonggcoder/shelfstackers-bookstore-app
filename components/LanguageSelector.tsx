import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLanguage } from '../context/LanguageContext';

interface LanguageSelectorProps {
  showIcon?: boolean;
  style?: any;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  showIcon = true, 
  style 
}) => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();

  const getLanguageLabel = (code: string) => {
    switch (code) {
      case 'en':
        return 'English';
      case 'vi':
        return 'Tiếng Việt';
      default:
        return 'Tiếng Việt';
    }
  };

  const getLanguageFlag = (code: string) => {
    switch (code) {
      case 'en':
        return '🇺🇸';
      case 'vi':
        return '🇻🇳';
      default:
        return '🇻🇳';
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={() => router.push('/Language')}
    >
      <View style={styles.content}>
        {showIcon && (
          <View style={styles.iconContainer}>
            <Ionicons name="language" size={20} color="#6C4AB6" />
          </View>
        )}
        <View style={styles.textContainer}>
          <Text style={styles.label}>{t('language')}</Text>
          <View style={styles.languageInfo}>
            <Text style={styles.flag}>{getLanguageFlag(currentLanguage)}</Text>
            <Text style={styles.languageText}>
              {getLanguageLabel(currentLanguage)}
            </Text>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginVertical: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  languageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flag: {
    fontSize: 16,
    marginRight: 8,
  },
  languageText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
});

export default LanguageSelector; 
