import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useOrder } from '@hooks/useOrders';
import { useOrderReview } from '@hooks/useRestaurants';
import { OrderStatusBadge } from '@components/order/OrderStatusBadge';
import { Colors } from '@constants/colors';
import { format } from 'date-fns';

export function OrderDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { orderId } = route.params;
  const { data: order, isLoading } = useOrder(orderId);
  const { data: existingReview } = useOrderReview(orderId);

  if (isLoading || !order) return null;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark[900]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Status */}
        <View style={styles.statusSection}>
          <OrderStatusBadge status={order.status} />
          <Text style={styles.orderNum}>#{order.order_number}</Text>
          <Text style={styles.orderDate}>{format(new Date(order.created_at), 'MMMM d, yyyy  h:mm a')}</Text>
        </View>

        {/* Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>
          {order.items?.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <Text style={styles.itemQty}>{item.quantity}x</Text>
              <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.itemPrice}>${item.total_price.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Delivery Address */}
        {order.delivery_address && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivered to</Text>
            <View style={styles.addressRow}>
              <Ionicons name="location" size={18} color={Colors.primary[500]} />
              <Text style={styles.addressText}>
                {order.delivery_address.address_line1}, {order.delivery_address.city}
              </Text>
            </View>
          </View>
        )}

        {/* Payment Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>${order.subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery fee</Text>
            <Text style={styles.summaryValue}>${order.delivery_fee.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax</Text>
            <Text style={styles.summaryValue}>${order.tax_amount.toFixed(2)}</Text>
          </View>
          {order.discount_amount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: Colors.status.success }]}>Discount</Text>
              <Text style={[styles.summaryValue, { color: Colors.status.success }]}>-${order.discount_amount.toFixed(2)}</Text>
            </View>
          )}
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${order.total_amount.toFixed(2)}</Text>
          </View>
        </View>

        {order.status === 'delivered' && (
          existingReview ? (
            <View style={styles.reviewedBadge}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.status.success} />
              <Text style={styles.reviewedText}>You rated this order {existingReview.overall_rating}★</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.reviewBtn}
              onPress={() => navigation.navigate('ReviewOrder', { orderId })}
            >
              <Text style={styles.reviewBtnText}>⭐ Rate this order</Text>
            </TouchableOpacity>
          )
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
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
  scroll: { padding: 0 },
  statusSection: {
    backgroundColor: Colors.white, padding: 20, marginBottom: 8, alignItems: 'flex-start', gap: 6,
  },
  orderNum: { fontSize: 20, fontWeight: '800', color: Colors.dark[900] },
  orderDate: { fontSize: 13, color: Colors.light.textSecondary },
  section: { backgroundColor: Colors.white, padding: 20, marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.dark[900], marginBottom: 14 },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  itemQty: { fontSize: 14, fontWeight: '700', color: Colors.primary[600], minWidth: 24 },
  itemName: { flex: 1, fontSize: 14, color: Colors.dark[800] },
  itemPrice: { fontSize: 14, fontWeight: '700', color: Colors.dark[900] },
  addressRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  addressText: { fontSize: 14, color: Colors.dark[700], flex: 1, lineHeight: 20 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryLabel: { fontSize: 14, color: Colors.dark[600] },
  summaryValue: { fontSize: 14, fontWeight: '600', color: Colors.dark[900] },
  totalRow: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.light.border, paddingTop: 10, marginTop: 4 },
  totalLabel: { fontSize: 16, fontWeight: '800', color: Colors.dark[900] },
  totalValue: { fontSize: 18, fontWeight: '900', color: Colors.primary[600] },
  reviewBtn: {
    margin: 20, backgroundColor: Colors.primary[500], borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
  },
  reviewBtnText: { fontSize: 16, fontWeight: '700', color: Colors.white },
  reviewedBadge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    margin: 20, backgroundColor: '#dcfce7', borderRadius: 14, paddingVertical: 16,
  },
  reviewedText: { fontSize: 15, fontWeight: '700', color: '#166534' },
});
