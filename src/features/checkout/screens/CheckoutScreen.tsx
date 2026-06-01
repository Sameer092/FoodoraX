import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useStripe } from '@stripe/stripe-react-native';
import { useCartStore } from '@store/cart.store';
import { useAppStore } from '@store/app.store';
import { useAuthStore } from '@store/auth.store';
import { useCreateOrder } from '@hooks/useOrders';
import { paymentService } from '@services/payment.service';
import { Button } from '@components/common/Button';
import { Colors } from '@constants/colors';
import { Config } from '@constants/config';

const PAYMENT_METHODS = [
  { id: 'card', label: 'Credit / Debit Card', icon: 'card-outline' },
  { id: 'apple_pay', label: 'Apple Pay', icon: 'logo-apple' },
  { id: 'google_pay', label: 'Google Pay', icon: 'logo-google' },
  { id: 'cash', label: 'Cash on Delivery', icon: 'cash-outline' },
] as const;

export function CheckoutScreen() {
  const navigation = useNavigation<any>();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const { user } = useAuthStore();
  const { selectedAddress } = useAppStore();
  const {
    localItems, cart, getSubtotal, getTax, getTotal, discountAmount, promoCode,
  } = useCartStore();

  const [paymentMethod, setPaymentMethod] = useState<string>('card');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [loading, setLoading] = useState(false);

  const createOrder = useCreateOrder();
  const deliveryFee = cart?.restaurant?.delivery_fee ?? 0;
  const subtotal = getSubtotal();

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      Alert.alert('Add Delivery Address', 'Please add a delivery address to continue.');
      navigation.navigate('AddAddress');
      return;
    }
    if (!localItems.length || !cart?.restaurant_id) {
      Alert.alert('Empty Cart', 'Please add items to your cart.');
      return;
    }

    setLoading(true);
    try {
      if (paymentMethod === 'card') {
        const paymentSheetData = await paymentService.createPaymentIntent({
          orderId: 'pending',
          amount: Math.round(getTotal() * 100),
          currency: 'usd',
        });

        const { error: initError } = await initPaymentSheet({
          merchantDisplayName: 'FoodoraX',
          customerId: paymentSheetData.customer,
          customerEphemeralKeySecret: paymentSheetData.ephemeralKey,
          paymentIntentClientSecret: paymentSheetData.paymentIntent,
          defaultBillingDetails: { name: user?.full_name },
        });
        if (initError) throw new Error(initError.message);

        const { error: presentError } = await presentPaymentSheet();
        if (presentError) {
          if (presentError.code !== 'Canceled') throw new Error(presentError.message);
          setLoading(false);
          return;
        }
      }

      const order = await createOrder.mutateAsync({
        customerId: user!.id,
        restaurantId: cart!.restaurant_id,
        cartItems: localItems.map((i) => ({
          id: i.id,
          cart_id: cart!.id ?? '',
          menu_item_id: i.menuItem.id,
          quantity: i.quantity,
          unit_price: i.menuItem.price,
          menu_item: i.menuItem,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })),
        deliveryAddressId: selectedAddress.id,
        paymentMethod,
        specialInstructions,
        promoCode: promoCode?.code,
        discountAmount,
        deliveryFee,
      });

      useCartStore.getState().clearCart();
      navigation.replace('OrderTracking', { orderId: order.id });
    } catch (e: any) {
      Alert.alert('Order Failed', e.message ?? 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark[900]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Delivery Address */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AddAddress')}>
              <Text style={styles.changeBtn}>{selectedAddress ? 'Change' : 'Add'}</Text>
            </TouchableOpacity>
          </View>
          {selectedAddress ? (
            <View style={styles.addressCard}>
              <View style={styles.addressIcon}>
                <Ionicons name="location" size={20} color={Colors.primary[500]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.addressLabel}>{selectedAddress.label}</Text>
                <Text style={styles.addressText}>
                  {selectedAddress.address_line1}{selectedAddress.address_line2 ? `, ${selectedAddress.address_line2}` : ''}
                </Text>
                <Text style={styles.addressCity}>{selectedAddress.city}</Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addAddressBtn}
              onPress={() => navigation.navigate('AddAddress')}
            >
              <Ionicons name="add-circle-outline" size={20} color={Colors.primary[500]} />
              <Text style={styles.addAddressText}>Add delivery address</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          {PAYMENT_METHODS.map((pm) => (
            <TouchableOpacity
              key={pm.id}
              onPress={() => setPaymentMethod(pm.id)}
              style={[styles.paymentOption, paymentMethod === pm.id && styles.paymentOptionActive]}
            >
              <View style={[styles.paymentIcon, paymentMethod === pm.id && styles.paymentIconActive]}>
                <Ionicons
                  name={pm.icon as any}
                  size={20}
                  color={paymentMethod === pm.id ? Colors.primary[500] : Colors.dark[600]}
                />
              </View>
              <Text style={[styles.paymentLabel, paymentMethod === pm.id && styles.paymentLabelActive]}>
                {pm.label}
              </Text>
              <View style={[styles.radio, paymentMethod === pm.id && styles.radioActive]}>
                {paymentMethod === pm.id && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery fee</Text>
            <Text style={[styles.summaryValue, deliveryFee === 0 && styles.freeText]}>
              {deliveryFee === 0 ? 'FREE' : `$${deliveryFee.toFixed(2)}`}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax</Text>
            <Text style={styles.summaryValue}>${getTax().toFixed(2)}</Text>
          </View>
          {discountAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: Colors.status.success }]}>Promo discount</Text>
              <Text style={[styles.summaryValue, { color: Colors.status.success }]}>-${discountAmount.toFixed(2)}</Text>
            </View>
          )}
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${getTotal().toFixed(2)}</Text>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={loading ? 'Placing Order...' : `Place Order  •  $${getTotal().toFixed(2)}`}
          onPress={handlePlaceOrder}
          loading={loading}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14, backgroundColor: Colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.light.border,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.dark[900] },
  scroll: { flex: 1 },
  section: {
    backgroundColor: Colors.white, marginVertical: 6,
    paddingHorizontal: 20, paddingVertical: 20,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.dark[900], marginBottom: 14 },
  changeBtn: { fontSize: 14, color: Colors.primary[600], fontWeight: '600' },
  addressCard: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  addressIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: Colors.primary[50],
    alignItems: 'center', justifyContent: 'center',
  },
  addressLabel: { fontSize: 14, fontWeight: '700', color: Colors.dark[900], marginBottom: 2 },
  addressText: { fontSize: 13, color: Colors.dark[600] },
  addressCity: { fontSize: 12, color: Colors.light.textSecondary, marginTop: 2 },
  addAddressBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderColor: Colors.primary[300],
    borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16,
    borderStyle: 'dashed',
  },
  addAddressText: { fontSize: 14, color: Colors.primary[600], fontWeight: '600' },
  paymentOption: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 14, borderRadius: 14, marginBottom: 10,
    borderWidth: 1.5, borderColor: Colors.light.border,
    backgroundColor: Colors.white,
  },
  paymentOptionActive: { borderColor: Colors.primary[500], backgroundColor: Colors.primary[50] },
  paymentIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: Colors.light.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  paymentIconActive: { backgroundColor: Colors.white },
  paymentLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.dark[700] },
  paymentLabelActive: { color: Colors.primary[700] },
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: Colors.light.border,
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: Colors.primary[500] },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary[500] },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { fontSize: 14, color: Colors.dark[600] },
  summaryValue: { fontSize: 14, fontWeight: '600', color: Colors.dark[900] },
  freeText: { color: Colors.status.success, fontWeight: '700' },
  divider: { height: 1, backgroundColor: Colors.light.border, marginVertical: 8 },
  totalLabel: { fontSize: 16, fontWeight: '800', color: Colors.dark[900] },
  totalValue: { fontSize: 18, fontWeight: '900', color: Colors.primary[600] },
  footer: {
    paddingHorizontal: 20, paddingBottom: 34, paddingTop: 12,
    backgroundColor: Colors.white,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.light.border,
  },
});
