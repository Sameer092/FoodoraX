import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { connect } from 'react-redux';
import { Image } from 'expo-image';
import Icon from '@expo/vector-icons/Ionicons';
import colors from '@colors';
import { Bold, Regular, Medium } from '@fonts';
import { wp, hp, currency } from '@utils/utilities';
import { EmptyState } from '@components/common';
import * as RestaurantActions from '@store/Restaurants/actions';

let enhancer = connect(null, { ...RestaurantActions });

function MenuManagement({ navigation, route, getRestaurant, updateMenuItem, deleteMenuItem }) {
  const { restaurantId } = route.params;
  const [restaurant, setRestaurant] = useState(null);

  const load = useCallback(() => { getRestaurant(restaurantId).then(setRestaurant); }, [restaurantId]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const toggle = async (item) => {
    await updateMenuItem(item.id, { is_available: !item.is_available });
    load();
  };
  const remove = (item) => {
    Alert.alert('Delete Item', `Remove "${item.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteMenuItem(item.id); load(); } },
    ]);
  };

  const categories = (restaurant && restaurant.categories) || [];
  const total = categories.reduce((s, c) => s + ((c.items && c.items.length) || 0), 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Icon name="arrow-back" size={wp(6)} color={colors.txtDark} /></TouchableOpacity>
        <Text style={styles.title}>Menu</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddMenuItem', { restaurantId })}>
          <Icon name="add" size={wp(5.5)} color={colors.white} />
        </TouchableOpacity>
      </View>

      {total === 0 ? (
        <EmptyState icon="restaurant-outline" title="No menu items yet" description="Add your first dish" actionLabel="Add Menu Item" onAction={() => navigation.navigate('AddMenuItem', { restaurantId })} />
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {categories.map((cat) => (
            <View key={cat.id} style={{ marginBottom: hp(2.5) }}>
              <Text style={styles.catName}>{cat.name}</Text>
              {(cat.items || []).map((item) => (
                <View key={item.id} style={styles.item}>
                  {item.image_url ? <Image source={{ uri: item.image_url }} style={styles.image} contentFit="cover" /> : <View style={[styles.image, styles.imagePh]}><Icon name="fast-food-outline" size={wp(6)} color={colors.txtTertiary} /></View>}
                  <View style={{ flex: 1, marginLeft: wp(3) }}>
                    <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.price}>{currency(item.price)}</Text>
                    <View style={styles.availRow}>
                      <Switch value={item.is_available} onValueChange={() => toggle(item)} trackColor={{ false: colors.border, true: colors.success }} thumbColor={colors.white} style={{ transform: [{ scale: 0.7 }] }} />
                      <Text style={[styles.avail, { color: item.is_available ? colors.success : colors.txtTertiary }]}>{item.is_available ? 'Available' : 'Hidden'}</Text>
                    </View>
                  </View>
                  <View style={{ gap: hp(0.8) }}>
                    <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('EditMenuItem', { restaurantId, itemId: item.id })}><Icon name="create-outline" size={wp(4.5)} color={colors.info} /></TouchableOpacity>
                    <TouchableOpacity style={styles.iconBtn} onPress={() => remove(item)}><Icon name="trash-outline" size={wp(4.5)} color={colors.danger} /></TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

export default enhancer(MenuManagement);

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(5),
    paddingVertical: hp(1.6),
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border
  },
  title: {
    fontWeight: Bold,
    fontSize: wp(4.6),
    color: colors.txtDark
  },
  addBtn: {
    width: wp(9.5),
    height: wp(9.5),
    borderRadius: wp(4.75),
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  list: {
    padding: wp(4)
  },
  catName: {
    fontWeight: Bold,
    fontSize: wp(4),
    color: colors.txtDark,
    marginBottom: hp(1.2)
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: wp(3.5),
    padding: wp(3),
    marginBottom: hp(1.2)
  },
  image: {
    width: wp(15),
    height: wp(15),
    borderRadius: wp(2.5)
  },
  imagePh: {
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center'
  },
  name: {
    fontWeight: Bold,
    fontSize: wp(3.6),
    color: colors.txtDark
  },
  price: {
    fontWeight: Bold,
    fontSize: wp(3.6),
    color: colors.primaryDark,
    marginTop: 2
  },
  availRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2
  },
  avail: {
    fontWeight: Medium,
    fontSize: wp(2.8)
  },
  iconBtn: {
    width: wp(8.5),
    height: wp(8.5),
    borderRadius: wp(2.5),
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
