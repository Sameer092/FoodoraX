import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { useRestaurant, useUpdateMenuItem, useDeleteMenuItem } from '@hooks/useRestaurants';
import { Button } from '@components/common/Button';
import { Input } from '@components/common/Input';
import { Colors } from '@constants/colors';

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  description: z.string().optional(),
  price: z.string().refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, 'Enter a valid price'),
});
type Form = z.infer<typeof schema>;

export function EditMenuItemScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { restaurantId, itemId } = route.params;

  const { data: restaurant } = useRestaurant(restaurantId);
  const updateItem = useUpdateMenuItem();
  const deleteItem = useDeleteMenuItem();
  const [loading, setLoading] = useState(false);

  const item = useMemo(() => {
    for (const cat of restaurant?.categories ?? []) {
      const found = cat.items?.find((i) => i.id === itemId);
      if (found) return found;
    }
    return undefined;
  }, [restaurant, itemId]);

  const { control, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    values: item ? {
      name: item.name,
      description: item.description ?? '',
      price: String(item.price),
    } : undefined,
  });

  const onSubmit = async (data: Form) => {
    setLoading(true);
    try {
      await updateItem.mutateAsync({
        id: itemId,
        name: data.name,
        description: data.description,
        price: parseFloat(data.price),
      } as never);
      Alert.alert('✅ Saved', 'Menu item updated!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to update');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert('Delete Item', 'Remove this item from your menu?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await deleteItem.mutateAsync(itemId);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark[900]} />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Item</Text>
        <TouchableOpacity onPress={confirmDelete}>
          <Ionicons name="trash-outline" size={22} color={Colors.status.error} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Controller control={control} name="name" render={({ field }) => (
            <Input label="Item Name" value={field.value} onChangeText={field.onChange} error={errors.name?.message} />
          )} />
          <Controller control={control} name="description" render={({ field }) => (
            <Input label="Description" value={field.value} onChangeText={field.onChange} multiline />
          )} />
          <Controller control={control} name="price" render={({ field }) => (
            <Input label="Price ($)" keyboardType="decimal-pad" value={field.value} onChangeText={field.onChange}
              error={errors.price?.message}
              leftIcon={<Ionicons name="pricetag-outline" size={18} color={Colors.light.textTertiary} />} />
          )} />
          <Button title="Save Changes" onPress={handleSubmit(onSubmit)} loading={loading} fullWidth style={{ marginTop: 20 }} />
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
});
