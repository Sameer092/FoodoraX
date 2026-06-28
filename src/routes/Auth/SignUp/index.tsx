import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { connect } from 'react-redux';
import { Formik } from 'formik';
import * as Yup from 'yup';
import Icon from '@expo/vector-icons/Ionicons';
import colors from '@colors';
import { Bold, Medium, Regular } from '@fonts';
import { wp, hp } from '@utils/utilities';
import { Button, TextField } from '@components/common';
import * as AuthActions from '@store/Auth/actions';
import * as LoaderActions from '@store/Loader/actions';

const ROLES = [
  { value: 'customer', label: 'Customer', icon: 'person-outline' },
  { value: 'restaurant_owner', label: 'Restaurant', icon: 'restaurant-outline' },
  { value: 'rider', label: 'Rider', icon: 'bicycle-outline' },
];

const VEHICLES = ['Motorcycle', 'Bicycle', 'Car', 'Scooter'];

const schema = Yup.object().shape({
  full_name: Yup.string().min(2, 'Too short').required('Required'),
  email: Yup.string().email('Invalid email').required('Required'),
  password: Yup.string().min(8, 'Min 8 characters').required('Required'),
  confirm: Yup.string().oneOf([Yup.ref('password')], "Passwords don't match").required('Required'),
});

let enhancer = connect(null, { ...AuthActions, ...LoaderActions });

function SignUp({ navigation, signUp, showHUD, hideHUD }) {
  const [role, setRole] = useState('customer');
  const [vehicle, setVehicle] = useState('Motorcycle');

  const submit = async (values) => {
    if (role === 'restaurant_owner' && (!values.restaurant_name || !values.cuisine || !values.address || !values.city)) {
      Alert.alert('Missing info', 'Please fill all restaurant details.');
      return;
    }
    showHUD();
    try {
      const result = await signUp({
        email: values.email,
        password: values.password,
        full_name: values.full_name,
        phone: values.phone,
        role,
        restaurant: role === 'restaurant_owner' ? {
          restaurant_name: values.restaurant_name,
          cuisine_type: values.cuisine,
          address: values.address,
          city: values.city,
        } : undefined,
        rider: role === 'rider' ? { vehicle_type: vehicle, vehicle_number: values.vehicle_number, license_number: values.license_number } : undefined,
      });
      if (!result.session) {
        Alert.alert('Account Created', 'Please check your email to confirm, then sign in.', [
          { text: 'Go to Login', onPress: () => navigation.navigate('Login') },
        ]);
      }
    } catch (e) {
      Alert.alert('Sign Up Failed', e.message || 'Please try again.');
    } finally {
      hideHUD();
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <Icon name="arrow-back" size={wp(6)} color={colors.txtDark} />
          </TouchableOpacity>
          <Text style={styles.title}>Create Account</Text>

          <Text style={styles.sectionLabel}>I'm a...</Text>
          <View style={styles.roleRow}>
            {ROLES.map((r) => (
              <TouchableOpacity key={r.value} onPress={() => setRole(r.value)} style={[styles.roleCard, role === r.value && styles.roleActive]}>
                <Icon name={r.icon} size={wp(6)} color={role === r.value ? colors.primary : colors.txtSecondary} />
                <Text style={[styles.roleLabel, role === r.value && styles.roleLabelActive]}>{r.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Formik initialValues={{ full_name: '', email: '', phone: '', password: '', confirm: '', restaurant_name: '', cuisine: '', address: '', city: '', vehicle_number: '', license_number: '' }} validationSchema={schema} onSubmit={submit}>
            {({ handleChange, handleSubmit, values, errors, touched }) => (
              <View>
                <TextField label="Full Name" value={values.full_name} onChangeText={handleChange('full_name')} icon="person-outline" autoCapitalize="words" error={touched.full_name && errors.full_name} />
                <TextField label="Email" value={values.email} onChangeText={handleChange('email')} icon="mail-outline" keyboardType="email-address" autoCapitalize="none" error={touched.email && errors.email} />
                <TextField label="Phone (optional)" value={values.phone} onChangeText={handleChange('phone')} icon="call-outline" keyboardType="phone-pad" />

                {role === 'restaurant_owner' ? (
                  <View style={styles.roleSection}>
                    <Text style={styles.roleSectionTitle}>Restaurant Details</Text>
                    <TextField label="Restaurant Name" value={values.restaurant_name} onChangeText={handleChange('restaurant_name')} />
                    <TextField label="Cuisine Types" placeholder="Burgers, American" value={values.cuisine} onChangeText={handleChange('cuisine')} />
                    <TextField label="Address" value={values.address} onChangeText={handleChange('address')} />
                    <TextField label="City" value={values.city} onChangeText={handleChange('city')} />
                  </View>
                ) : null}

                {role === 'rider' ? (
                  <View style={styles.roleSection}>
                    <Text style={styles.roleSectionTitle}>Vehicle Details</Text>
                    <Text style={styles.fieldLabel}>Vehicle Type</Text>
                    <View style={styles.chips}>
                      {VEHICLES.map((v) => (
                        <TouchableOpacity key={v} onPress={() => setVehicle(v)} style={[styles.chip, vehicle === v && styles.chipActive]}>
                          <Text style={[styles.chipText, vehicle === v && styles.chipTextActive]}>{v}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <TextField label="Vehicle Number (optional)" value={values.vehicle_number} onChangeText={handleChange('vehicle_number')} autoCapitalize="characters" />
                    <TextField label="License Number (optional)" value={values.license_number} onChangeText={handleChange('license_number')} autoCapitalize="characters" />
                  </View>
                ) : null}

                <TextField label="Password" value={values.password} onChangeText={handleChange('password')} password icon="lock-closed-outline" error={touched.password && errors.password} />
                <TextField label="Confirm Password" value={values.confirm} onChangeText={handleChange('confirm')} password icon="lock-closed-outline" error={touched.confirm && errors.confirm} />

                <Button label="Create Account" onPress={handleSubmit} buttonStyle={{ marginTop: hp(1) }} />
              </View>
            )}
          </Formik>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.link}> Sign in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default enhancer(SignUp);

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.white
  },
  flex: {
    flex: 1
  },
  scroll: {
    flexGrow: 1,
    padding: wp(6)
  },
  back: {
    marginBottom: hp(2),
    alignSelf: 'flex-start'
  },
  title: {
    fontWeight: Bold,
    fontSize: wp(7),
    color: colors.txtDark,
    marginBottom: hp(3)
  },
  sectionLabel: {
    fontWeight: Medium,
    fontSize: wp(3.4),
    color: colors.dark700,
    marginBottom: hp(1.2)
  },
  roleRow: {
    flexDirection: 'row',
    gap: wp(2.5),
    marginBottom: hp(2.5)
  },
  roleCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: hp(1.8),
    borderRadius: wp(3.5),
    borderWidth: 1.5,
    borderColor: colors.border
  },
  roleActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft
  },
  roleLabel: {
    fontWeight: Medium,
    fontSize: wp(2.8),
    color: colors.txtSecondary,
    marginTop: hp(0.6)
  },
  roleLabelActive: {
    color: colors.primaryDark
  },
  roleSection: {
    backgroundColor: colors.surface,
    borderRadius: wp(4),
    padding: wp(4),
    marginBottom: hp(2)
  },
  roleSectionTitle: {
    fontWeight: Bold,
    fontSize: wp(3.8),
    color: colors.txtDark,
    marginBottom: hp(1.5)
  },
  fieldLabel: {
    fontWeight: Medium,
    fontSize: wp(3.4),
    color: colors.dark700,
    marginBottom: hp(1)
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(2),
    marginBottom: hp(2)
  },
  chip: {
    paddingHorizontal: wp(3.5),
    paddingVertical: hp(1),
    borderRadius: wp(2.5),
    borderWidth: 1.5,
    borderColor: colors.border
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  chipText: {
    fontWeight: Medium,
    fontSize: wp(3.2),
    color: colors.txtSecondary
  },
  chipTextActive: {
    color: colors.white
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: hp(2)
  },
  footerText: {
    fontWeight: Regular,
    fontSize: wp(3.6),
    color: colors.txtSecondary
  },
  link: {
    fontWeight: Bold,
    fontSize: wp(3.6),
    color: colors.primaryDark
  }
});
