import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { connect } from 'react-redux';
import Icon from '@expo/vector-icons/Ionicons';
import colors from '@colors';
import { Bold, Regular, Medium } from '@fonts';
import { wp, hp, currency } from '@utils/utilities';
import * as AdminActions from '@store/Admin/actions';
import * as AuthActions from '@store/Auth/actions';

const MENU = [
  { label: 'Restaurants', icon: 'storefront', bg: '#dbeafe', color: '#1d4ed8', route: 'ManageRestaurants', key: 'pendingRestaurants' },
  { label: 'Riders', icon: 'bicycle', bg: colors.successSoft, color: '#15803d', route: 'ManageRiders', key: 'pendingRiders' },
  { label: 'Orders', icon: 'receipt', bg: colors.warningSoft, color: '#b45309', route: 'AdminOrders' },
  { label: 'Users', icon: 'people', bg: '#ede9fe', color: '#6d28d9', route: 'ManageUsers' },
  { label: 'Settings', icon: 'settings', bg: '#fce7f3', color: '#9d174d', route: 'PlatformSettings' },
];

let connectState = (state) => ({ user: state.Auth.auth.get('user') });
let enhancer = connect(connectState, { ...AdminActions, ...AuthActions });

function AdminDashboard({ navigation, user, getStats, signOut }) {
  const [stats, setStats] = useState(null);

  const load = useCallback(() => { getStats().then(setStats); }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const s = stats || {};

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: hp(4) }}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Admin Panel</Text>
            <Text style={styles.name}>{user && user.full_name ? user.full_name : 'Administrator'}</Text>
          </View>
          <TouchableOpacity style={styles.headerBtn} onPress={() => signOut()}>
            <Icon name="log-out-outline" size={wp(5.5)} color={colors.danger} />
          </TouchableOpacity>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Platform Revenue</Text>
          <Text style={styles.heroValue}>{currency(s.revenue || 0)}</Text>
          <Text style={styles.heroSub}>GMV {currency(s.gmv || 0)} · {s.commissionPct || 0}% commission</Text>
        </View>

        <View style={styles.grid}>
          <Stat icon="storefront" color="#1d4ed8" value={s.totalRestaurants || 0} label="Restaurants" />
          <Stat icon="bicycle" color="#15803d" value={s.totalRiders || 0} label="Riders" />
          <Stat icon="receipt" color="#b45309" value={s.totalOrders || 0} label="Orders" />
          <Stat icon="people" color="#6d28d9" value={s.totalUsers || 0} label="Users" />
        </View>

        <Text style={styles.sectionTitle}>Management</Text>
        {MENU.map((m) => {
          const badge = m.key ? s[m.key] : 0;
          return (
            <TouchableOpacity key={m.label} style={styles.menuRow} onPress={() => navigation.navigate(m.route)}>
              <View style={[styles.menuIcon, { backgroundColor: m.bg }]}><Icon name={m.icon} size={wp(5.5)} color={m.color} /></View>
              <Text style={styles.menuLabel}>{m.label}</Text>
              {badge ? <View style={styles.badge}><Text style={styles.badgeText}>{badge}</Text></View> : null}
              <Icon name="chevron-forward" size={wp(5)} color={colors.txtTertiary} />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ icon, color, value, label }) {
  return (
    <View style={styles.statCard}>
      <Icon name={icon} size={wp(5.5)} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default enhancer(AdminDashboard);

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    backgroundColor: colors.white
  },
  greeting: {
    fontWeight: Regular,
    fontSize: wp(3.3),
    color: colors.txtSecondary
  },
  name: {
    fontWeight: Bold,
    fontSize: wp(5.5),
    color: colors.txtDark
  },
  headerBtn: {
    width: wp(9.5),
    height: wp(9.5),
    borderRadius: wp(4.75),
    backgroundColor: colors.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center'
  },
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: wp(5),
    padding: wp(6),
    margin: wp(5)
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
    marginVertical: hp(0.5)
  },
  heroSub: {
    fontWeight: Regular,
    fontSize: wp(3.2),
    color: colors.white,
    opacity: 0.85
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: hp(1.5),
    paddingHorizontal: wp(5)
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: wp(3.5),
    padding: wp(4),
    gap: hp(0.5)
  },
  statValue: {
    fontWeight: Bold,
    fontSize: wp(6),
    color: colors.txtDark
  },
  statLabel: {
    fontWeight: Regular,
    fontSize: wp(3),
    color: colors.txtSecondary
  },
  sectionTitle: {
    fontWeight: Bold,
    fontSize: wp(4.4),
    color: colors.txtDark,
    paddingHorizontal: wp(5),
    marginTop: hp(2.5),
    marginBottom: hp(1.5)
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: wp(5),
    borderRadius: wp(3.5),
    padding: wp(4),
    marginBottom: hp(1)
  },
  menuIcon: {
    width: wp(11),
    height: wp(11),
    borderRadius: wp(3),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(3)
  },
  menuLabel: {
    flex: 1,
    fontWeight: Medium,
    fontSize: wp(4),
    color: colors.txtDark
  },
  badge: {
    minWidth: wp(5.5),
    height: wp(5.5),
    borderRadius: wp(2.75),
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(1.5),
    marginRight: wp(2)
  },
  badgeText: {
    fontWeight: Bold,
    fontSize: wp(2.8),
    color: colors.white
  }
});
