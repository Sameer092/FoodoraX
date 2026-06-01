import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '@components/common/Input';
import { RestaurantCard } from '@components/restaurant/RestaurantCard';
import { EmptyState } from '@components/common/EmptyState';
import { useRestaurants } from '@hooks/useRestaurants';
import { Colors } from '@constants/colors';
import type { CustomerStackNavigationProp } from '@types/navigation.types';
import { useDebouncedCallback } from 'use-debounce';

const FILTERS = ['All', 'Pizza', 'Burgers', 'Sushi', 'Halal', 'Vegan', 'Fast Food'];
const SORT_OPTIONS = [
  { value: 'rating', label: 'Top Rated' },
  { value: 'delivery_time', label: 'Fastest' },
  { value: 'delivery_fee', label: 'Cheapest delivery' },
];

export function SearchScreen() {
  const navigation = useNavigation<CustomerStackNavigationProp>();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeCuisine, setActiveCuisine] = useState<string | undefined>();
  const [sortBy, setSortBy] = useState<'rating' | 'delivery_time' | 'delivery_fee'>('rating');

  const debounce = useDebouncedCallback((v: string) => setDebouncedQuery(v), 400);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useRestaurants({
    query: debouncedQuery,
    cuisineType: activeCuisine ? [activeCuisine] : undefined,
    sortBy,
  });

  const restaurants = data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={Colors.dark[900]} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Input
            placeholder="Search restaurants, cuisine..."
            value={query}
            onChangeText={(v) => { setQuery(v); debounce(v); }}
            leftIcon={<Ionicons name="search" size={18} color={Colors.light.textTertiary} />}
            rightIcon={query ? (
              <TouchableOpacity onPress={() => { setQuery(''); setDebouncedQuery(''); }}>
                <Ionicons name="close-circle" size={18} color={Colors.light.textTertiary} />
              </TouchableOpacity>
            ) : undefined}
            containerStyle={{ marginBottom: 0 }}
            autoFocus
          />
        </View>
      </View>

      {/* Cuisine Filters */}
      <FlatList
        horizontal
        data={FILTERS}
        keyExtractor={(i) => i}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setActiveCuisine(item === 'All' ? undefined : item)}
            style={[
              styles.filterChip,
              activeCuisine === item || (item === 'All' && !activeCuisine) && styles.filterChipActive,
            ]}
          >
            <Text style={[
              styles.filterText,
              activeCuisine === item || (item === 'All' && !activeCuisine) && styles.filterTextActive,
            ]}>{item}</Text>
          </TouchableOpacity>
        )}
      />

      {/* Sort */}
      <View style={styles.sortRow}>
        <Text style={styles.resultCount}>{restaurants.length} results</Text>
        <View style={styles.sortBtns}>
          {SORT_OPTIONS.map((s) => (
            <TouchableOpacity
              key={s.value}
              onPress={() => setSortBy(s.value as any)}
              style={[styles.sortBtn, sortBy === s.value && styles.sortBtnActive]}
            >
              <Text style={[styles.sortText, sortBy === s.value && styles.sortTextActive]}>
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Results */}
      {isLoading ? (
        <ActivityIndicator color={Colors.primary[500]} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={restaurants}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.list}
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.3}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="search-outline"
              title="No restaurants found"
              description={`We couldn't find any restaurants${debouncedQuery ? ` for "${debouncedQuery}"` : ''}`}
            />
          }
          ListFooterComponent={isFetchingNextPage ? <ActivityIndicator color={Colors.primary[500]} /> : null}
          renderItem={({ item }) => (
            <RestaurantCard
              restaurant={item}
              variant="horizontal"
              onPress={() => navigation.navigate('RestaurantDetail', { restaurantId: item.id })}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4, gap: 10 },
  back: { padding: 4 },
  filters: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: Colors.light.border,
    backgroundColor: Colors.white,
  },
  filterChipActive: { backgroundColor: Colors.primary[500], borderColor: Colors.primary[500] },
  filterText: { fontSize: 13, fontWeight: '500', color: Colors.dark[600] },
  filterTextActive: { color: Colors.white, fontWeight: '700' },
  sortRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  resultCount: { fontSize: 13, color: Colors.light.textSecondary },
  sortBtns: { flexDirection: 'row', gap: 6, flex: 1, justifyContent: 'flex-end', flexWrap: 'wrap' },
  sortBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: Colors.light.surface },
  sortBtnActive: { backgroundColor: Colors.primary[50] },
  sortText: { fontSize: 11, color: Colors.dark[600] },
  sortTextActive: { color: Colors.primary[600], fontWeight: '700' },
  list: { padding: 16, gap: 0 },
});
