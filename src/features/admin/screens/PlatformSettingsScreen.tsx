import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@services/admin.service';
import { Button } from '@components/common/Button';
import { Input } from '@components/common/Input';
import { Colors } from '@constants/colors';

export function PlatformSettingsScreen() {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => adminService.getSettings(),
  });

  const [basePay, setBasePay] = useState('');
  const [perKm, setPerKm] = useState('');
  const [commission, setCommission] = useState('');
  const [minPayout, setMinPayout] = useState('');

  useEffect(() => {
    if (settings) {
      setBasePay(String(settings.rider_base_pay));
      setPerKm(String(settings.rider_per_km));
      setCommission(String(settings.platform_commission));
      setMinPayout(String(settings.min_payout));
    }
  }, [settings]);

  const save = useMutation({
    mutationFn: () => adminService.updateSettings({
      rider_base_pay: parseFloat(basePay) || 0,
      rider_per_km: parseFloat(perKm) || 0,
      platform_commission: parseFloat(commission) || 0,
      min_payout: parseFloat(minPayout) || 0,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
      Alert.alert('✅ Saved', 'Platform settings updated.');
    },
    onError: (e: any) => Alert.alert('Error', e.message),
  });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark[900]} />
        </TouchableOpacity>
        <Text style={styles.title}>Platform Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.banner}>
            <Ionicons name="bicycle" size={22} color={Colors.primary[500]} />
            <Text style={styles.bannerText}>Rider Payout Configuration</Text>
          </View>

          <Input label="Rider Base Pay ($ per delivery)" keyboardType="decimal-pad"
            value={basePay} onChangeText={setBasePay}
            leftIcon={<Ionicons name="cash-outline" size={18} color={Colors.light.textTertiary} />} />
          <Input label="Rider Pay per KM ($)" keyboardType="decimal-pad"
            value={perKm} onChangeText={setPerKm}
            leftIcon={<Ionicons name="navigate-outline" size={18} color={Colors.light.textTertiary} />} />
          <Input label="Minimum Payout Threshold ($)" keyboardType="decimal-pad"
            value={minPayout} onChangeText={setMinPayout}
            leftIcon={<Ionicons name="wallet-outline" size={18} color={Colors.light.textTertiary} />} />

          <View style={[styles.banner, { marginTop: 12 }]}>
            <Ionicons name="business" size={22} color={Colors.primary[500]} />
            <Text style={styles.bannerText}>Platform Revenue</Text>
          </View>

          <Input label="Platform Commission (% per order)" keyboardType="decimal-pad"
            value={commission} onChangeText={setCommission}
            leftIcon={<Ionicons name="trending-up-outline" size={18} color={Colors.light.textTertiary} />} />

          <Button title="Save Settings" onPress={() => save.mutate()} loading={save.isPending} fullWidth style={{ marginTop: 16 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.light.border,
  },
  title: { fontSize: 18, fontWeight: '800', color: Colors.dark[900] },
  scroll: { padding: 24 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  bannerText: { fontSize: 16, fontWeight: '800', color: Colors.dark[900] },
});
