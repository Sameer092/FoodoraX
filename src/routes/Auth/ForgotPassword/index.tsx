import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { connect } from 'react-redux';
import { Formik } from 'formik';
import * as Yup from 'yup';
import Icon from '@expo/vector-icons/Ionicons';
import colors from '@colors';
import { Bold, Regular } from '@fonts';
import { wp, hp } from '@utils/utilities';
import { Button, TextField } from '@components/common';
import * as AuthActions from '@store/Auth/actions';

const schema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Required'),
});

let enhancer = connect(null, { ...AuthActions });

function ForgotPassword({ navigation, forgotPassword }) {
  const [sent, setSent] = useState(false);

  const submit = async (values) => {
    try {
      await forgotPassword(values.email);
      setSent(true);
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to send reset email');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Icon name="arrow-back" size={wp(6)} color={colors.txtDark} />
        </TouchableOpacity>

        <View style={styles.iconCircle}>
          <Icon name="lock-open-outline" size={wp(11)} color={colors.primary} />
        </View>
        <Text style={styles.title}>Forgot Password?</Text>
        <Text style={styles.subtitle}>Enter your email and we'll send a reset link.</Text>

        {sent ? (
          <View style={styles.sent}>
            <Icon name="checkmark-circle" size={wp(16)} color={colors.success} />
            <Text style={styles.sentTitle}>Email Sent!</Text>
            <Button label="Back to Login" onPress={() => navigation.goBack()} buttonStyle={{ marginTop: hp(2), width: '100%' }} />
          </View>
        ) : (
          <Formik initialValues={{ email: '' }} validationSchema={schema} onSubmit={submit}>
            {({ handleChange, handleSubmit, values, errors, touched }) => (
              <View>
                <TextField label="Email Address" value={values.email} onChangeText={handleChange('email')} icon="mail-outline" keyboardType="email-address" autoCapitalize="none" error={touched.email && errors.email} />
                <Button label="Send Reset Link" onPress={handleSubmit} buttonStyle={{ marginTop: hp(1) }} />
              </View>
            )}
          </Formik>
        )}
      </View>
    </SafeAreaView>
  );
}

export default enhancer(ForgotPassword);

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.white
  },
  container: {
    flex: 1,
    padding: wp(6)
  },
  back: {
    marginBottom: hp(4),
    alignSelf: 'flex-start'
  },
  iconCircle: {
    width: wp(24),
    height: wp(24),
    borderRadius: wp(12),
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: hp(3)
  },
  title: {
    fontWeight: Bold,
    fontSize: wp(6),
    color: colors.txtDark,
    textAlign: 'center',
    marginBottom: hp(1)
  },
  subtitle: {
    fontWeight: Regular,
    fontSize: wp(3.6),
    color: colors.txtSecondary,
    textAlign: 'center',
    marginBottom: hp(4)
  },
  sent: {
    alignItems: 'center'
  },
  sentTitle: {
    fontWeight: Bold,
    fontSize: wp(5),
    color: colors.txtDark,
    marginTop: hp(2)
  }
});
