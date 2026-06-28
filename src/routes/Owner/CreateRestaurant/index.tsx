import React from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { connect } from 'react-redux';
import { Formik } from 'formik';
import * as Yup from 'yup';
import colors from '@colors';
import { Regular } from '@fonts';
import { wp, hp } from '@utils/utilities';
import { DEFAULT_REGION } from '@config/constant';
import { Header, TextField, Button } from '@components/common';
import * as RestaurantActions from '@store/Restaurants/actions';

const schema = Yup.object().shape({
  name: Yup.string().min(2, 'Required').required('Required'),
  address: Yup.string().min(4, 'Required').required('Required'),
  cuisine: Yup.string().required('Required'),
  delivery_fee: Yup.number().typeError('Number').min(0, 'Invalid').required('Required'),
});

let connectState = (state) => ({ user: state.Auth.auth.get('user') });
let enhancer = connect(connectState, { ...RestaurantActions });

function CreateRestaurant({ navigation, user, createRestaurant }) {
  const submit = async (values) => {
    try {
      await createRestaurant({
        owner_id: user.id,
        name: values.name,
        description: values.description,
        cuisine_type: values.cuisine.split(',').map((c) => c.trim()).filter(Boolean),
        address: values.address,
        phone: values.phone,
        latitude: DEFAULT_REGION.latitude,
        longitude: DEFAULT_REGION.longitude,
        delivery_fee: parseFloat(values.delivery_fee),
        min_order: 0,
        is_open: true,
        is_verified: false,
      });
      Alert.alert('Submitted', 'Your restaurant was created and is pending admin approval.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Create Restaurant" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Formik
          initialValues={{ name: '', description: '', cuisine: '', address: '', phone: '', delivery_fee: '0' }}
          validationSchema={schema}
          onSubmit={submit}
        >
          {({ handleChange, handleSubmit, values, errors, touched }) => (
            <>
              <TextField label="Restaurant Name" value={values.name} onChangeText={handleChange('name')} icon="storefront-outline" error={touched.name && errors.name} />
              <TextField label="Description" value={values.description} onChangeText={handleChange('description')} multiline />
              <TextField label="Cuisine (comma separated)" value={values.cuisine} onChangeText={handleChange('cuisine')} icon="fast-food-outline" error={touched.cuisine && errors.cuisine} />
              <TextField label="Address" value={values.address} onChangeText={handleChange('address')} icon="location-outline" error={touched.address && errors.address} />
              <TextField label="Phone" value={values.phone} onChangeText={handleChange('phone')} keyboardType="phone-pad" icon="call-outline" />
              <TextField label="Delivery Fee ($)" value={values.delivery_fee} onChangeText={handleChange('delivery_fee')} keyboardType="decimal-pad" icon="bicycle-outline" error={touched.delivery_fee && errors.delivery_fee} />
              <Text style={styles.note}>Your restaurant will be reviewed by an admin before it becomes visible to customers.</Text>
              <Button label="Create Restaurant" onPress={handleSubmit} buttonStyle={{ marginTop: hp(1) }} />
            </>
          )}
        </Formik>
      </ScrollView>
    </SafeAreaView>
  );
}

export default enhancer(CreateRestaurant);

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.white
  },
  scroll: {
    padding: wp(6)
  },
  note: {
    fontWeight: Regular,
    fontSize: wp(3),
    color: colors.txtTertiary,
    marginBottom: hp(2),
    lineHeight: wp(4.5)
  }
});
