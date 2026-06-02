import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '@services/admin.service';
import { EmptyState } from '@components/common/EmptyState';
import { Colors } from '@constants/colors';
import type { User, UserRole } from '@types/index';

const TABS: { label: string; value: UserRole | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Customers', value: 'customer' },
  { label: 'Owners', value: 'restaurant_owner' },
  { label: 'Riders', value: 'rider' },
];

const ROLE_COLORS: Record<string, string> = {
  customer: Colors.status.info,
  restaurant_owner: Colors.primary[500],
  rider: '#7c3aed',
  admin: Colors.status.error,
};

export function ManageUsersScreen() {
  const navigation = useNavigation<any>();
  const [tab, setTab] = useState<UserRole | 'all'>('all');

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => adminService.getAllUsers(),
  });

  const filtered = (users ?? []).filter((u) => tab === 'all' || u.role === tab);

  const renderItem = ({ item }: { item: User }) => (
    <View style={styles.card}>
      <View style={[styles.avatar, { backgroundColor: ROLE_COLORS[item.role] ?? Colors.dark[400] }]}>
        <Text style={styles.avatarText}>{item.full_name?.[0]?.toUpperCase() ?? '?'}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.full_name}</Text>
        <Text style={styles.email}>{item.email}</Text>
        {item.phone ? <Text style={styles.phone}>{item.phone}</Text> : null}
      </View>
      <View style={[styles.rolePill, { backgroundColor: `${ROLE_COLORS[item.role] ?? Colors.dark[400]}20` }]}>
        <Text style={[styles.roleText, { color: ROLE_COLORS[item.role] ?? Colors.dark[600] }]}>
          {item.role.replace('_', ' ')}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark[900]} />
        </TouchableOpacity>
        <Text style={styles.title}>Users</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tabs}>
        {TABS.map((t) => (
          <TouchableOpacity key={t.value} onPress={() => setTab(t.value)} style={[styles.tab, tab === t.value && styles.tabActive]}>
            <Text style={[styles.tabText, tab === t.value && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator color={Colors.primary[500]} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(u) => u.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyState icon="people-outline" title="No users" description="No users in this category" />}
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
  tabs: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 6, flexWrap: 'wrap' },
  tab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.light.border },
  tabActive: { backgroundColor: Colors.primary[500], borderColor: Colors.primary[500] },
  tabText: { fontSize: 12, fontWeight: '500', color: Colors.dark[600] },
  tabTextActive: { color: Colors.white, fontWeight: '700' },
  list: { paddingHorizontal: 16, paddingBottom: 20, gap: 10 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.white, borderRadius: 14, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: Colors.white, fontSize: 18, fontWeight: '700' },
  name: { fontSize: 15, fontWeight: '700', color: Colors.dark[900] },
  email: { fontSize: 12, color: Colors.light.textSecondary },
  phone: { fontSize: 11, color: Colors.light.textTertiary, marginTop: 1 },
  rolePill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  roleText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
});
