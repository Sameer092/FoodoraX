import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useFavorites, useToggleFavorite } from '@hooks/useRestaurants';
import { RestaurantCard } from '@components/restaurant/RestaurantCard';
import { EmptyState } from '@components/common/EmptyState';
import { Colors } from '@constants/colors';
import type { CustomerStackNavigationProp } from '@types/navigation.types';

export function FavoritesScreen() {
  const navigation = useNavigation<CustomerStackNavigationProp>();
  const { data: favorites, isLoading } = useFavorites();
  const toggleFavorite = useToggleFavorite();

  const restaurantFavorites = favorites?.filter((f) => f.restaurant_id) ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Favorites</Text>
      </View>
      <FlatList
        data={restaurantFavorites}
        keyExtractor={(f) => f.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="heart-outline"
            title="No favorites yet"
            description="Save your favorite restaurants and they'll appear here"
            actionLabel="Browse Restaurants"
            onAction={() => navigation.navigate('CustomerTabs')}
          />
        }
        renderItem={({ item }) =>
          item.restaurant ? (
            <RestaurantCard
              restaurant={item.restaurant}
              variant="horizontal"
              onPress={() => navigation.navigate('RestaurantDetail', { restaurantId: item.restaurant_id! })}
              onFavorite={() => toggleFavorite.mutate(item.restaurant_id!)}
              isFavorite
            />
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  title: { fontSize: 26, fontWeight: '900', color: Colors.dark[900] },
  list: { padding: 16, gap: 0 },
});
