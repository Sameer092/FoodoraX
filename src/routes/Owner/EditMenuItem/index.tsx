import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { connect } from 'react-redux';
import { Formik } from 'formik';
import * as Yup from 'yup';
import colors from '@colors';
import { wp, hp } from '@utils/utilities';
import { Header, TextField, Button } from '@components/common';
import * as RestaurantActions from '@store/Restaurants/actions';

const schema = Yup.object().shape({
  name: Yup.string().min(2, 'Required').required('Required'),
  price: Yup.number().typeError('Enter a price').positive('Invalid').required('Required'),
});

let enhancer = connect(null, { ...RestaurantActions });

function EditMenuItem({ navigation, route, getRestaurant, updateMenuItem }) {
  const { restaurantId, itemId } = route.params;
  const [item, setItem] = useState(null);

  useEffect(() => {
    getRestaurant(restaurantId).then((r) => {
      const cats = (r && r.categories) || [];
      for (const c of cats) {
        const found = (c.items || []).find((i) => i.id === itemId);
        if (found) { setItem(found); return; }
      }
    });
  }, [restaurantId, itemId]);

  const submit = async (values) => {
    try {
      await updateMenuItem(itemId, { name: values.name, description: values.description, price: parseFloat(values.price) });
      Alert.alert('Saved', 'Item updated!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed');
    }
  };

  if (!item) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header title="Edit Item" onBack={() => navigation.goBack()} />
        <ActivityIndicator color={colors.primary} style={{ marginTop: hp(5) }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Edit Item" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Formik
          initialValues={{ name: item.name || '', description: item.description || '', price: String(item.price || '') }}
          validationSchema={schema}
          onSubmit={submit}
        >
          {({ handleChange, handleSubmit, values, errors, touched }) => (
            <>
              <TextField label="Item Name" value={values.name} onChangeText={handleChange('name')} error={touched.name && errors.name} />
              <TextField label="Description" value={values.description} onChangeText={handleChange('description')} multiline />
              <TextField label="Price ($)" value={values.price} onChangeText={handleChange('price')} keyboardType="decimal-pad" icon="pricetag-outline" error={touched.price && errors.price} />
              <Button label="Save Changes" onPress={handleSubmit} buttonStyle={{ marginTop: hp(1) }} />
            </>
          )}
        </Formik>
      </ScrollView>
    </SafeAreaView>
  );
}

export default enhancer(EditMenuItem);

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.white
  },
  scroll: {
    padding: wp(6)
  }
});
