// Login.tsx

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';

export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setIsLoading(true);
      const response = await authService.login({ username: email, password }) 
;
      await signIn(response);
      Alert.alert('Success', 'Login successful!', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') }
      ]);
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Login error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoBlock}>
        <Image
          source={require('../../assets/images/Ebooklogo.png')}
          style={styles.logo}
          contentFit="contain"
        />
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>Let&apos;s get you Login!</Text>
        <Text style={styles.subtitle}>Enter your information below</Text>
      </View>

      <View style={styles.socialContainer}>
        <TouchableOpacity style={styles.socialButton}>
          <Image source={require('../../assets/images/googlelogo.png')} style={styles.icon} />
          <Text style={styles.socialText}>Google</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.socialButton}>
          <Image source={require('../../assets/images/applelogo.png')} style={styles.icon} />
          <Text style={styles.socialText}>Apple</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dividerContainer}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>Or Login With</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Email Address</Text>
        <TextInput
          placeholder="Enter Email Address"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!isLoading}
        />

        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            placeholder="Enter Password"
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            editable={!isLoading}
          />
          <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
            <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={22} color="#888" />
          </TouchableOpacity>
        </View>

        <View style={styles.optionsRow}>
          <TouchableOpacity style={styles.checkboxRow} onPress={() => setRememberMe(!rememberMe)}>
            <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
              {rememberMe && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <Text style={styles.rememberText}>Remember Me</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.loginButton,
            (!email || !password || isLoading) && styles.loginButtonDisabled
          ]}
          onPress={handleLogin}
          disabled={!email || !password || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginButtonText}>Login</Text>
          )}
        </TouchableOpacity>

        <View style={styles.registerRow}>
          <Text style={styles.registerText}>Don’t have an account?</Text>
          <TouchableOpacity onPress={() => router.push('/register')}>
            <Text style={styles.registerLink}> Register Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24 },
  logoBlock: { alignItems: 'flex-start', marginTop: 40 },
  logo: { width: 60, height: 60 },

  header: {
    alignItems: 'flex-start',
    marginTop: 24,
    marginBottom: 24
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'System',
    textAlign: 'left'
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'System',
    marginTop: 4,
    textAlign: 'left'
  },

  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    justifyContent: 'center',
    width: '48%'
  },
  icon: { width: 20, height: 20, marginRight: 8 },
  socialText: { fontSize: 14, fontFamily: 'System' },

  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd'
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#888',
    fontSize: 12,
    fontFamily: 'System'
  },

  form: { marginTop: 10 },
  label: {
    fontSize: 14,
    color: '#444',
    marginBottom: 6,
    fontFamily: 'System'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 14,
    fontSize: 14,
    marginBottom: 16,
    fontFamily: 'System'
  },
  passwordContainer: { position: 'relative' },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    top: 18
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#4A3780',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6
  },
  checkboxChecked: {
    backgroundColor: '#4A3780'
  },
  rememberText: {
    fontSize: 13,
    color: '#333',
    fontFamily: 'System'
  },
  forgotText: {
    fontSize: 13,
    color: '#6B6BFF', // Nhạt hơn
    textDecorationLine: 'underline',
    fontFamily: 'System'
  },
  loginButton: {
    backgroundColor: '#6B6BFF',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 16
  },
  loginButtonDisabled: {
    backgroundColor: '#ccc'
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    fontFamily: 'System'
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center'
  },
  registerText: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'System'
  },
  registerLink: {
    fontSize: 13,
    color: '#6B6BFF', // Nhạt hơn
    fontWeight: '600',
    fontFamily: 'System'
  }
});
