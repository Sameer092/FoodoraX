import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { connect } from 'react-redux';
import Icon from '@expo/vector-icons/Ionicons';
import colors from '@colors';
import { Bold, Regular, Medium } from '@fonts';
import { wp, hp, currency } from '@utils/utilities';
import MenuItemCard from '@components/MenuItemCard';
import * as RestaurantActions from '@store/Restaurants/actions';
import * as CartActions from '@store/Cart/actions';

let connectState = (state) => ({
  items: state.Cart.cart.get('items'),
  cartRestaurant: state.Cart.cart.get('restaurant'),
});

let enhancer = connect(connectState, { ...RestaurantActions, ...CartActions });

function RestaurantDetail({ navigation, route, items, cartRestaurant, getRestaurant, addToCart, updateQuantity, clearCart }) {
  const { restaurantId } = route.params;
  const [restaurant, setRestaurant] = useState(null);

  useEffect(() => {
    getRestaurant(restaurantId).then(setRestaurant).catch(() => {});
  }, [restaurantId]);

  const qtyOf = (id) => {
    const found = items.find((i) => i.menuItem.id === id);
    return found ? found.quantity : 0;
  };

  const onAdd = (item) => {
    if (items.length && cartRestaurant && cartRestaurant.id !== restaurant.id) {
      Alert.alert('Start New Cart?', 'Your cart has items from another restaurant.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Start New', style: 'destructive', onPress: () => { clearCart(); addToCart(item, restaurant); } },
      ]);
      return;
    }
    addToCart(item, restaurant);
  };

  const onRemove = (item) => {
    const found = items.find((i) => i.menuItem.id === item.id);
    if (found) updateQuantity(item.id, found.quantity - 1);
  };

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.menuItem.price * i.quantity, 0);

  if (!restaurant) return <SafeAreaView style={styles.safe} />;

  const hero = restaurant.cover_url || (restaurant.images && restaurant.images[0] && restaurant.images[0].url);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Image source={{ uri: hero || '' }} style={styles.heroImage} contentFit="cover" />
          <SafeAreaView style={styles.navBar} edges={['top']}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBtn}>
              <Icon name="arrow-back" size={wp(5)} color={colors.txtDark} />
            </TouchableOpacity>
          </SafeAreaView>
        </View>

        <View style={styles.info}>
          <Text style={styles.name}>{restaurant.name}</Text>
          <Text style={styles.cuisine}>{(restaurant.cuisine_type || []).join(' · ')}</Text>
        </View>

        <View style={styles.strip}>
          <View style={styles.stripItem}><Icon name="star" size={wp(4)} color={colors.golden} /><Text style={styles.stripText}>{(restaurant.avg_rating || 0).toFixed(1)}</Text></View>
          <View style={styles.stripItem}><Icon name="time-outline" size={wp(4)} color={colors.txtSecondary} /><Text style={styles.stripText}>{restaurant.delivery_time} min</Text></View>
          <View style={styles.stripItem}><Icon name="car-outline" size={wp(4)} color={colors.txtSecondary} /><Text style={styles.stripText}>{restaurant.delivery_fee === 0 ? 'Free' : currency(restaurant.delivery_fee)}</Text></View>
          <View style={styles.stripItem}><View style={[styles.dot, { backgroundColor: restaurant.is_open ? colors.success : colors.danger }]} /><Text style={styles.stripText}>{restaurant.is_open ? 'Open' : 'Closed'}</Text></View>
        </View>

        {(restaurant.categories || []).map((cat) => (
          <View key={cat.id}>
            <Text style={styles.catTitle}>{cat.name}</Text>
            {(cat.items || []).map((item) => (
              <MenuItemCard key={item.id} item={item} quantity={qtyOf(item.id)} onAdd={() => onAdd(item)} onRemove={() => onRemove(item)} />
            ))}
          </View>
        ))}
        <View style={{ height: hp(14) }} />
      </ScrollView>

      {count > 0 ? (
        <View style={styles.cta}>
          <TouchableOpacity style={styles.cartBtn} onPress={() => navigation.navigate('Cart')}>
            <View style={styles.cartBadge}><Text style={styles.cartBadgeText}>{count}</Text></View>
            <Text style={styles.cartBtnText}>View Cart</Text>
            <Text style={styles.cartBtnText}>{currency(subtotal)}</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

export default enhancer(RestaurantDetail);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white
  },
  safe: {
    flex: 1,
    backgroundColor: colors.white
  },
  hero: {
    height: hp(28)
  },
  heroImage: {
    width: '100%',
    height: '100%'
  },
  navBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    padding: wp(4)
  },
  navBtn: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center'
  },
  info: {
    padding: wp(5),
    paddingBottom: hp(1)
  },
  name: {
    fontWeight: Bold,
    fontSize: wp(6),
    color: colors.txtDark
  },
  cuisine: {
    fontWeight: Regular,
    fontSize: wp(3.4),
    color: colors.txtSecondary,
    marginTop: hp(0.5)
  },
  strip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: wp(5),
    paddingVertical: hp(1.5),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginBottom: hp(1)
  },
  stripItem: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  stripText: {
    fontWeight: Bold,
    fontSize: wp(3.2),
    color: colors.txtDark,
    marginLeft: wp(1)
  },
  dot: {
    width: wp(2),
    height: wp(2),
    borderRadius: wp(1)
  },
  catTitle: {
    fontWeight: Bold,
    fontSize: wp(4.4),
    color: colors.txtDark,
    paddingHorizontal: wp(5),
    paddingTop: hp(2),
    paddingBottom: hp(1),
    backgroundColor: colors.background
  },
  cta: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: wp(5),
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border
  },
  cartBtn: {
    backgroundColor: colors.primary,
    borderRadius: wp(4),
    paddingVertical: hp(2),
    paddingHorizontal: wp(5),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  cartBadge: {
    width: wp(7),
    height: wp(7),
    borderRadius: wp(3.5),
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  cartBadgeText: {
    fontWeight: Bold,
    color: colors.white,
    fontSize: wp(3.4)
  },
  cartBtnText: {
    fontWeight: Bold,
    fontSize: wp(4),
    color: colors.white
  }
});
