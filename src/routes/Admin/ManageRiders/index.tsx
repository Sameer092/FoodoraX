import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { connect } from 'react-redux';
import Icon from '@expo/vector-icons/Ionicons';
import colors from '@colors';
import { Bold, Regular, Medium } from '@fonts';
import { wp, hp } from '@utils/utilities';
import { Header, EmptyState, NameAvatar } from '@components/common';
import * as AdminActions from '@store/Admin/actions';

const TABS = [{ label: 'Pending', value: 'pending' }, { label: 'Verified', value: 'verified' }, { label: 'All', value: 'all' }];

let enhancer = connect(null, { ...AdminActions });

function ManageRiders({ navigation, getAllRiders, setRiderVerified }) {
  const [rows, setRows] = useState([]);
  const [tab, setTab] = useState('pending');

  const load = useCallback(() => { getAllRiders().then(setRows); }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = rows.filter((r) => tab === 'all' || (tab === 'verified' ? r.is_verified : !r.is_verified));

  const toggle = (r) => {
    const verify = !r.is_verified;
    const name = (r.user && r.user.full_name) || 'this rider';
    Alert.alert(verify ? 'Verify Rider' : 'Revoke Verification', `${verify ? 'Verify' : 'Revoke'} ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: async () => { await setRiderVerified(r.id, verify); load(); } },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Riders" onBack={() => navigation.goBack()} />
      <View style={styles.tabs}>
        {TABS.map((t) => (
          <TouchableOpacity key={t.value} onPress={() => setTab(t.value)} style={[styles.tab, tab === t.value && styles.tabActive]}>
            <Text style={[styles.tabText, tab === t.value && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState icon="bicycle-outline" title="No riders" description="Nothing here yet" />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <NameAvatar name={item.user && item.user.full_name} uri={item.user && item.user.avatar_url} size={wp(11)} />
              <View style={{ flex: 1, marginLeft: wp(3) }}>
                <Text style={styles.name}>{item.user && item.user.full_name}</Text>
                <Text style={styles.meta}>{item.vehicle_type} · {item.total_deliveries || 0} deliveries</Text>
                <Text style={styles.meta}>⭐ {Number(item.avg_rating || 0).toFixed(1)}</Text>
              </View>
              <View style={[styles.pill, { backgroundColor: item.is_verified ? colors.successSoft : colors.warningSoft }]}>
                <Text style={[styles.pillText, { color: item.is_verified ? colors.successDark : colors.warningDark }]}>{item.is_verified ? 'Verified' : 'Pending'}</Text>
              </View>
            </View>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: item.is_verified ? colors.dangerSoft : colors.primary }]} onPress={() => toggle(item)}>
              <Icon name={item.is_verified ? 'close-circle-outline' : 'checkmark-circle-outline'} size={wp(4.5)} color={item.is_verified ? colors.danger : colors.white} />
              <Text style={[styles.actionText, { color: item.is_verified ? colors.danger : colors.white }]}>{item.is_verified ? 'Revoke' : 'Verify'}</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

export default enhancer(ManageRiders);

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background
  },
  tabs: {
    flexDirection: 'row',
    padding: wp(4),
    gap: wp(2)
  },
  tab: {
    paddingHorizontal: wp(4),
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
    fontSize: wp(3.2),
    color: colors.dark600
  },
  tabTextActive: {
    color: colors.white,
    fontWeight: Bold
  },
  list: {
    paddingHorizontal: wp(4),
    paddingBottom: hp(2),
    gap: hp(1.5)
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: wp(4),
    padding: wp(4)
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1.5)
  },
  name: {
    fontWeight: Bold,
    fontSize: wp(4),
    color: colors.txtDark
  },
  meta: {
    fontWeight: Regular,
    fontSize: wp(3),
    color: colors.txtTertiary,
    marginTop: 2
  },
  pill: {
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(0.5),
    borderRadius: wp(2),
    height: hp(3),
    justifyContent: 'center'
  },
  pillText: {
    fontWeight: Bold,
    fontSize: wp(2.8)
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(2),
    borderRadius: wp(2.5),
    paddingVertical: hp(1.3)
  },
  actionText: {
    fontWeight: Bold,
    fontSize: wp(3.5)
  }
});
