import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, SlideInRight } from 'react-native-reanimated';
import { useCartStore } from '@store/cart.store';
import { cartService } from '@services/cart.service';
import { Button } from '@components/common/Button';
import { EmptyState } from '@components/common/EmptyState';
import { Colors } from '@constants/colors';
import { Config } from '@constants/config';

export function CartScreen() {
  const navigation = useNavigation<any>();
  const {
    localItems, updateLocalQuantity, removeLocalItem,
    promoCode, setPromoCode, discountAmount, setDiscountAmount,
    getSubtotal, getTax, getTotal, cart,
  } = useCartStore();

  const [promoInput, setPromoInput] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState('');

  const deliveryFee = cart?.restaurant?.delivery_fee ?? 0;
  const subtotal = getSubtotal();

  const applyPromo = async () => {
    setPromoLoading(true);
    setPromoError('');
    try {
      const promo = await cartService.validatePromoCode(promoInput, subtotal);
      const discount = cartService.calculateDiscount(promo, subtotal);
      setPromoCode(promo);
      setDiscountAmount(discount);
    } catch (e: any) {
      setPromoError(e.message ?? 'Invalid promo code');
    } finally {
      setPromoLoading(false);
    }
  };

  const removePromo = () => {
    setPromoCode(null);
    setDiscountAmount(0);
    setPromoInput('');
  };

  if (localItems.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={Colors.dark[900]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your Cart</Text>
          <View style={{ width: 24 }} />
        </View>
        <EmptyState
          icon="cart-outline"
          title="Your cart is empty"
          description="Add items from a restaurant to get started"
          actionLabel="Browse Restaurants"
          onAction={() => { navigation.goBack(); }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark[900]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Cart</Text>
        <TouchableOpacity onPress={() => Alert.alert('Clear Cart', 'Remove all items?', [
          { text: 'Cancel' },
          { text: 'Clear', style: 'destructive', onPress: () => useCartStore.getState().clearCart() },
        ])}>
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Restaurant info */}
        {cart?.restaurant && (
          <View style={styles.restaurantRow}>
            <Image source={{ uri: cart.restaurant.logo_url ?? '' }} style={styles.restaurantLogo} contentFit="cover" />
            <Text style={styles.restaurantName}>{cart.restaurant.name}</Text>
          </View>
        )}

        {/* Items */}
        {localItems.map((item, i) => (
          <Animated.View key={item.id} entering={FadeInDown.delay(i * 50)} style={styles.item}>
            {item.menuItem.image_url && (
              <Image source={{ uri: item.menuItem.image_url }} style={styles.itemImage} contentFit="cover" />
            )}
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={2}>{item.menuItem.name}</Text>
              <Text style={styles.itemPrice}>${(item.menuItem.price * item.quantity).toFixed(2)}</Text>
            </View>
            <View style={styles.qtyControl}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => {
                  if (item.quantity === 1) {
                    Alert.alert('Remove Item', 'Remove this item from cart?', [
                      { text: 'Cancel' },
                      { text: 'Remove', style: 'destructive', onPress: () => removeLocalItem(item.id) },
                    ]);
                  } else {
                    updateLocalQuantity(item.id, item.quantity - 1);
                  }
                }}
              >
                <Ionicons name={item.quantity === 1 ? 'trash-outline' : 'remove'} size={16} color={Colors.primary[500]} />
              </TouchableOpacity>
              <Text style={styles.qtyText}>{item.quantity}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => updateLocalQuantity(item.id, item.quantity + 1)}>
                <Ionicons name="add" size={16} color={Colors.primary[500]} />
              </TouchableOpacity>
            </View>
          </Animated.View>
        ))}

        {/* Promo Code */}
        <View style={styles.promoSection}>
          <Text style={styles.sectionTitle}>Promo Code</Text>
          {promoCode ? (
            <View style={styles.appliedPromo}>
              <View style={styles.promoTag}>
                <Ionicons name="pricetag" size={14} color={Colors.status.success} />
                <Text style={styles.promoTagText}>{promoCode.code}</Text>
              </View>
              <Text style={styles.promoSaving}>-${discountAmount.toFixed(2)}</Text>
              <TouchableOpacity onPress={removePromo}>
                <Ionicons name="close-circle" size={20} color={Colors.status.error} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.promoInput}>
              <TextInput
                value={promoInput}
                onChangeText={(v) => setPromoInput(v.toUpperCase())}
                placeholder="Enter promo code"
                style={styles.promoTextInput}
                autoCapitalize="characters"
                placeholderTextColor={Colors.light.placeholder}
              />
              <TouchableOpacity
                onPress={applyPromo}
                disabled={!promoInput || promoLoading}
                style={[styles.applyBtn, !promoInput && styles.applyBtnDisabled]}
              >
                <Text style={styles.applyBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>
          )}
          {promoError ? <Text style={styles.promoError}>{promoError}</Text> : null}
        </View>

        {/* Summary */}
        <View style={styles.summary}>
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
            <Text style={styles.summaryLabel}>Tax ({(Config.app.taxRate * 100).toFixed(0)}%)</Text>
            <Text style={styles.summaryValue}>${getTax().toFixed(2)}</Text>
          </View>
          {discountAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: Colors.status.success }]}>Discount</Text>
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

      {/* Checkout CTA */}
      <View style={styles.footer}>
        <Button
          title={`Proceed to Checkout  •  $${getTotal().toFixed(2)}`}
          onPress={() => navigation.navigate('Checkout')}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.light.border,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.dark[900] },
  clearText: { fontSize: 14, color: Colors.status.error, fontWeight: '600' },
  scroll: { flex: 1 },
  restaurantRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.light.border,
  },
  restaurantLogo: { width: 40, height: 40, borderRadius: 10 },
  restaurantName: { fontSize: 15, fontWeight: '700', color: Colors.dark[900] },
  item: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14, gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.light.border,
  },
  itemImage: { width: 70, height: 70, borderRadius: 10 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '600', color: Colors.dark[900], marginBottom: 4 },
  itemPrice: { fontSize: 15, fontWeight: '800', color: Colors.primary[600] },
  qtyControl: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn: {
    width: 30, height: 30, borderRadius: 15,
    borderWidth: 1.5, borderColor: Colors.primary[500],
    alignItems: 'center', justifyContent: 'center',
  },
  qtyText: { fontSize: 15, fontWeight: '700', minWidth: 24, textAlign: 'center', color: Colors.dark[900] },
  promoSection: { margin: 20, padding: 16, backgroundColor: Colors.light.surface, borderRadius: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.dark[900], marginBottom: 12 },
  promoInput: { flexDirection: 'row', gap: 10 },
  promoTextInput: {
    flex: 1, backgroundColor: Colors.white, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: Colors.light.border,
    fontSize: 14, color: Colors.dark[900], fontWeight: '700', letterSpacing: 1,
  },
  applyBtn: {
    backgroundColor: Colors.primary[500],
    borderRadius: 10, paddingHorizontal: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  applyBtnDisabled: { backgroundColor: Colors.light.placeholder },
  applyBtnText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  appliedPromo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  promoTag: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#dcfce7', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  promoTagText: { fontSize: 14, fontWeight: '700', color: '#166534' },
  promoSaving: { fontSize: 15, fontWeight: '800', color: Colors.status.success },
  promoError: { fontSize: 12, color: Colors.status.error, marginTop: 6 },
  summary: { margin: 20, padding: 16, backgroundColor: Colors.light.surface, borderRadius: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryLabel: { fontSize: 14, color: Colors.dark[600] },
  summaryValue: { fontSize: 14, fontWeight: '600', color: Colors.dark[900] },
  freeText: { color: Colors.status.success, fontWeight: '700' },
  divider: { height: 1, backgroundColor: Colors.light.border, marginVertical: 10 },
  totalLabel: { fontSize: 16, fontWeight: '800', color: Colors.dark[900] },
  totalValue: { fontSize: 18, fontWeight: '900', color: Colors.primary[600] },
  footer: {
    paddingHorizontal: 20, paddingBottom: 34, paddingTop: 12,
    backgroundColor: Colors.white,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.light.border,
  },
});
