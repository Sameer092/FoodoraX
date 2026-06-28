import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { connect } from 'react-redux';
import { Formik } from 'formik';
import * as Yup from 'yup';
import colors from '@colors';
import { Medium } from '@fonts';
import { wp, hp } from '@utils/utilities';
import { Header, TextField, Button } from '@components/common';
import * as RestaurantActions from '@store/Restaurants/actions';

const schema = Yup.object().shape({
  name: Yup.string().min(2, 'Required').required('Required'),
  price: Yup.number().typeError('Enter a price').positive('Invalid').required('Required'),
});

let enhancer = connect(null, { ...RestaurantActions });

function AddMenuItem({ navigation, route, getRestaurant, createMenuItem }) {
  const { restaurantId } = route.params;
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState(null);

  useEffect(() => {
    getRestaurant(restaurantId).then((r) => {
      const cats = (r && r.categories) || [];
      setCategories(cats);
      if (cats[0]) setCategoryId(cats[0].id);
    });
  }, [restaurantId]);

  const submit = async (values) => {
    try {
      await createMenuItem({
        restaurant_id: restaurantId,
        category_id: categoryId,
        name: values.name,
        description: values.description,
        price: parseFloat(values.price),
        is_available: true,
        preparation_time: 15,
      });
      Alert.alert('Added', 'Menu item created!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Add Menu Item" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Formik initialValues={{ name: '', description: '', price: '' }} validationSchema={schema} onSubmit={submit}>
          {({ handleChange, handleSubmit, values, errors, touched }) => (
            <>
              <TextField label="Item Name" value={values.name} onChangeText={handleChange('name')} error={touched.name && errors.name} />
              <TextField label="Description (optional)" value={values.description} onChangeText={handleChange('description')} multiline />
              <TextField label="Price ($)" value={values.price} onChangeText={handleChange('price')} keyboardType="decimal-pad" icon="pricetag-outline" error={touched.price && errors.price} />
              {categories.length ? (
                <>
                  <Text style={styles.label}>Category</Text>
                  <View style={styles.chips}>
                    {categories.map((c) => (
                      <TouchableOpacity key={c.id} onPress={() => setCategoryId(c.id)} style={[styles.chip, categoryId === c.id && styles.chipActive]}>
                        <Text style={[styles.chipText, categoryId === c.id && styles.chipTextActive]}>{c.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              ) : null}
              <Button label="Add Item" onPress={handleSubmit} buttonStyle={{ marginTop: hp(1) }} />
            </>
          )}
        </Formik>
      </ScrollView>
    </SafeAreaView>
  );
}

export default enhancer(AddMenuItem);

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.white
  },
  scroll: {
    padding: wp(6)
  },
  label: {
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
    fontSize: wp(3.2),
    color: colors.dark600
  },
  chipTextActive: {
    color: colors.white
  }
});
