import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useRestaurant } from '@hooks/useRestaurants';
import { restaurantService } from '@services/restaurant.service';
import { Colors } from '@constants/colors';

export function RestaurantSettingsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { restaurantId } = route.params;
  const queryClient = useQueryClient();

  const { data: restaurant } = useRestaurant(restaurantId);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    if (restaurant) setIsOpen(restaurant.is_open);
  }, [restaurant]);

  const toggleOpen = async (value: boolean) => {
    setIsOpen(value);
    try {
      await restaurantService.updateRestaurant(restaurantId, { is_open: value });
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
    } catch (e: any) {
      setIsOpen(!value);
      Alert.alert('Error', e.message);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark[900]} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.restaurantName}>{restaurant?.name}</Text>

        {/* Open/Closed toggle */}
        <View style={styles.settingCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingIcon}>
              <Ionicons name="storefront-outline" size={22} color={Colors.primary[500]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Accepting Orders</Text>
              <Text style={styles.settingSub}>{isOpen ? 'Your restaurant is open' : 'Closed — not receiving orders'}</Text>
            </View>
            <Switch
              value={isOpen}
              onValueChange={toggleOpen}
              trackColor={{ false: Colors.light.border, true: Colors.status.success }}
              thumbColor={Colors.white}
            />
          </View>
        </View>

        {/* Info rows */}
        <View style={styles.settingCard}>
          <InfoRow icon="location-outline" label="Address" value={restaurant?.address ?? '—'} />
          <InfoRow icon="time-outline" label="Delivery Time" value={`${restaurant?.delivery_time ?? 0} min`} />
          <InfoRow icon="car-outline" label="Delivery Fee" value={`$${restaurant?.delivery_fee?.toFixed(2) ?? '0.00'}`} />
          <InfoRow icon="call-outline" label="Phone" value={restaurant?.phone ?? '—'} last />
        </View>

        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => navigation.navigate('MenuManagement', { restaurantId })}
        >
          <Ionicons name="restaurant-outline" size={20} color={Colors.primary[500]} />
          <Text style={styles.menuBtnText}>Manage Menu</Text>
          <Ionicons name="chevron-forward" size={18} color={Colors.light.textTertiary} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value, last }: { icon: string; label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.infoRow, !last && styles.infoBorder]}>
      <Ionicons name={icon as any} size={18} color={Colors.light.textSecondary} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
    </View>
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
  scroll: { padding: 16 },
  restaurantName: { fontSize: 22, fontWeight: '800', color: Colors.dark[900], marginBottom: 16, paddingHorizontal: 4 },
  settingCard: {
    backgroundColor: Colors.white, borderRadius: 16, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingIcon: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primary[50],
    alignItems: 'center', justifyContent: 'center',
  },
  settingLabel: { fontSize: 15, fontWeight: '700', color: Colors.dark[900] },
  settingSub: { fontSize: 12, color: Colors.light.textSecondary, marginTop: 2 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  infoBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.light.border },
  infoLabel: { fontSize: 14, color: Colors.dark[600], flex: 1 },
  infoValue: { fontSize: 14, fontWeight: '600', color: Colors.dark[900], maxWidth: '50%' },
  menuBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.white, borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  menuBtnText: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.dark[800] },
});
