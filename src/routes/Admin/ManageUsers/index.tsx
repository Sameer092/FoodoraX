import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { connect } from 'react-redux';
import colors from '@colors';
import { Bold, Regular, Medium } from '@fonts';
import { wp, hp } from '@utils/utilities';
import { Header, EmptyState, NameAvatar } from '@components/common';
import * as AdminActions from '@store/Admin/actions';

const ROLES = [
  { label: 'All', value: 'all' },
  { label: 'Customers', value: 'customer' },
  { label: 'Owners', value: 'restaurant_owner' },
  { label: 'Riders', value: 'rider' },
];
const ROLE_COLOR = {
  customer: { bg: '#dbeafe', color: '#1d4ed8' },
  restaurant_owner: { bg: colors.warningSoft, color: '#b45309' },
  rider: { bg: colors.successSoft, color: '#15803d' },
  admin: { bg: '#ede9fe', color: '#6d28d9' },
};

let enhancer = connect(null, { ...AdminActions });

function ManageUsers({ navigation, getAllUsers }) {
  const [rows, setRows] = useState([]);
  const [role, setRole] = useState('all');

  const load = useCallback(() => { getAllUsers().then(setRows); }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = rows.filter((u) => role === 'all' || u.role === role);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Users" onBack={() => navigation.goBack()} />
      <View style={styles.tabs}>
        {ROLES.map((t) => (
          <TouchableOpacity key={t.value} onPress={() => setRole(t.value)} style={[styles.tab, role === t.value && styles.tabActive]}>
            <Text style={[styles.tabText, role === t.value && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(u) => u.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState icon="people-outline" title="No users" description="Nothing here yet" />}
        renderItem={({ item }) => {
          const rc = ROLE_COLOR[item.role] || ROLE_COLOR.customer;
          return (
            <View style={styles.card}>
              <NameAvatar name={item.full_name} uri={item.avatar_url} size={wp(11)} />
              <View style={{ flex: 1, marginLeft: wp(3) }}>
                <Text style={styles.name}>{item.full_name || 'Unnamed'}</Text>
                <Text style={styles.email} numberOfLines={1}>{item.email}</Text>
              </View>
              <View style={[styles.pill, { backgroundColor: rc.bg }]}>
                <Text style={[styles.pillText, { color: rc.color }]}>{(item.role || '').replace('_', ' ')}</Text>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

export default enhancer(ManageUsers);

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background
  },
  tabs: {
    flexDirection: 'row',
    padding: wp(4),
    gap: wp(2),
    flexWrap: 'wrap'
  },
  tab: {
    paddingHorizontal: wp(3.5),
    paddingVertical: hp(0.9),
    borderRadius: wp(5),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  tabText: {
    fontWeight: Regular,
    fontSize: wp(3.1),
    color: colors.dark600
  },
  tabTextActive: {
    color: colors.white,
    fontWeight: Bold
  },
  list: {
    paddingHorizontal: wp(4),
    paddingBottom: hp(2),
    gap: hp(1.2)
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: wp(4),
    padding: wp(3.5)
  },
  name: {
    fontWeight: Bold,
    fontSize: wp(3.8),
    color: colors.txtDark
  },
  email: {
    fontWeight: Regular,
    fontSize: wp(3),
    color: colors.txtTertiary,
    marginTop: 2
  },
  pill: {
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(0.5),
    borderRadius: wp(2)
  },
  pillText: {
    fontWeight: Bold,
    fontSize: wp(2.8),
    textTransform: 'capitalize'
  }
});
