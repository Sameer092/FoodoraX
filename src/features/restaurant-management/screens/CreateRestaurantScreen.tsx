import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { restaurantService } from '@services/restaurant.service';
import { supabase } from '@services/supabase';
import { useAuthStore } from '@store/auth.store';
import { Button } from '@components/common/Button';
import { Input } from '@components/common/Input';
import { Colors } from '@constants/colors';

const schema = z.object({
  name: z.string().min(2, 'Restaurant name is required'),
  description: z.string().optional(),
  cuisine: z.string().min(2, 'Enter at least one cuisine type'),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  phone: z.string().optional(),
  deliveryFee: z.string().optional(),
  deliveryTime: z.string().optional(),
});
type Form = z.infer<typeof schema>;

export function CreateRestaurantScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const createDefaultCategory = async (restaurantId: string) => {
    await supabase.from('menu_categories').insert({
      restaurant_id: restaurantId,
      name: 'Main Menu',
      sort_order: 0,
    });
  };

  const onSubmit = async (data: Form) => {
    setLoading(true);
    try {
      const restaurant = await restaurantService.createRestaurant({
        owner_id: user!.id,
        name: data.name,
        description: data.description,
        cuisine_type: data.cuisine.split(',').map((c) => c.trim()).filter(Boolean),
        address: data.address,
        city: data.city,
        phone: data.phone,
        delivery_fee: data.deliveryFee ? parseFloat(data.deliveryFee) : 0,
        delivery_time: data.deliveryTime ? parseInt(data.deliveryTime, 10) : 30,
        min_order: 0,
        is_open: true,
        is_featured: false,
        is_verified: false,
      } as never);

      await createDefaultCategory(restaurant.id);
      queryClient.invalidateQueries({ queryKey: ['restaurants', 'owner', user?.id] });

      Alert.alert('🎉 Restaurant Created!', 'Now add some menu items to start receiving orders.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to create restaurant');
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
        <Text style={styles.title}>Create Restaurant</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Controller control={control} name="name" render={({ field }) => (
            <Input label="Restaurant Name" placeholder="e.g. Burger Republic"
              value={field.value} onChangeText={field.onChange} error={errors.name?.message} />
          )} />
          <Controller control={control} name="description" render={({ field }) => (
            <Input label="Description" placeholder="Short tagline" value={field.value} onChangeText={field.onChange} multiline />
          )} />
          <Controller control={control} name="cuisine" render={({ field }) => (
            <Input label="Cuisine Types" placeholder="Burgers, American (comma separated)"
              value={field.value} onChangeText={field.onChange} error={errors.cuisine?.message} />
          )} />
          <Controller control={control} name="address" render={({ field }) => (
            <Input label="Address" placeholder="Street address" value={field.value} onChangeText={field.onChange} error={errors.address?.message} />
          )} />
          <Controller control={control} name="city" render={({ field }) => (
            <Input label="City" placeholder="Dubai" value={field.value} onChangeText={field.onChange} error={errors.city?.message} />
          )} />
          <Controller control={control} name="phone" render={({ field }) => (
            <Input label="Phone (optional)" keyboardType="phone-pad" value={field.value} onChangeText={field.onChange} />
          )} />
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Controller control={control} name="deliveryFee" render={({ field }) => (
                <Input label="Delivery Fee ($)" placeholder="0" keyboardType="decimal-pad" value={field.value} onChangeText={field.onChange} />
              )} />
            </View>
            <View style={{ flex: 1 }}>
              <Controller control={control} name="deliveryTime" render={({ field }) => (
                <Input label="Delivery Time (min)" placeholder="30" keyboardType="number-pad" value={field.value} onChangeText={field.onChange} />
              )} />
            </View>
          </View>
          <Button title="Create Restaurant" onPress={handleSubmit(onSubmit)} loading={loading} fullWidth style={{ marginTop: 12 }} />
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
  row: { flexDirection: 'row', gap: 12 },
});
