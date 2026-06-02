import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '@services/auth.service';
import { Button } from '@components/common/Button';
import { Input } from '@components/common/Input';
import { Colors } from '@constants/colors';
import type { AuthStackNavigationProp } from '@types/navigation.types';
import type { UserRole } from '@types/index';

const schema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email:     z.string().email('Enter a valid email'),
  phone:     z.string().optional(),
  password:  z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  role: z.enum(['customer', 'restaurant_owner', 'rider']),
  // Restaurant
  restaurant_name: z.string().optional(),
  cuisine_type: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  // Rider
  vehicle_type: z.string().optional(),
  vehicle_number: z.string().optional(),
  license_number: z.string().optional(),
}).superRefine((d, ctx) => {
  if (d.password !== d.confirmPassword) {
    ctx.addIssue({ code: 'custom', message: "Passwords don't match", path: ['confirmPassword'] });
  }
  if (d.role === 'restaurant_owner') {
    if (!d.restaurant_name || d.restaurant_name.length < 2)
      ctx.addIssue({ code: 'custom', message: 'Restaurant name is required', path: ['restaurant_name'] });
    if (!d.cuisine_type || d.cuisine_type.length < 2)
      ctx.addIssue({ code: 'custom', message: 'Enter at least one cuisine', path: ['cuisine_type'] });
    if (!d.address || d.address.length < 5)
      ctx.addIssue({ code: 'custom', message: 'Address is required', path: ['address'] });
    if (!d.city || d.city.length < 2)
      ctx.addIssue({ code: 'custom', message: 'City is required', path: ['city'] });
  }
  if (d.role === 'rider') {
    if (!d.vehicle_type || d.vehicle_type.length < 2)
      ctx.addIssue({ code: 'custom', message: 'Select a vehicle type', path: ['vehicle_type'] });
  }
});
type SignUpForm = z.infer<typeof schema>;

const ROLES: { value: 'customer' | 'restaurant_owner' | 'rider'; label: string; icon: string }[] = [
  { value: 'customer', label: 'Customer', icon: 'person-outline' },
  { value: 'restaurant_owner', label: 'Restaurant', icon: 'restaurant-outline' },
  { value: 'rider', label: 'Rider', icon: 'bicycle-outline' },
];

const VEHICLES = ['Motorcycle', 'Bicycle', 'Car', 'Scooter'];

export function SignUpScreen() {
  const navigation = useNavigation<AuthStackNavigationProp>();
  const [loading, setLoading] = useState(false);
  const [vehicle, setVehicle] = useState('Motorcycle');

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<SignUpForm>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'customer', vehicle_type: 'Motorcycle' },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: SignUpForm) => {
    setLoading(true);
    try {
      const result = await authService.signUp({
        email: data.email,
        password: data.password,
        full_name: data.full_name,
        phone: data.phone,
        role: data.role as UserRole,
        restaurant: data.role === 'restaurant_owner' ? {
          restaurant_name: data.restaurant_name!,
          cuisine_type: data.cuisine_type!,
          address: data.address!,
          city: data.city!,
        } : undefined,
        rider: data.role === 'rider' ? {
          vehicle_type: data.vehicle_type!,
          vehicle_number: data.vehicle_number,
          license_number: data.license_number,
        } : undefined,
      });

      if (!result.session) {
        Alert.alert(
          '✅ Account Created!',
          'Please check your email to confirm, then sign in.',
          [{ text: 'Go to Login', onPress: () => navigation.navigate('Login') }]
        );
      } else if (data.role === 'restaurant_owner') {
        Alert.alert('🎉 Welcome!', 'Your restaurant has been submitted for admin approval. You can set up your menu now.');
      } else if (data.role === 'rider') {
        Alert.alert('🎉 Welcome!', 'Your rider account is pending admin verification. You can explore in the meantime.');
      }
    } catch (e: any) {
      Alert.alert('Sign Up Failed', e.message ?? 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <Ionicons name="arrow-back" size={24} color={Colors.dark[900]} />
          </TouchableOpacity>

          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join FoodoraX today</Text>

          {/* Role Selection */}
          <Text style={styles.sectionLabel}>I'm a...</Text>
          <View style={styles.roleRow}>
            {ROLES.map((r) => (
              <TouchableOpacity
                key={r.value}
                onPress={() => setValue('role', r.value)}
                style={[styles.roleCard, selectedRole === r.value && styles.roleCardActive]}
              >
                <Ionicons
                  name={r.icon as any}
                  size={24}
                  color={selectedRole === r.value ? Colors.primary[500] : Colors.light.textSecondary}
                />
                <Text style={[styles.roleLabel, selectedRole === r.value && styles.roleLabelActive]}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Common fields */}
          <Controller control={control} name="full_name" render={({ field }) => (
            <Input label="Full Name" placeholder="Your full name" autoCapitalize="words"
              value={field.value} onChangeText={field.onChange} error={errors.full_name?.message}
              leftIcon={<Ionicons name="person-outline" size={18} color={Colors.light.textTertiary} />} />
          )} />
          <Controller control={control} name="email" render={({ field }) => (
            <Input label="Email" placeholder="your@email.com" keyboardType="email-address" autoCapitalize="none"
              value={field.value} onChangeText={field.onChange} error={errors.email?.message}
              leftIcon={<Ionicons name="mail-outline" size={18} color={Colors.light.textTertiary} />} />
          )} />
          <Controller control={control} name="phone" render={({ field }) => (
            <Input label="Phone (optional)" placeholder="+1 234 567 8900" keyboardType="phone-pad"
              value={field.value} onChangeText={field.onChange}
              leftIcon={<Ionicons name="call-outline" size={18} color={Colors.light.textTertiary} />} />
          )} />

          {/* Restaurant-specific */}
          {selectedRole === 'restaurant_owner' && (
            <View style={styles.roleSection}>
              <Text style={styles.roleSectionTitle}>🍴 Restaurant Details</Text>
              <Controller control={control} name="restaurant_name" render={({ field }) => (
                <Input label="Restaurant Name" placeholder="e.g. Burger Republic"
                  value={field.value} onChangeText={field.onChange} error={errors.restaurant_name?.message} />
              )} />
              <Controller control={control} name="cuisine_type" render={({ field }) => (
                <Input label="Cuisine Types" placeholder="Burgers, American (comma separated)"
                  value={field.value} onChangeText={field.onChange} error={errors.cuisine_type?.message} />
              )} />
              <Controller control={control} name="address" render={({ field }) => (
                <Input label="Address" placeholder="Street address"
                  value={field.value} onChangeText={field.onChange} error={errors.address?.message} />
              )} />
              <Controller control={control} name="city" render={({ field }) => (
                <Input label="City" placeholder="Dubai"
                  value={field.value} onChangeText={field.onChange} error={errors.city?.message} />
              )} />
            </View>
          )}

          {/* Rider-specific */}
          {selectedRole === 'rider' && (
            <View style={styles.roleSection}>
              <Text style={styles.roleSectionTitle}>🛵 Vehicle Details</Text>
              <Text style={styles.fieldLabel}>Vehicle Type</Text>
              <View style={styles.vehicleRow}>
                {VEHICLES.map((v) => (
                  <TouchableOpacity
                    key={v}
                    onPress={() => { setVehicle(v); setValue('vehicle_type', v); }}
                    style={[styles.vehicleChip, vehicle === v && styles.vehicleChipActive]}
                  >
                    <Text style={[styles.vehicleText, vehicle === v && styles.vehicleTextActive]}>{v}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Controller control={control} name="vehicle_number" render={({ field }) => (
                <Input label="Vehicle Number (optional)" placeholder="ABC-1234"
                  value={field.value} onChangeText={field.onChange} autoCapitalize="characters" />
              )} />
              <Controller control={control} name="license_number" render={({ field }) => (
                <Input label="License Number (optional)" placeholder="DL-XXXXXX"
                  value={field.value} onChangeText={field.onChange} autoCapitalize="characters" />
              )} />
            </View>
          )}

          {/* Password */}
          <Controller control={control} name="password" render={({ field }) => (
            <Input label="Password" placeholder="Min 8 characters" isPassword
              value={field.value} onChangeText={field.onChange} error={errors.password?.message}
              leftIcon={<Ionicons name="lock-closed-outline" size={18} color={Colors.light.textTertiary} />} />
          )} />
          <Controller control={control} name="confirmPassword" render={({ field }) => (
            <Input label="Confirm Password" placeholder="Repeat password" isPassword
              value={field.value} onChangeText={field.onChange} error={errors.confirmPassword?.message}
              leftIcon={<Ionicons name="lock-closed-outline" size={18} color={Colors.light.textTertiary} />} />
          )} />

          <Button title="Create Account" onPress={handleSubmit(onSubmit)} loading={loading} fullWidth style={styles.btn} />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}> Sign in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, padding: 24 },
  back: { marginBottom: 20, alignSelf: 'flex-start' },
  title: { fontSize: 28, fontWeight: '800', color: Colors.dark[900], marginBottom: 6 },
  subtitle: { fontSize: 14, color: Colors.light.textSecondary, marginBottom: 28 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: Colors.dark[700], marginBottom: 10 },
  roleRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  roleCard: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 14,
    borderRadius: 14, borderWidth: 1.5, borderColor: Colors.light.border,
    backgroundColor: Colors.white, gap: 6,
  },
  roleCardActive: { borderColor: Colors.primary[500], backgroundColor: Colors.primary[50] },
  roleLabel: { fontSize: 11, fontWeight: '600', color: Colors.light.textSecondary },
  roleLabelActive: { color: Colors.primary[600] },
  roleSection: {
    backgroundColor: Colors.light.surface, borderRadius: 16, padding: 16, marginBottom: 16,
  },
  roleSectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.dark[900], marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: Colors.dark[700], marginBottom: 8 },
  vehicleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  vehicleChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
    borderWidth: 1.5, borderColor: Colors.light.border, backgroundColor: Colors.white,
  },
  vehicleChipActive: { backgroundColor: Colors.primary[500], borderColor: Colors.primary[500] },
  vehicleText: { fontSize: 13, fontWeight: '600', color: Colors.dark[600] },
  vehicleTextActive: { color: Colors.white },
  btn: { marginTop: 8, marginBottom: 24 },
  footer: { flexDirection: 'row', justifyContent: 'center', paddingBottom: 12 },
  footerText: { fontSize: 14, color: Colors.light.textSecondary },
  loginLink: { fontSize: 14, color: Colors.primary[600], fontWeight: '700' },
});
