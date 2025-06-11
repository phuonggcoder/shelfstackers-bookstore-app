import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';

export default function AddNewAddressScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [postalCode, setPostalCode] = useState('');

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.backIconWrapper}>
          <Ionicons name="chevron-back" size={24} color="black" />
        </View>
        <Text style={styles.headerTitle}>Add New Address</Text>
      </View>

      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Enter your name"
      />

      <Text style={styles.label}>Email Address</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="Enter your email"
        keyboardType="email-address"
      />

      <Text style={styles.label}>Phone Number</Text>
      <TextInput
        style={styles.input}
        value={phone}
        onChangeText={setPhone}
        placeholder="Enter your phone number"
        keyboardType="phone-pad"
      />

      <Text style={styles.label}>Address</Text>
      <TextInput
        style={styles.input}
        value={address}
        onChangeText={setAddress}
        placeholder="Enter your address"
      />

      <Text style={[styles.label, styles.boldLabel]}>City</Text>
      <Picker
        style={styles.input}
        selectedValue={city}
        onValueChange={(itemValue) => setCity(itemValue)}>
        <Picker.Item label="Select City" value="" />
        <Picker.Item label="California" value="California" />
        <Picker.Item label="New York" value="New York" />
        <Picker.Item label="Texas" value="Texas" />
      </Picker>

      <Text style={[styles.label, styles.boldLabel]}>Country</Text>
      <Picker
        style={styles.input}
        selectedValue={country}
        onValueChange={(itemValue) => setCountry(itemValue)}>
        <Picker.Item label="Select Country" value="" />
        <Picker.Item label="United States" value="United States" />
        <Picker.Item label="Canada" value="Canada" />
        <Picker.Item label="Mexico" value="Mexico" />
      </Picker>

      <Text style={styles.label}>Postal Code</Text>
      <TextInput
        style={styles.input}
        value={postalCode}
        onChangeText={setPostalCode}
        placeholder="Enter postal code"
        keyboardType="numeric"
      />

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Add Address</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    position: 'relative',
  },
  backIconWrapper: {
    position: 'absolute',
    left: 0,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Lexend',
  },
  label: {
    color: '#aaa',
    marginBottom: 5,
    marginTop: 15,
    fontSize: 14,
    fontFamily: 'Lexend',
  },
  boldLabel: {
    color: '#000',
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontSize: 16,
    fontFamily: 'Lexend',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#3B82F6',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 40,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Lexend',
  },
});
