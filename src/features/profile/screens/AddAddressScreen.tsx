import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@services/supabase';
import { locationService } from '@services/location.service';
import { useAuthStore } from '@store/auth.store';
import { useAppStore } from '@store/app.store';
import { Button } from '@components/common/Button';
import { Input } from '@components/common/Input';
import { Colors } from '@constants/colors';
import type { Coordinates } from '@types/index';

const schema = z.object({
  label: z.string().default('Home'),
  address_line1: z.string().min(5, 'Address too short'),
  address_line2: z.string().optional(),
  city: z.string().min(2, 'Enter a city'),
  postal_code: z.string().optional(),
});
type Form = z.infer<typeof schema>;

const LABELS = ['Home', 'Work', 'Other'];

export function AddAddressScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const { setSelectedAddress } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('Home');
  const [coords, setCoords] = useState<Coordinates | null>(null);

  const { control, handleSubmit, setValue, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { label: 'Home' },
  });

  const useCurrentLocation = async () => {
    setLocating(true);
    try {
      const granted = await locationService.requestPermissions();
      if (!granted) {
        Alert.alert('Permission needed', 'Please allow location access to use this feature.');
        return;
      }
      const current = await locationService.getCurrentLocation();
      setCoords(current);

      // Reverse-geocode to auto-fill the address fields
      const results = await locationService.reverseGeocodeDetailed(current);
      if (results) {
        if (results.line1) setValue('address_line1', results.line1);
        if (results.city) setValue('city', results.city);
        if (results.postalCode) setValue('postal_code', results.postalCode);
      }
    } catch (e: any) {
      Alert.alert('Location Error', 'Could not get your current location. Please enter it manually.');
    } finally {
      setLocating(false);
    }
  };

  const onSubmit = async (data: Form) => {
    setLoading(true);
    try {
      // Get coordinates — use captured GPS, else geocode the typed address
      let finalCoords = coords;
      if (!finalCoords) {
        finalCoords = await locationService.geocodeAddress(
          `${data.address_line1}, ${data.city}`
        );
      }

      const { data: address, error } = await supabase
        .from('delivery_addresses')
        .insert({
          label: selectedLabel,
          address_line1: data.address_line1,
          address_line2: data.address_line2,
          city: data.city,
          postal_code: data.postal_code,
          user_id: user!.id,
          latitude: finalCoords?.latitude,
          longitude: finalCoords?.longitude,
        })
        .select()
        .single();
      if (error) throw error;

      setSelectedAddress(address as any);
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark[900]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Address</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Use current location */}
        <TouchableOpacity style={styles.locBtn} onPress={useCurrentLocation} disabled={locating}>
          {locating ? (
            <ActivityIndicator color={Colors.primary[500]} size="small" />
          ) : (
            <Ionicons name="navigate" size={18} color={Colors.primary[500]} />
          )}
          <Text style={styles.locBtnText}>
            {locating ? 'Getting your location...' : 'Use my current location'}
          </Text>
          {coords && !locating && <Ionicons name="checkmark-circle" size={18} color={Colors.status.success} />}
        </TouchableOpacity>

        <Text style={styles.sectionLabel}>Label</Text>
        <View style={styles.labelRow}>
          {LABELS.map((l) => (
            <TouchableOpacity
              key={l}
              onPress={() => setSelectedLabel(l)}
              style={[styles.labelChip, selectedLabel === l && styles.labelChipActive]}
            >
              <Text style={[styles.labelText, selectedLabel === l && styles.labelTextActive]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Controller control={control} name="address_line1" render={({ field }) => (
          <Input label="Address Line 1" placeholder="Street address, building..." value={field.value} onChangeText={field.onChange} error={errors.address_line1?.message} />
        )} />
        <Controller control={control} name="address_line2" render={({ field }) => (
          <Input label="Address Line 2 (optional)" placeholder="Apt, floor, unit..." value={field.value} onChangeText={field.onChange} />
        )} />
        <Controller control={control} name="city" render={({ field }) => (
          <Input label="City" value={field.value} onChangeText={field.onChange} error={errors.city?.message} />
        )} />
        <Controller control={control} name="postal_code" render={({ field }) => (
          <Input label="Postal Code (optional)" keyboardType="numeric" value={field.value} onChangeText={field.onChange} />
        )} />

        <Button title="Save Address" onPress={handleSubmit(onSubmit)} loading={loading} fullWidth style={styles.btn} />
      </ScrollView>
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
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.dark[900] },
  scroll: { padding: 24 },
  locBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: Colors.primary[50], borderRadius: 12, paddingVertical: 14,
    marginBottom: 24, borderWidth: 1, borderColor: Colors.primary[200],
  },
  locBtnText: { fontSize: 14, fontWeight: '700', color: Colors.primary[600] },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: Colors.dark[700], marginBottom: 10 },
  labelRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  labelChip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12,
    borderWidth: 1.5, borderColor: Colors.light.border,
  },
  labelChipActive: { backgroundColor: Colors.primary[500], borderColor: Colors.primary[500] },
  labelText: { fontSize: 13, fontWeight: '600', color: Colors.dark[600] },
  labelTextActive: { color: Colors.white },
  btn: { marginTop: 16 },
});
