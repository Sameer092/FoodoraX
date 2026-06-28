import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { connect } from 'react-redux';
import Icon from '@expo/vector-icons/Ionicons';
import colors from '@colors';
import { Bold, Regular, Medium } from '@fonts';
import { wp, hp, currency } from '@utils/utilities';
import { TAX_RATE } from '@config/constant';
import { Button, Header } from '@components/common';
import * as OrderActions from '@store/Orders/actions';
import * as CartActions from '@store/Cart/actions';

const METHODS = [
  { id: 'cash', label: 'Cash on Delivery', icon: 'cash-outline' },
  { id: 'card', label: 'Credit / Debit Card', icon: 'card-outline' },
];

let connectState = (state) => ({
  user: state.Auth.auth.get('user'),
  address: state.Common.common.get('selectedAddress'),
  items: state.Cart.cart.get('items'),
  restaurant: state.Cart.cart.get('restaurant'),
  promo: state.Cart.cart.get('promo'),
  discount: state.Cart.cart.get('discount'),
});

let enhancer = connect(connectState, { ...OrderActions, ...CartActions });

function Checkout({ navigation, user, address, items, restaurant, promo, discount, createOrder, clearCart }) {
  const [method, setMethod] = useState('cash');
  const [loading, setLoading] = useState(false);

  const deliveryFee = (restaurant && restaurant.delivery_fee) || 0;
  const subtotal = items.reduce((s, i) => s + i.menuItem.price * i.quantity, 0);
  const tax = subtotal * TAX_RATE;
  const total = Math.max(0, subtotal + tax + deliveryFee - discount);

  const placeOrder = async () => {
    if (!address) {
      Alert.alert('Add Delivery Address', 'Please add a delivery address.');
      navigation.navigate('AddAddress');
      return;
    }
    if (!items.length || !restaurant) {
      Alert.alert('Empty Cart', 'Add items to your cart.');
      return;
    }
    setLoading(true);
    try {
      const order = await createOrder({
        customerId: user.id,
        restaurantId: restaurant.id,
        items,
        deliveryAddressId: address.id,
        paymentMethod: method,
        promoCode: promo && promo.code,
        discount,
        deliveryFee,
      });
      clearCart();
      navigation.replace('OrderTracking', { orderId: order.id });
    } catch (e) {
      Alert.alert('Order Failed', e.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Checkout" onBack={() => navigation.goBack()} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AddAddress')}><Text style={styles.change}>{address ? 'Change' : 'Add'}</Text></TouchableOpacity>
          </View>
          {address ? (
            <View style={styles.addressRow}>
              <Icon name="location" size={wp(5)} color={colors.primary} />
              <View style={{ flex: 1, marginLeft: wp(2.5) }}>
                <Text style={styles.addressLabel}>{address.label}</Text>
                <Text style={styles.addressText}>{address.address_line1}, {address.city}</Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.addAddress} onPress={() => navigation.navigate('AddAddress')}>
              <Icon name="add-circle-outline" size={wp(5)} color={colors.primary} />
              <Text style={styles.addAddressText}>Add delivery address</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          {METHODS.map((m) => (
            <TouchableOpacity key={m.id} onPress={() => setMethod(m.id)} style={[styles.method, method === m.id && styles.methodActive]}>
              <Icon name={m.icon} size={wp(5)} color={method === m.id ? colors.primary : colors.dark600} />
              <Text style={[styles.methodLabel, method === m.id && { color: colors.primaryDark }]}>{m.label}</Text>
              <View style={[styles.radio, method === m.id && styles.radioActive]}>{method === m.id ? <View style={styles.radioDot} /> : null}</View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <Row label="Subtotal" value={currency(subtotal)} />
          <Row label="Delivery fee" value={deliveryFee === 0 ? 'FREE' : currency(deliveryFee)} />
          <Row label="Tax" value={currency(tax)} />
          {discount > 0 ? <Row label="Discount" value={`-${currency(discount)}`} green /> : null}
          <View style={styles.divider} />
          <Row label="Total" value={currency(total)} bold />
        </View>
        <View style={{ height: hp(14) }} />
      </ScrollView>

      <View style={styles.footer}>
        <Button label={loading ? 'Placing Order...' : `Place Order  •  ${currency(total)}`} onPress={placeOrder} loading={loading} />
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

export default enhancer(Checkout);

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background
  },
  section: {
    backgroundColor: colors.white,
    marginTop: hp(1),
    padding: wp(5)
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1.5)
  },
  sectionTitle: {
    fontWeight: Bold,
    fontSize: wp(4),
    color: colors.txtDark,
    marginBottom: hp(1.5)
  },
  change: {
    fontWeight: Medium,
    fontSize: wp(3.6),
    color: colors.primaryDark
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  addressLabel: {
    fontWeight: Bold,
    fontSize: wp(3.6),
    color: colors.txtDark
  },
  addressText: {
    fontWeight: Regular,
    fontSize: wp(3.3),
    color: colors.dark600,
    marginTop: 2
  },
  addAddress: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
    borderRadius: wp(3),
    padding: wp(3.5),
    borderStyle: 'dashed'
  },
  addAddressText: {
    fontWeight: Medium,
    fontSize: wp(3.6),
    color: colors.primaryDark,
    marginLeft: wp(2.5)
  },
  method: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: wp(3.5),
    borderRadius: wp(3.5),
    marginBottom: hp(1.2),
    borderWidth: 1.5,
    borderColor: colors.border
  },
  methodActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft
  },
  methodLabel: {
    flex: 1,
    fontWeight: Medium,
    fontSize: wp(3.6),
    color: colors.dark700,
    marginLeft: wp(3)
  },
  radio: {
    width: wp(5),
    height: wp(5),
    borderRadius: wp(2.5),
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
  radioActive: {
    borderColor: colors.primary
  },
  radioDot: {
    width: wp(2.5),
    height: wp(2.5),
    borderRadius: wp(1.25),
    backgroundColor: colors.primary
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
