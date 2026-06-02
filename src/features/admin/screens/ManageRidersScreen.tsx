import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@services/admin.service';
import { EmptyState } from '@components/common/EmptyState';
import { Colors } from '@constants/colors';
import type { Rider, User } from '@types/index';

const TABS = ['Pending', 'Verified', 'All'];

export function ManageRidersScreen() {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('Pending');

  const { data: riders, isLoading } = useQuery({
    queryKey: ['admin', 'riders'],
    queryFn: () => adminService.getAllRiders(),
  });

  const verify = useMutation({
    mutationFn: ({ id, verified }: { id: string; verified: boolean }) =>
      adminService.setRiderVerified(id, verified),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'riders'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });

  const filtered = (riders ?? []).filter((r) => {
    if (tab === 'Pending') return !r.is_verified;
    if (tab === 'Verified') return r.is_verified;
    return true;
  });

  const renderItem = ({ item }: { item: Rider & { user?: User } }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.user?.full_name?.[0]?.toUpperCase() ?? 'R'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.user?.full_name ?? 'Rider'}</Text>
          <Text style={styles.email}>{item.user?.email}</Text>
          <View style={styles.vehicleRow}>
            <Ionicons name="bicycle-outline" size={13} color={Colors.light.textSecondary} />
            <Text style={styles.vehicle}>
              {item.vehicle_type}{item.vehicle_number ? ` · ${item.vehicle_number}` : ''}
            </Text>
          </View>
          {item.license_number && <Text style={styles.license}>License: {item.license_number}</Text>}
        </View>
        <View style={[styles.statusPill, { backgroundColor: item.is_verified ? '#dcfce7' : '#fef3c7' }]}>
          <Text style={[styles.statusText, { color: item.is_verified ? '#166534' : '#92400e' }]}>
            {item.is_verified ? 'Verified' : 'Pending'}
          </Text>
        </View>
      </View>

      <View style={styles.stats}>
        <Text style={styles.statText}>🚴 {item.total_deliveries ?? 0} deliveries</Text>
        <Text style={styles.statText}>⭐ {(item.avg_rating ?? 0).toFixed(1)}</Text>
      </View>

      <View style={styles.actions}>
        {!item.is_verified ? (
          <TouchableOpacity
            style={[styles.actionBtn, styles.approveBtn]}
            onPress={() => verify.mutate({ id: item.id, verified: true })}
          >
            <Ionicons name="checkmark-circle" size={16} color={Colors.white} />
            <Text style={styles.approveText}>Verify Rider</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionBtn, styles.revokeBtn]}
            onPress={() => Alert.alert('Revoke', 'Remove this rider verification?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Revoke', style: 'destructive', onPress: () => verify.mutate({ id: item.id, verified: false }) },
            ])}
          >
            <Text style={styles.revokeText}>Revoke Verification</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark[900]} />
        </TouchableOpacity>
        <Text style={styles.title}>Riders</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tabs}>
        {TABS.map((t) => (
          <TouchableOpacity key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabActive]}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator color={Colors.primary[500]} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(r) => r.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyState icon="bicycle-outline" title="No riders" description={`No ${tab.toLowerCase()} riders`} />}
        />
      )}
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
  title: { fontSize: 18, fontWeight: '800', color: Colors.dark[900] },
  tabs: { flexDirection: 'row', padding: 16, gap: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.light.border },
  tabActive: { backgroundColor: Colors.primary[500], borderColor: Colors.primary[500] },
  tabText: { fontSize: 13, fontWeight: '500', color: Colors.dark[600] },
  tabTextActive: { color: Colors.white, fontWeight: '700' },
  list: { paddingHorizontal: 16, paddingBottom: 20, gap: 12 },
  card: {
    backgroundColor: Colors.white, borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  cardTop: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primary[500], alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: Colors.white, fontSize: 18, fontWeight: '700' },
  name: { fontSize: 16, fontWeight: '700', color: Colors.dark[900] },
  email: { fontSize: 12, color: Colors.light.textSecondary },
  vehicleRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  vehicle: { fontSize: 12, color: Colors.dark[600] },
  license: { fontSize: 11, color: Colors.light.textTertiary, marginTop: 2 },
  statusPill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start' },
  statusText: { fontSize: 11, fontWeight: '700' },
  stats: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  statText: { fontSize: 12, color: Colors.dark[600] },
  actions: { flexDirection: 'row' },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: 10 },
  approveBtn: { backgroundColor: Colors.status.success },
  approveText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  revokeBtn: { borderWidth: 1.5, borderColor: Colors.status.error },
  revokeText: { color: Colors.status.error, fontWeight: '700', fontSize: 14 },
});
