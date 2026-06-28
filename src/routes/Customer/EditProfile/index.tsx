import React from 'react';
import { ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { connect } from 'react-redux';
import { Formik } from 'formik';
import * as Yup from 'yup';
import colors from '@colors';
import { wp } from '@utils/utilities';
import { Header, TextField, Button } from '@components/common';
import * as AuthActions from '@store/Auth/actions';

const schema = Yup.object().shape({ full_name: Yup.string().min(2, 'Too short').required('Required') });

let connectState = (state) => ({ user: state.Auth.auth.get('user') });
let enhancer = connect(connectState, { ...AuthActions });

function EditProfile({ navigation, user, updateProfile }) {
  const submit = async (values) => {
    try {
      await updateProfile(user.id, values);
      Alert.alert('Saved', 'Profile updated.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to update');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Edit Profile" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Formik initialValues={{ full_name: (user && user.full_name) || '', phone: (user && user.phone) || '' }} validationSchema={schema} onSubmit={submit}>
          {({ handleChange, handleSubmit, values, errors, touched }) => (
            <>
              <TextField label="Full Name" value={values.full_name} onChangeText={handleChange('full_name')} error={touched.full_name && errors.full_name} />
              <TextField label="Phone" value={values.phone} onChangeText={handleChange('phone')} keyboardType="phone-pad" />
              <Button label="Save Changes" onPress={handleSubmit} buttonStyle={{ marginTop: wp(2) }} />
            </>
          )}
        </Formik>
      </ScrollView>
    </SafeAreaView>
  );
}

export default enhancer(EditProfile);

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.white
  },
  scroll: {
    padding: wp(6)
  }
});
