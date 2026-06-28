import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { connect } from 'react-redux';
import Icon from '@expo/vector-icons/Ionicons';
import { format } from 'date-fns';
import colors from '@colors';
import { Bold, Regular, Medium } from '@fonts';
import { wp, hp, currency } from '@utils/utilities';
import { Header, EmptyState } from '@components/common';
import * as UserActions from '@store/Users/actions';

function within(dateStr, days) {
  if (!dateStr) return false;
  return Date.now() - new Date(dateStr).getTime() <= days * 86400000;
}

let connectState = (state) => ({ user: state.Auth.auth.get('user') });
let enhancer = connect(connectState, { ...UserActions });

function Earnings({ navigation, user, getRiderEarnings }) {
  const [rows, setRows] = useState([]);

  const load = useCallback(() => { if (user) getRiderEarnings(user.id).then(setRows); }, [user]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const total = rows.reduce((s, o) => s + Number(o.rider_payout || 0), 0);
  const week = rows.filter((o) => within(o.delivered_at, 7)).reduce((s, o) => s + Number(o.rider_payout || 0), 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Earnings" onBack={() => navigation.goBack()} />
      <FlatList
        data={rows}
        keyExtractor={(o) => o.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.summary}>
            <View style={styles.heroCard}>
              <Text style={styles.heroLabel}>Total Earnings</Text>
              <Text style={styles.heroValue}>{currency(total)}</Text>
            </View>
            <View style={styles.row}>
              <View style={styles.smallCard}>
                <Text style={styles.smallValue}>{currency(week)}</Text>
                <Text style={styles.smallLabel}>Last 7 days</Text>
              </View>
              <View style={styles.smallCard}>
                <Text style={styles.smallValue}>{rows.length}</Text>
                <Text style={styles.smallLabel}>Deliveries</Text>
              </View>
            </View>
            {rows.length ? <Text style={styles.sectionTitle}>History</Text> : null}
          </View>
        }
        ListEmptyComponent={<EmptyState icon="wallet-outline" title="No earnings yet" description="Complete deliveries to earn" />}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={styles.itemIcon}><Icon name="checkmark" size={wp(4.5)} color={colors.success} /></View>
            <View style={{ flex: 1, marginLeft: wp(3) }}>
              <Text style={styles.itemNum}>#{item.order_number}</Text>
              <Text style={styles.itemDate}>{item.delivered_at ? format(new Date(item.delivered_at), 'MMM d, h:mm a') : ''}</Text>
            </View>
            <Text style={styles.itemPay}>+{currency(item.rider_payout)}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

export default enhancer(Earnings);

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background
  },
  list: {
    padding: wp(5),
    paddingTop: 0
  },
  summary: {
    paddingTop: hp(2)
  },
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: wp(5),
    padding: wp(6),
    marginBottom: hp(1.5)
  },
  heroLabel: {
    fontWeight: Medium,
    fontSize: wp(3.4),
    color: colors.white,
    opacity: 0.85
  },
  heroValue: {
    fontWeight: Bold,
    fontSize: wp(8),
    color: colors.white,
    marginTop: hp(0.5)
  },
  row: {
    flexDirection: 'row',
    gap: wp(3)
  },
  smallCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: wp(3.5),
    padding: wp(4),
    alignItems: 'center'
  },
  smallValue: {
    fontWeight: Bold,
    fontSize: wp(5),
    color: colors.txtDark
  },
  smallLabel: {
    fontWeight: Regular,
    fontSize: wp(3),
    color: colors.txtSecondary,
    marginTop: 2
  },
  sectionTitle: {
    fontWeight: Bold,
    fontSize: wp(4.4),
    color: colors.txtDark,
    marginTop: hp(2.5),
    marginBottom: hp(1)
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: wp(3.5),
    padding: wp(4),
    marginBottom: hp(1)
  },
  itemIcon: {
    width: wp(9),
    height: wp(9),
    borderRadius: wp(4.5),
    backgroundColor: colors.successSoft,
    alignItems: 'center',
    justifyContent: 'center'
  },
  itemNum: {
    fontWeight: Bold,
    fontSize: wp(3.6),
    color: colors.txtDark
  },
  itemDate: {
    fontWeight: Regular,
    fontSize: wp(3),
    color: colors.txtSecondary,
    marginTop: 2
  },
  itemPay: {
    fontWeight: Bold,
    fontSize: wp(4),
    color: colors.success
  }
});
