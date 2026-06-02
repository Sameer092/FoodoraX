import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@services/admin.service';
import { EmptyState } from '@components/common/EmptyState';
import { Colors } from '@constants/colors';
import type { Restaurant, User } from '@types/index';

const TABS = ['Pending', 'Approved', 'All'];

export function ManageRestaurantsScreen() {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('Pending');

  const { data: restaurants, isLoading } = useQuery({
    queryKey: ['admin', 'restaurants'],
    queryFn: () => adminService.getAllRestaurants(),
  });

  const verify = useMutation({
    mutationFn: ({ id, verified }: { id: string; verified: boolean }) =>
      adminService.setRestaurantVerified(id, verified),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'restaurants'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });

  const filtered = (restaurants ?? []).filter((r) => {
    if (tab === 'Pending') return !r.is_verified;
    if (tab === 'Approved') return r.is_verified;
    return true;
  });

  const renderItem = ({ item }: { item: Restaurant & { owner?: User } }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        {item.logo_url ? (
          <Image source={{ uri: item.logo_url }} style={styles.logo} contentFit="cover" />
        ) : (
          <View style={[styles.logo, styles.logoPlaceholder]}>
            <Ionicons name="storefront" size={22} color={Colors.primary[500]} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.cuisine}>{item.cuisine_type?.join(', ')}</Text>
          <Text style={styles.address} numberOfLines={1}>{item.address}, {item.city}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: item.is_verified ? '#dcfce7' : '#fef3c7' }]}>
          <Text style={[styles.statusText, { color: item.is_verified ? '#166534' : '#92400e' }]}>
            {item.is_verified ? 'Approved' : 'Pending'}
          </Text>
        </View>
      </View>

      {item.owner && (
        <View style={styles.ownerRow}>
          <Ionicons name="person-circle-outline" size={16} color={Colors.light.textSecondary} />
          <Text style={styles.ownerText}>{item.owner.full_name} · {item.owner.email}</Text>
        </View>
      )}

      <View style={styles.actions}>
        {!item.is_verified ? (
          <>
            <TouchableOpacity
              style={[styles.actionBtn, styles.rejectBtn]}
              onPress={() => Alert.alert('Reject', `Keep "${item.name}" unapproved?`, [{ text: 'OK' }])}
            >
              <Text style={styles.rejectText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.approveBtn]}
              onPress={() => verify.mutate({ id: item.id, verified: true })}
            >
              <Ionicons name="checkmark" size={16} color={Colors.white} />
              <Text style={styles.approveText}>Approve</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.actionBtn, styles.revokeBtn]}
            onPress={() => Alert.alert('Revoke Approval', `Hide "${item.name}" from customers?`, [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Revoke', style: 'destructive', onPress: () => verify.mutate({ id: item.id, verified: false }) },
            ])}
          >
            <Text style={styles.revokeText}>Revoke Approval</Text>
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
        <Text style={styles.title}>Restaurants</Text>
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
          ListEmptyComponent={<EmptyState icon="storefront-outline" title="No restaurants" description={`No ${tab.toLowerCase()} restaurants`} />}
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
  logo: { width: 50, height: 50, borderRadius: 12 },
  logoPlaceholder: { backgroundColor: Colors.primary[50], alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 16, fontWeight: '700', color: Colors.dark[900] },
  cuisine: { fontSize: 12, color: Colors.light.textSecondary, marginTop: 1 },
  address: { fontSize: 12, color: Colors.light.textTertiary, marginTop: 2 },
  statusPill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start' },
  statusText: { fontSize: 11, fontWeight: '700' },
  ownerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  ownerText: { fontSize: 12, color: Colors.dark[600] },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: 10 },
  approveBtn: { backgroundColor: Colors.status.success },
  approveText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  rejectBtn: { borderWidth: 1.5, borderColor: Colors.light.border },
  rejectText: { color: Colors.dark[600], fontWeight: '700', fontSize: 14 },
  revokeBtn: { borderWidth: 1.5, borderColor: Colors.status.error },
  revokeText: { color: Colors.status.error, fontWeight: '700', fontSize: 14 },
});
