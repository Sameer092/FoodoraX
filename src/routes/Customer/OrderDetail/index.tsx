import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { connect } from 'react-redux';
import Icon from '@expo/vector-icons/Ionicons';
import colors from '@colors';
import { Bold, Regular, Medium } from '@fonts';
import { wp, hp, currency } from '@utils/utilities';
import { format } from 'date-fns';
import { Header, Button } from '@components/common';
import StatusBadge from '@components/common/StatusBadge';
import * as OrderActions from '@store/Orders/actions';
import * as RestaurantActions from '@store/Restaurants/actions';

let enhancer = connect(null, { ...OrderActions, ...RestaurantActions });

function OrderDetail({ navigation, route, getOrder, getReviewByOrder }) {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [reviewed, setReviewed] = useState(false);

  useEffect(() => {
    getOrder(orderId).then(setOrder);
    getReviewByOrder(orderId).then((r) => setReviewed(!!r));
  }, [orderId]);

  if (!order) return <SafeAreaView style={styles.safe} edges={['top']}><Header title="Order Details" onBack={() => navigation.goBack()} /></SafeAreaView>;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Order Details" onBack={() => navigation.goBack()} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.statusSection}>
          <StatusBadge status={order.status} />
          <Text style={styles.orderNum}>#{order.order_number}</Text>
          <Text style={styles.date}>{format(new Date(order.created_at), 'MMMM d, yyyy h:mm a')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>
          {(order.items || []).map((i) => (
            <View key={i.id} style={styles.itemRow}>
              <Text style={styles.itemQty}>{i.quantity}x</Text>
              <Text style={styles.itemName} numberOfLines={1}>{i.name}</Text>
              <Text style={styles.itemPrice}>{currency(i.total_price)}</Text>
            </View>
          ))}
        </View>

        {order.delivery_address ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivered to</Text>
            <View style={styles.addrRow}>
              <Icon name="location" size={wp(4.5)} color={colors.primary} />
              <Text style={styles.addrText}>{order.delivery_address.address_line1}, {order.delivery_address.city}</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          <Row label="Subtotal" value={currency(order.subtotal)} />
          <Row label="Delivery fee" value={currency(order.delivery_fee)} />
          <Row label="Tax" value={currency(order.tax_amount)} />
          {order.discount_amount > 0 ? <Row label="Discount" value={`-${currency(order.discount_amount)}`} green /> : null}
          <View style={styles.divider} />
          <Row label="Total" value={currency(order.total_amount)} bold />
        </View>

        {order.status === 'delivered' && !reviewed ? (
          <Button label="⭐ Rate this order" onPress={() => navigation.navigate('ReviewOrder', { orderId })} buttonStyle={{ margin: wp(5) }} />
        ) : null}
        <View style={{ height: hp(4) }} />
      </ScrollView>
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

export default enhancer(OrderDetail);

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background
  },
  statusSection: {
    backgroundColor: colors.white,
    padding: wp(5),
    marginBottom: hp(1),
    gap: hp(0.7),
    alignItems: 'flex-start'
  },
  orderNum: {
    fontWeight: Bold,
    fontSize: wp(5),
    color: colors.txtDark
  },
  date: {
    fontWeight: Regular,
    fontSize: wp(3.3),
    color: colors.txtSecondary
  },
  section: {
    backgroundColor: colors.white,
    padding: wp(5),
    marginBottom: hp(1)
  },
  sectionTitle: {
    fontWeight: Bold,
    fontSize: wp(4),
    color: colors.txtDark,
    marginBottom: hp(1.5)
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1.2)
  },
  itemQty: {
    fontWeight: Bold,
    fontSize: wp(3.6),
    color: colors.primaryDark,
    width: wp(8)
  },
  itemName: {
    flex: 1,
    fontWeight: Regular,
    fontSize: wp(3.6),
    color: colors.dark800
  },
  itemPrice: {
    fontWeight: Bold,
    fontSize: wp(3.6),
    color: colors.txtDark
  },
  addrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2)
  },
  addrText: {
    flex: 1,
    fontWeight: Regular,
    fontSize: wp(3.6),
    color: colors.dark700
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
  }
});
