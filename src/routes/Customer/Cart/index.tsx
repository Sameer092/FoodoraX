import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { connect } from 'react-redux';
import Icon from '@expo/vector-icons/Ionicons';
import colors from '@colors';
import { Bold, Regular, Medium } from '@fonts';
import { wp, hp, currency } from '@utils/utilities';
import { TAX_RATE } from '@config/constant';
import { Button, Header, EmptyState } from '@components/common';
import * as CartActions from '@store/Cart/actions';
import * as OrderActions from '@store/Orders/actions';

let connectState = (state) => ({
  items: state.Cart.cart.get('items'),
  restaurant: state.Cart.cart.get('restaurant'),
  promo: state.Cart.cart.get('promo'),
  discount: state.Cart.cart.get('discount'),
});

let enhancer = connect(connectState, { ...CartActions, ...OrderActions });

function Cart({ navigation, items, restaurant, promo, discount, updateQuantity, removeFromCart, setPromo, setDiscount, clearCart, validatePromo }) {
  const [code, setCode] = useState('');
  const [promoError, setPromoError] = useState('');

  const deliveryFee = (restaurant && restaurant.delivery_fee) || 0;
  const subtotal = items.reduce((s, i) => s + i.menuItem.price * i.quantity, 0);
  const tax = subtotal * TAX_RATE;
  const total = Math.max(0, subtotal + tax + deliveryFee - discount);

  const applyPromo = async () => {
    setPromoError('');
    try {
      const p = await validatePromo(code, subtotal);
      const d = p.discount_type === 'percentage'
        ? Math.min(subtotal * (p.discount_value / 100), p.max_discount || Infinity)
        : Math.min(p.discount_value, subtotal);
      setPromo(p);
      setDiscount(d);
    } catch (e) {
      setPromoError(e.message || 'Invalid promo code');
    }
  };

  if (!items.length) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header title="Your Cart" onBack={() => navigation.goBack()} />
        <EmptyState icon="cart-outline" title="Your cart is empty" description="Add items from a restaurant to get started" actionLabel="Browse Restaurants" onAction={() => navigation.goBack()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header
        title="Your Cart"
        onBack={() => navigation.goBack()}
        right={<TouchableOpacity onPress={() => Alert.alert('Clear Cart', 'Remove all items?', [{ text: 'Cancel' }, { text: 'Clear', style: 'destructive', onPress: clearCart }])}><Text style={styles.clear}>Clear</Text></TouchableOpacity>}
      />
      <ScrollView showsVerticalScrollIndicator={false}>
        {restaurant ? <Text style={styles.restaurant}>{restaurant.name}</Text> : null}

        {items.map((item) => (
          <View key={item.id} style={styles.item}>
            {item.menuItem.image_url ? <Image source={{ uri: item.menuItem.image_url }} style={styles.itemImage} contentFit="cover" /> : null}
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={2}>{item.menuItem.name}</Text>
              <Text style={styles.itemPrice}>{currency(item.menuItem.price * item.quantity)}</Text>
            </View>
            <View style={styles.qtyRow}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => (item.quantity === 1 ? removeFromCart(item.id) : updateQuantity(item.id, item.quantity - 1))}>
                <Icon name={item.quantity === 1 ? 'trash-outline' : 'remove'} size={wp(4)} color={colors.primary} />
              </TouchableOpacity>
              <Text style={styles.qty}>{item.quantity}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.id, item.quantity + 1)}>
                <Icon name="add" size={wp(4)} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Promo Code</Text>
          {promo ? (
            <View style={styles.appliedPromo}>
              <Text style={styles.promoTag}>{promo.code}</Text>
              <Text style={styles.promoSaving}>-{currency(discount)}</Text>
              <TouchableOpacity onPress={() => { setPromo(null); setDiscount(0); setCode(''); }}>
                <Icon name="close-circle" size={wp(5)} color={colors.danger} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.promoRow}>
              <TextInput value={code} onChangeText={(t) => setCode(t.toUpperCase())} placeholder="Enter promo code" placeholderTextColor={colors.placeholder} style={styles.promoInput} autoCapitalize="characters" />
              <TouchableOpacity onPress={applyPromo} style={styles.applyBtn}><Text style={styles.applyText}>Apply</Text></TouchableOpacity>
            </View>
          )}
          {promoError ? <Text style={styles.promoError}>{promoError}</Text> : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <Row label="Subtotal" value={currency(subtotal)} />
          <Row label="Delivery fee" value={deliveryFee === 0 ? 'FREE' : currency(deliveryFee)} />
          <Row label={`Tax (${(TAX_RATE * 100).toFixed(0)}%)`} value={currency(tax)} />
          {discount > 0 ? <Row label="Discount" value={`-${currency(discount)}`} green /> : null}
          <View style={styles.divider} />
          <Row label="Total" value={currency(total)} bold />
        </View>
        <View style={{ height: hp(14) }} />
      </ScrollView>

      <View style={styles.footer}>
        <Button label={`Proceed to Checkout  •  ${currency(total)}`} onPress={() => navigation.navigate('Checkout')} />
      </View>
    </SafeAreaView>
  );
}

function Row({ label, value, bold, green }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, bold && styles.totalLabel, green && { color: colors.success }]}>{label}</Text>
      <Text style={[styles.summaryValue, bold && styles.totalValue, green && { color: colors.success }]}>{value}</Text>
    </View>
  );
}

export default enhancer(Cart);

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.white
  },
  clear: {
    fontWeight: Medium,
    fontSize: wp(3.6),
    color: colors.danger
  },
  restaurant: {
    fontWeight: Bold,
    fontSize: wp(4),
    color: colors.txtDark,
    padding: wp(5),
    paddingBottom: hp(1)
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(5),
    paddingVertical: hp(1.6),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border
  },
  itemImage: {
    width: wp(16),
    height: wp(16),
    borderRadius: wp(2.5)
  },
  itemInfo: {
    flex: 1,
    marginLeft: wp(3)
  },
  itemName: {
    fontWeight: Medium,
    fontSize: wp(3.6),
    color: colors.txtDark
  },
  itemPrice: {
    fontWeight: Bold,
    fontSize: wp(3.8),
    color: colors.primaryDark,
    marginTop: hp(0.5)
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  qtyBtn: {
    width: wp(7.5),
    height: wp(7.5),
    borderRadius: wp(3.75),
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  qty: {
    fontWeight: Bold,
    fontSize: wp(3.8),
    color: colors.txtDark,
    marginHorizontal: wp(2.5)
  },
  section: {
    margin: wp(5),
    padding: wp(4),
    backgroundColor: colors.surface,
    borderRadius: wp(4)
  },
  sectionTitle: {
    fontWeight: Bold,
    fontSize: wp(4),
    color: colors.txtDark,
    marginBottom: hp(1.5)
  },
  promoRow: {
    flexDirection: 'row',
    gap: wp(2.5)
  },
  promoInput: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: wp(2.5),
    paddingHorizontal: wp(3.5),
    paddingVertical: hp(1.4),
    borderWidth: 1,
    borderColor: colors.border,
    fontWeight: Bold,
    fontSize: wp(3.6),
    color: colors.txtDark,
    letterSpacing: 1
  },
  applyBtn: {
    backgroundColor: colors.primary,
    borderRadius: wp(2.5),
    paddingHorizontal: wp(5),
    alignItems: 'center',
    justifyContent: 'center'
  },
  applyText: {
    fontWeight: Bold,
    color: colors.white,
    fontSize: wp(3.6)
  },
  appliedPromo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3)
  },
  promoTag: {
    flex: 1,
    fontWeight: Bold,
    fontSize: wp(3.6),
    color: colors.successDark,
    backgroundColor: colors.successSoft,
    borderRadius: wp(2),
    paddingHorizontal: wp(3),
    paddingVertical: hp(1)
  },
  promoSaving: {
    fontWeight: Bold,
    fontSize: wp(3.8),
    color: colors.success
  },
  promoError: {
    fontWeight: Regular,
    fontSize: wp(3),
    color: colors.danger,
    marginTop: hp(0.8)
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp(1.2)
  },
  summaryLabel: {
    fontWeight: Regular,
    fontSize: wp(3.6),
    color: colors.dark600
  },
  summaryValue: {
    fontWeight: Medium,
    fontSize: wp(3.6),
    color: colors.txtDark
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: hp(1)
  },
  totalLabel: {
    fontWeight: Bold,
    fontSize: wp(4.2),
    color: colors.txtDark
  },
  totalValue: {
    fontWeight: Bold,
    fontSize: wp(4.6),
    color: colors.primaryDark
  },
  footer: {
    padding: wp(5),
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border
  }
});
