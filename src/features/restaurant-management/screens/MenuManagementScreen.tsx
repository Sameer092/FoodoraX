import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRestaurant, useUpdateMenuItem, useDeleteMenuItem } from '@hooks/useRestaurants';
import { EmptyState } from '@components/common/EmptyState';
import { Colors } from '@constants/colors';
import type { MenuItem } from '@types/index';

export function MenuManagementScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { restaurantId } = route.params;

  const { data: restaurant, isLoading } = useRestaurant(restaurantId);
  const updateItem = useUpdateMenuItem();
  const deleteItem = useDeleteMenuItem();

  const toggleAvailability = (item: MenuItem) => {
    updateItem.mutate({ id: item.id, is_available: !item.is_available, restaurant_id: restaurantId });
  };

  const confirmDelete = (item: MenuItem) => {
    Alert.alert('Delete Item', `Remove "${item.name}" from your menu?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteItem.mutate(item.id) },
    ]);
  };

  const categories = restaurant?.categories ?? [];
  const totalItems = categories.reduce((sum, c) => sum + (c.items?.length ?? 0), 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark[900]} />
        </TouchableOpacity>
        <Text style={styles.title}>Menu</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('AddMenuItem', { restaurantId })}
          style={styles.addBtn}
        >
          <Ionicons name="add" size={22} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator color={Colors.primary[500]} style={{ marginTop: 40 }} />
      ) : totalItems === 0 ? (
        <EmptyState
          icon="restaurant-outline"
          title="No menu items yet"
          description="Add your first dish to start receiving orders"
          actionLabel="Add Menu Item"
          onAction={() => navigation.navigate('AddMenuItem', { restaurantId })}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {categories.map((category) => (
            <View key={category.id} style={styles.category}>
              <Text style={styles.categoryName}>{category.name}</Text>
              {(category.items ?? []).map((item) => (
                <View key={item.id} style={styles.itemCard}>
                  {item.image_url ? (
                    <Image source={{ uri: item.image_url }} style={styles.itemImage} contentFit="cover" />
                  ) : (
                    <View style={[styles.itemImage, styles.imagePlaceholder]}>
                      <Ionicons name="fast-food-outline" size={24} color={Colors.light.textTertiary} />
                    </View>
                  )}
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
                    <View style={styles.availRow}>
                      <Switch
                        value={item.is_available}
                        onValueChange={() => toggleAvailability(item)}
                        trackColor={{ false: Colors.light.border, true: Colors.status.success }}
                        thumbColor={Colors.white}
                        style={{ transform: [{ scale: 0.8 }] }}
                      />
                      <Text style={[styles.availText, { color: item.is_available ? Colors.status.success : Colors.light.textTertiary }]}>
                        {item.is_available ? 'Available' : 'Hidden'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.actions}>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('EditMenuItem', { restaurantId, itemId: item.id })}
                      style={styles.actionBtn}
                    >
                      <Ionicons name="create-outline" size={18} color={Colors.status.info} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => confirmDelete(item)} style={styles.actionBtn}>
                      <Ionicons name="trash-outline" size={18} color={Colors.status.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
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
  addBtn: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.primary[500],
    alignItems: 'center', justifyContent: 'center',
  },
  list: { padding: 16 },
  category: { marginBottom: 20 },
  categoryName: { fontSize: 16, fontWeight: '800', color: Colors.dark[900], marginBottom: 10 },
  itemCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.white, borderRadius: 14, padding: 12, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  itemImage: { width: 60, height: 60, borderRadius: 10 },
  imagePlaceholder: { backgroundColor: Colors.light.surface, alignItems: 'center', justifyContent: 'center' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '700', color: Colors.dark[900] },
  itemPrice: { fontSize: 14, fontWeight: '700', color: Colors.primary[600], marginTop: 2 },
  availRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  availText: { fontSize: 11, fontWeight: '600' },
  actions: { gap: 6 },
  actionBtn: {
    width: 34, height: 34, borderRadius: 10, backgroundColor: Colors.light.surface,
    alignItems: 'center', justifyContent: 'center',
  },
});
