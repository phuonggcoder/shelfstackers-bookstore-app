import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CustomAlertProps {
  type?: 'success' | 'error' | 'info';
  title: string;
  description?: string;
  buttonText: string;
  onButtonPress: () => void;
}

const ICONS = {
  success: { color: '#2D5BFF', name: 'checkmark', bg: '#EAF0FF' },
  error: { color: '#4A90E2', name: 'close', bg: '#FFEAEA' },
  info: { color: '#2D5BFF', name: 'information', bg: '#EAF0FF' },
};

const CustomAlert: React.FC<CustomAlertProps> = ({
  type = 'info',
  title,
  description,
  buttonText,
  onButtonPress,
}) => {
  const { t } = useTranslation();
  const icon = ICONS[type];
  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: icon.bg }]}>
        <View style={[styles.iconCircle, { backgroundColor: icon.color }]}>
          <Ionicons name={icon.name as any} size={32} color="#fff" />
        </View>
      </View>
      <Text style={styles.title}>{t(title) || title}</Text>
      {!!description && <Text style={styles.desc}>{t(description) || description}</Text>}
      <TouchableOpacity style={styles.button} onPress={onButtonPress}>
        <Text style={styles.buttonText}>{t(buttonText) || buttonText}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
  },
  iconWrap: {
    marginBottom: 18,
    borderRadius: 999,
    padding: 12,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2D5BFF',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#222',
  },
  desc: {
    fontSize: 15,
    color: '#666',
    marginBottom: 22,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#2D5BFF',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 40,
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default CustomAlert;
