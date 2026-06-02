import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '@services/admin.service';
import { authService } from '@services/auth.service';
import { useAuthStore } from '@store/auth.store';
import { Colors } from '@constants/colors';

export function AdminDashboardScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();

  const { data: stats } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => adminService.getStats(),
    refetchInterval: 30 * 1000,
  });

  const statCards = [
    { label: 'GMV', value: `$${(stats?.gmv ?? 0).toFixed(0)}`, icon: 'cash', color: Colors.status.success, bg: '#dcfce7' },
    { label: 'Total Orders', value: String(stats?.totalOrders ?? 0), icon: 'receipt', color: Colors.status.info, bg: '#dbeafe' },
    { label: 'Restaurants', value: String(stats?.totalRestaurants ?? 0), icon: 'storefront', color: Colors.primary[600], bg: Colors.primary[50] },
    { label: 'Riders', value: String(stats?.totalRiders ?? 0), icon: 'bicycle', color: '#7c3aed', bg: '#ede9fe' },
    { label: 'Users', value: String(stats?.totalUsers ?? 0), icon: 'people', color: '#0891b2', bg: '#cffafe' },
    { label: 'Pending', value: String((stats?.pendingRestaurants ?? 0) + (stats?.pendingRiders ?? 0)), icon: 'hourglass', color: Colors.status.warning, bg: '#fef3c7' },
  ];

  const sections = [
    { label: 'Approve Restaurants', sub: `${stats?.pendingRestaurants ?? 0} pending`, icon: 'storefront-outline', route: 'ManageRestaurants', badge: stats?.pendingRestaurants },
    { label: 'Verify Riders', sub: `${stats?.pendingRiders ?? 0} pending`, icon: 'bicycle-outline', route: 'ManageRiders', badge: stats?.pendingRiders },
    { label: 'Manage Users', sub: `${stats?.totalUsers ?? 0} users`, icon: 'people-outline', route: 'ManageUsers' },
    { label: 'Platform Settings', sub: 'Rider pay & commission', icon: 'settings-outline', route: 'PlatformSettings' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Admin Panel</Text>
            <Text style={styles.name}>{user?.full_name}</Text>
          </View>
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={() => Alert.alert('Sign Out', 'Sign out of admin?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Sign Out', style: 'destructive', onPress: () => authService.signOut() },
            ])}
          >
            <Ionicons name="log-out-outline" size={22} color={Colors.status.error} />
          </TouchableOpacity>
        </View>

        <View style={styles.grid}>
          {statCards.map((c) => (
            <View key={c.label} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: c.bg }]}>
                <Ionicons name={c.icon as any} size={18} color={c.color} />
              </View>
              <Text style={styles.statValue}>{c.value}</Text>
              <Text style={styles.statLabel}>{c.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Management</Text>
        {sections.map((s) => (
          <TouchableOpacity key={s.route} style={styles.row} onPress={() => navigation.navigate(s.route)}>
            <View style={styles.rowIcon}>
              <Ionicons name={s.icon as any} size={22} color={Colors.primary[500]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>{s.label}</Text>
              <Text style={styles.rowSub}>{s.sub}</Text>
            </View>
            {!!s.badge && s.badge > 0 && (
              <View style={styles.badge}><Text style={styles.badgeText}>{s.badge}</Text></View>
            )}
            <Ionicons name="chevron-forward" size={18} color={Colors.light.textTertiary} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
  },
  greeting: { fontSize: 13, color: Colors.light.textSecondary, fontWeight: '500' },
  name: { fontSize: 24, fontWeight: '900', color: Colors.dark[900] },
  logoutBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#fee2e2',
    alignItems: 'center', justifyContent: 'center',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16, marginBottom: 8 },
  statCard: {
    width: '31%', backgroundColor: Colors.white, borderRadius: 14, padding: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
  },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statValue: { fontSize: 18, fontWeight: '900', color: Colors.dark[900] },
  statLabel: { fontSize: 10, color: Colors.light.textSecondary },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.dark[900], paddingHorizontal: 20, marginTop: 20, marginBottom: 12 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.white, marginHorizontal: 16, borderRadius: 14, padding: 16, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  rowIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primary[50], alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontSize: 15, fontWeight: '700', color: Colors.dark[900] },
  rowSub: { fontSize: 12, color: Colors.light.textSecondary, marginTop: 2 },
  badge: { backgroundColor: Colors.status.error, borderRadius: 12, minWidth: 24, height: 24, paddingHorizontal: 7, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: Colors.white, fontSize: 12, fontWeight: '800' },
});
