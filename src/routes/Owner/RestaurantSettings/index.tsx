import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Switch, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { connect } from 'react-redux';
import { Formik } from 'formik';
import * as Yup from 'yup';
import Icon from '@expo/vector-icons/Ionicons';
import colors from '@colors';
import { Bold, Regular, Medium } from '@fonts';
import { wp, hp } from '@utils/utilities';
import { Header, TextField, Button } from '@components/common';
import * as RestaurantActions from '@store/Restaurants/actions';

const schema = Yup.object().shape({
  name: Yup.string().min(2, 'Required').required('Required'),
  delivery_fee: Yup.number().typeError('Number').min(0, 'Invalid').required('Required'),
});

let enhancer = connect(null, { ...RestaurantActions });

function RestaurantSettings({ navigation, route, getRestaurant, updateRestaurant }) {
  const { restaurantId } = route.params;
  const [restaurant, setRestaurant] = useState(null);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    getRestaurant(restaurantId).then((r) => { setRestaurant(r); setIsOpen(!!r.is_open); });
  }, [restaurantId]);

  const toggleOpen = async (value) => {
    setIsOpen(value);
    await updateRestaurant(restaurantId, { is_open: value });
  };

  const submit = async (values) => {
    try {
      await updateRestaurant(restaurantId, {
        name: values.name,
        description: values.description,
        address: values.address,
        phone: values.phone,
        delivery_fee: parseFloat(values.delivery_fee),
      });
      Alert.alert('Saved', 'Restaurant updated!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed');
    }
  };

  if (!restaurant) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header title="Settings" onBack={() => navigation.goBack()} />
        <ActivityIndicator color={colors.primary} style={{ marginTop: hp(5) }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Restaurant Settings" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.toggleCard}>
          <Icon name={isOpen ? 'checkmark-circle' : 'pause-circle'} size={wp(6)} color={isOpen ? colors.success : colors.txtTertiary} />
          <View style={{ flex: 1, marginLeft: wp(3) }}>
            <Text style={styles.toggleTitle}>{isOpen ? 'Open for orders' : 'Closed'}</Text>
            <Text style={styles.toggleSub}>{isOpen ? 'Customers can place orders' : 'Not accepting orders'}</Text>
          </View>
          <Switch value={isOpen} onValueChange={toggleOpen} trackColor={{ false: colors.border, true: colors.success }} thumbColor={colors.white} />
        </View>

        <Formik
          initialValues={{
            name: restaurant.name || '',
            description: restaurant.description || '',
            address: restaurant.address || '',
            phone: restaurant.phone || '',
            delivery_fee: String(restaurant.delivery_fee || '0'),
          }}
          validationSchema={schema}
          onSubmit={submit}
        >
          {({ handleChange, handleSubmit, values, errors, touched }) => (
            <>
              <TextField label="Restaurant Name" value={values.name} onChangeText={handleChange('name')} icon="storefront-outline" error={touched.name && errors.name} />
              <TextField label="Description" value={values.description} onChangeText={handleChange('description')} multiline />
              <TextField label="Address" value={values.address} onChangeText={handleChange('address')} icon="location-outline" />
              <TextField label="Phone" value={values.phone} onChangeText={handleChange('phone')} keyboardType="phone-pad" icon="call-outline" />
              <TextField label="Delivery Fee ($)" value={values.delivery_fee} onChangeText={handleChange('delivery_fee')} keyboardType="decimal-pad" icon="bicycle-outline" error={touched.delivery_fee && errors.delivery_fee} />
              <Button label="Save Changes" onPress={handleSubmit} buttonStyle={{ marginTop: hp(1) }} />
            </>
          )}
        </Formik>
      </ScrollView>
    </SafeAreaView>
  );
}

export default enhancer(RestaurantSettings);

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.white
  },
  scroll: {
    padding: wp(6)
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: wp(3.5),
    padding: wp(4),
    marginBottom: hp(2.5)
  },
  toggleTitle: {
    fontWeight: Bold,
    fontSize: wp(3.8),
    color: colors.txtDark
  },
  toggleSub: {
    fontWeight: Regular,
    fontSize: wp(3),
    color: colors.txtSecondary,
    marginTop: 2
  }
});
