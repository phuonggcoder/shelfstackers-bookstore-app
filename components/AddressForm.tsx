import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Platform
} from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import AddressService, { Province, District, Ward } from '../services/addressService';
import Picker from './common/Picker';

// Validation Schema
const validationSchema = Yup.object().shape({
  fullName: Yup.string()
    .required('Vui lòng nhập họ tên')
    .min(2, 'Họ tên phải có ít nhất 2 ký tự'),
  phone: Yup.string()
    .required('Vui lòng nhập số điện thoại')
    .matches(/^[0-9]{10}$/, 'Số điện thoại không hợp lệ'),
  street: Yup.string()
    .required('Vui lòng nhập địa chỉ')
    .min(3, 'Địa chỉ phải có ít nhất 3 ký tự'),
  province: Yup.object()
    .required('Vui lòng chọn tỉnh/thành phố')
    .nullable(),
  district: Yup.object()
    .required('Vui lòng chọn quận/huyện')
    .nullable(),
  ward: Yup.object()
    .required('Vui lòng chọn phường/xã')
    .nullable(),
});

interface AddressFormProps {
  onSubmit: (values: any) => Promise<void>;
  initialValues?: any;
  isLoading?: boolean;
}

const AddressForm: React.FC<AddressFormProps> = ({
  onSubmit,
  initialValues,
  isLoading = false
}) => {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);

  // Load provinces on mount
  useEffect(() => {
    loadProvinces();
  }, []);

  // Load initial districts and wards if initialValues provided
  useEffect(() => {
    if (initialValues?.province?.code) {
      loadDistricts(initialValues.province.code);
    }
    if (initialValues?.district?.code) {
      loadWards(initialValues.district.code);
    }
  }, [initialValues]);

  const loadProvinces = async () => {
    try {
      setLoadingLocations(true);
      const data = await AddressService.getProvinces();
      setProvinces(data);
    } catch (error) {
      console.error('Error loading provinces:', error);
    } finally {
      setLoadingLocations(false);
    }
  };

  const loadDistricts = async (provinceCode: string) => {
    if (!provinceCode) return;
    try {
      setLoadingLocations(true);
      const data = await AddressService.getDistricts(provinceCode);
      setDistricts(data);
    } catch (error) {
      console.error('Error loading districts:', error);
    } finally {
      setLoadingLocations(false);
    }
  };

  const loadWards = async (districtCode: string) => {
    if (!districtCode) return;
    try {
      setLoadingLocations(true);
      const data = await AddressService.getWards(districtCode);
      setWards(data);
    } catch (error) {
      console.error('Error loading wards:', error);
    } finally {
      setLoadingLocations(false);
    }
  };

  return (
    <Formik
      initialValues={{
        fullName: initialValues?.fullName || '',
        phone: initialValues?.phone || '',
        street: initialValues?.street || '',
        province: initialValues?.province || null,
        district: initialValues?.district || null,
        ward: initialValues?.ward || null,
        isDefault: initialValues?.isDefault || false,
      }}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
    >
      {({
        handleChange,
        handleBlur,
        handleSubmit,
        setFieldValue,
        values,
        errors,
        touched,
        isValid,
        dirty
      }) => (
        <ScrollView style={styles.container}>
          {/* Họ tên */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Họ tên</Text>
            <TextInput
              style={[
                styles.input,
                touched.fullName && errors.fullName && styles.inputError
              ]}
              onChangeText={handleChange('fullName')}
              onBlur={handleBlur('fullName')}
              value={values.fullName}
              placeholder="Nhập họ tên"
              placeholderTextColor="#999"
            />
            {touched.fullName && errors.fullName && (
              <Text style={styles.errorText}>{errors.fullName}</Text>
            )}
          </View>

          {/* Số điện thoại */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Số điện thoại</Text>
            <TextInput
              style={[
                styles.input,
                touched.phone && errors.phone && styles.inputError
              ]}
              onChangeText={handleChange('phone')}
              onBlur={handleBlur('phone')}
              value={values.phone}
              placeholder="Nhập số điện thoại"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
            />
            {touched.phone && errors.phone && (
              <Text style={styles.errorText}>{errors.phone}</Text>
            )}
          </View>

          {/* Tỉnh/Thành phố */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Tỉnh/Thành phố</Text>
            <Picker
              selectedValue={values.province}
              onValueChange={(province) => {
                setFieldValue('province', province);
                setFieldValue('district', null);
                setFieldValue('ward', null);
                if (province) {
                  loadDistricts(province.code);
                }
              }}
              items={provinces}
              displayKey="name"
              valueKey="code"
              placeholder="Chọn Tỉnh/Thành phố"
              error={touched.province && errors.province}
            />
          </View>

          {/* Quận/Huyện */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Quận/Huyện</Text>
            <Picker
              selectedValue={values.district}
              onValueChange={(district) => {
                setFieldValue('district', district);
                setFieldValue('ward', null);
                if (district) {
                  loadWards(district.code);
                }
              }}
              items={districts}
              displayKey="name"
              valueKey="code"
              placeholder="Chọn Quận/Huyện"
              error={touched.district && errors.district}
              disabled={!values.province}
            />
          </View>

          {/* Phường/Xã */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Phường/Xã</Text>
            <Picker
              selectedValue={values.ward}
              onValueChange={(ward) => setFieldValue('ward', ward)}
              items={wards}
              displayKey="name"
              valueKey="code"
              placeholder="Chọn Phường/Xã"
              error={touched.ward && errors.ward}
              disabled={!values.district}
            />
          </View>

          {/* Địa chỉ chi tiết */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Địa chỉ chi tiết</Text>
            <TextInput
              style={[
                styles.input,
                touched.street && errors.street && styles.inputError
              ]}
              onChangeText={handleChange('street')}
              onBlur={handleBlur('street')}
              value={values.street}
              placeholder="Số nhà, tên đường"
              placeholderTextColor="#999"
              multiline
            />
            {touched.street && errors.street && (
              <Text style={styles.errorText}>{errors.street}</Text>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!isValid || !dirty || isLoading) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit as any}
            disabled={!isValid || !dirty || isLoading}
          >
            {isLoading || loadingLocations ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Lưu địa chỉ</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}
    </Formik>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  inputError: {
    borderColor: '#ff4444',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddressForm;
