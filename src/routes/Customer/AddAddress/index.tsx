import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { connect } from 'react-redux';
import { Formik } from 'formik';
import * as Yup from 'yup';
import Icon from '@expo/vector-icons/Ionicons';
import colors from '@colors';
import { Medium } from '@fonts';
import { wp, hp } from '@utils/utilities';
import { Header, TextField, Button } from '@components/common';
import { requestPermission, getCurrentLocation, reverseGeocodeDetailed, geocodeAddress } from '@library/location';
import * as UserActions from '@store/Users/actions';
import * as CommonActions from '@store/Common/actions';

const LABELS = ['Home', 'Work', 'Other'];
const schema = Yup.object().shape({
  address_line1: Yup.string().min(4, 'Too short').required('Required'),
  city: Yup.string().min(2, 'Required').required('Required'),
});

let connectState = (state) => ({ user: state.Auth.auth.get('user') });
let enhancer = connect(connectState, { ...UserActions, ...CommonActions });

function AddAddress({ navigation, user, createAddress, setAddress }) {
  const [label, setLabel] = useState('Home');
  const [coords, setCoords] = useState(null);
  const [locating, setLocating] = useState(false);

  const useCurrent = async (setFieldValue) => {
    setLocating(true);
    try {
      const granted = await requestPermission();
      if (!granted) { Alert.alert('Permission needed', 'Allow location access.'); return; }
      const current = await getCurrentLocation();
      setCoords(current);
      const detail = await reverseGeocodeDetailed(current);
      if (detail) {
        if (detail.line1) setFieldValue('address_line1', detail.line1);
        if (detail.city) setFieldValue('city', detail.city);
      }
    } finally {
      setLocating(false);
    }
  };

  const submit = async (values) => {
    try {
      let point = coords;
      if (!point) point = await geocodeAddress(`${values.address_line1}, ${values.city}`);
      const address = await createAddress({
        label,
        address_line1: values.address_line1,
        city: values.city,
        user_id: user.id,
        latitude: point && point.latitude,
        longitude: point && point.longitude,
      });
      setAddress(address);
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to save');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Add Address" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Formik initialValues={{ address_line1: '', city: '' }} validationSchema={schema} onSubmit={submit}>
          {({ handleChange, handleSubmit, setFieldValue, values, errors, touched }) => (
            <>
              <TouchableOpacity style={styles.locBtn} onPress={() => useCurrent(setFieldValue)} disabled={locating}>
                {locating ? <ActivityIndicator color={colors.primary} size="small" /> : <Icon name="navigate" size={wp(4.5)} color={colors.primary} />}
                <Text style={styles.locText}>{locating ? 'Getting location...' : 'Use my current location'}</Text>
                {coords && !locating ? <Icon name="checkmark-circle" size={wp(4.5)} color={colors.success} /> : null}
              </TouchableOpacity>

              <Text style={styles.label}>Label</Text>
              <View style={styles.labelRow}>
                {LABELS.map((l) => (
                  <TouchableOpacity key={l} onPress={() => setLabel(l)} style={[styles.chip, label === l && styles.chipActive]}>
                    <Text style={[styles.chipText, label === l && styles.chipTextActive]}>{l}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextField label="Address" placeholder="Street address, building..." value={values.address_line1} onChangeText={handleChange('address_line1')} error={touched.address_line1 && errors.address_line1} />
              <TextField label="City" value={values.city} onChangeText={handleChange('city')} error={touched.city && errors.city} />
              <Button label="Save Address" onPress={handleSubmit} buttonStyle={{ marginTop: wp(2) }} />
            </>
          )}
        </Formik>
      </ScrollView>
    </SafeAreaView>
  );
}

export default enhancer(AddAddress);

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.white
  },
  scroll: {
    padding: wp(6)
  },
  locBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(2.5),
    backgroundColor: colors.primarySoft,
    borderRadius: wp(3),
    paddingVertical: hp(1.6),
    marginBottom: hp(2.5),
    borderWidth: 1,
    borderColor: colors.primaryDim
  },
  locText: {
    fontWeight: Medium,
    fontSize: wp(3.6),
    color: colors.primaryDark
  },
  label: {
    fontWeight: Medium,
    fontSize: wp(3.4),
    color: colors.dark700,
    marginBottom: hp(1)
  },
  labelRow: {
    flexDirection: 'row',
    gap: wp(2.5),
    marginBottom: hp(2)
  },
  chip: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.2),
    borderRadius: wp(3),
    borderWidth: 1.5,
    borderColor: colors.border
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  chipText: {
    fontWeight: Medium,
    fontSize: wp(3.4),
    color: colors.dark600
  },
  chipTextActive: {
    color: colors.white
  }
});
