import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { useRestaurant, useCreateMenuItem } from '@hooks/useRestaurants';
import { Button } from '@components/common/Button';
import { Input } from '@components/common/Input';
import { Colors } from '@constants/colors';

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  description: z.string().optional(),
  price: z.string().refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, 'Enter a valid price'),
});
type Form = z.infer<typeof schema>;

export function AddMenuItemScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { restaurantId } = route.params;

  const { data: restaurant } = useRestaurant(restaurantId);
  const createItem = useCreateMenuItem();
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [isVeg, setIsVeg] = useState(false);
  const [isSpicy, setIsSpicy] = useState(false);
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const categories = restaurant?.categories ?? [];

  const onSubmit = async (data: Form) => {
    setLoading(true);
    try {
      await createItem.mutateAsync({
        restaurant_id: restaurantId,
        category_id: categoryId ?? categories[0]?.id,
        name: data.name,
        description: data.description,
        price: parseFloat(data.price),
        is_available: true,
        is_featured: false,
        is_vegetarian: isVeg,
        is_vegan: false,
        is_spicy: isSpicy,
        preparation_time: 15,
        sort_order: 0,
      } as never);

      Alert.alert('✅ Added', 'Menu item created successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to add item');
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
        <Text style={styles.title}>Add Menu Item</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Controller control={control} name="name" render={({ field }) => (
            <Input label="Item Name" placeholder="e.g. Cheeseburger"
              value={field.value} onChangeText={field.onChange} error={errors.name?.message} />
          )} />

          <Controller control={control} name="description" render={({ field }) => (
            <Input label="Description (optional)" placeholder="Short description"
              value={field.value} onChangeText={field.onChange} multiline />
          )} />

          <Controller control={control} name="price" render={({ field }) => (
            <Input label="Price ($)" placeholder="0.00" keyboardType="decimal-pad"
              value={field.value} onChangeText={field.onChange} error={errors.price?.message}
              leftIcon={<Ionicons name="pricetag-outline" size={18} color={Colors.light.textTertiary} />} />
          )} />

          {categories.length > 0 && (
            <>
              <Text style={styles.label}>Category</Text>
              <View style={styles.chips}>
                {categories.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => setCategoryId(c.id)}
                    style={[styles.chip, categoryId === c.id && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, categoryId === c.id && styles.chipTextActive]}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <Text style={styles.label}>Options</Text>
          <View style={styles.chips}>
            <TouchableOpacity onPress={() => setIsVeg((v) => !v)} style={[styles.chip, isVeg && styles.chipActive]}>
              <Text style={[styles.chipText, isVeg && styles.chipTextActive]}>🥬 Vegetarian</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsSpicy((v) => !v)} style={[styles.chip, isSpicy && styles.chipActive]}>
              <Text style={[styles.chipText, isSpicy && styles.chipTextActive]}>🌶 Spicy</Text>
            </TouchableOpacity>
          </View>

          <Button title="Add Item" onPress={handleSubmit(onSubmit)} loading={loading} fullWidth style={{ marginTop: 20 }} />
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
  label: { fontSize: 13, fontWeight: '600', color: Colors.dark[700], marginBottom: 10, marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12,
    borderWidth: 1.5, borderColor: Colors.light.border,
  },
  chipActive: { backgroundColor: Colors.primary[500], borderColor: Colors.primary[500] },
  chipText: { fontSize: 13, fontWeight: '600', color: Colors.dark[600] },
  chipTextActive: { color: Colors.white },
});
