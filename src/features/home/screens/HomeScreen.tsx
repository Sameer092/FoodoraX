import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, RefreshControl, FlatList, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedScrollHandler, useSharedValue,
  useAnimatedStyle, interpolate, Extrapolation,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useFeaturedRestaurants, useRestaurants, useToggleFavorite, useFavorites } from '@hooks/useRestaurants';
import { useLocation } from '@hooks/useLocation';
import { useCustomerOrders } from '@hooks/useOrders';
import { useAuthStore } from '@store/auth.store';
import { OrderStatusBadge } from '@components/order/OrderStatusBadge';
import { RestaurantCard } from '@components/restaurant/RestaurantCard';
import { RestaurantCardSkeleton } from '@components/common/SkeletonLoader';
import { Colors } from '@constants/colors';
import type { CustomerStackNavigationProp } from '@types/navigation.types';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { id: '1', name: 'All',       icon: '🍽️' },
  { id: '2', name: 'Burgers',   icon: '🍔' },
  { id: '3', name: 'Pizza',     icon: '🍕' },
  { id: '4', name: 'Sushi',     icon: '🍱' },
  { id: '5', name: 'Mexican',   icon: '🌮' },
  { id: '6', name: 'Salads',    icon: '🥗' },
  { id: '7', name: 'Desserts',  icon: '🍰' },
  { id: '8', name: 'Coffee',    icon: '☕' },
  { id: '9', name: 'Chinese',   icon: '🥡' },
  { id: '10', name: 'Indian',   icon: '🍛' },
];

const DEALS = [
  { id: '1', title: 'Free Delivery', subtitle: 'On orders over $15', bg: ['#FF6B35', '#FF8C61'] as any, icon: '🛵' },
  { id: '2', title: '20% Off',       subtitle: 'First order discount',  bg: ['#7C3AED', '#A855F7'] as any, icon: '🎉' },
  { id: '3', title: 'Happy Hour',    subtitle: '3–6 PM daily deals',    bg: ['#0EA5E9', '#38BDF8'] as any, icon: '⏰' },
];

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

export function HomeScreen() {
  const navigation = useNavigation<CustomerStackNavigationProp>();
  const { user } = useAuthStore();
  const { address } = useLocation();
  const [activeCategory, setActiveCategory] = useState('1');
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useSharedValue(0);

  const { data: featured, isLoading: loadingFeatured, refetch: refetchFeatured } = useFeaturedRestaurants();
  const { data: allPages, isLoading: loadingAll, refetch: refetchAll } = useRestaurants({ isOpen: true });
  const { data: favorites } = useFavorites();
  const toggleFavorite = useToggleFavorite();

  const allRestaurants = allPages?.pages.flatMap((p) => p.data) ?? [];
  const favoriteIds = new Set(favorites?.map((f) => f.restaurant_id) ?? []);

  // Find an in-progress order to surface a live "track your order" banner
  const { data: ordersData } = useCustomerOrders();
  const activeOrder = ordersData?.pages
    .flatMap((p) => p.data)
    .find((o) => !['delivered', 'cancelled', 'refunded'].includes(o.status));

  const scrollHandler = useAnimatedScrollHandler({ onScroll: (e) => { scrollY.value = e.contentOffset.y; } });

  const headerStyle = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(scrollY.value, [0, 60], [0, 0.12], Extrapolation.CLAMP),
    elevation: interpolate(scrollY.value, [0, 60], [0, 6], Extrapolation.CLAMP),
  }));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchFeatured(), refetchAll()]);
    setRefreshing(false);
  }, [refetchFeatured, refetchAll]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Sticky Header */}
      <Animated.View style={[styles.header, headerStyle]}>
        <View style={styles.headerTop}>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={16} color={Colors.primary[500]} />
            <Text style={styles.locationText} numberOfLines={1}>
              {address || 'Getting location...'}
            </Text>
            <Ionicons name="chevron-down" size={14} color={Colors.dark[600]} />
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Notifications')}
              style={styles.headerBtn}
            >
              <Ionicons name="notifications-outline" size={22} color={Colors.dark[800]} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.avatarBtn}>
              {user?.avatar_url ? (
                <Image source={{ uri: user.avatar_url }} style={styles.avatar} contentFit="cover" />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>{user?.full_name?.[0]?.toUpperCase()}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Greeting */}
        <Text style={styles.greeting}>{greeting()}, {user?.full_name?.split(' ')[0]} 👋</Text>
        <Text style={styles.greetingSub}>What would you like to eat?</Text>

        {/* Search Bar */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Search' as any)}
          style={styles.searchBar}
          activeOpacity={0.8}
        >
          <Ionicons name="search" size={18} color={Colors.light.textTertiary} />
          <Text style={styles.searchPlaceholder}>Search restaurants or food...</Text>
          <View style={styles.filterBtn}>
            <Ionicons name="options-outline" size={16} color={Colors.primary[500]} />
          </View>
        </TouchableOpacity>
      </Animated.View>

      <AnimatedScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        style={styles.scrollBody}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary[500]} />
        }
      >
        {/* Active order banner */}
        {activeOrder && (
          <TouchableOpacity
            style={styles.activeOrderBanner}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('OrderTracking', { orderId: activeOrder.id })}
          >
            <View style={styles.activeOrderIcon}>
              <Ionicons name="bicycle" size={22} color={Colors.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.activeOrderTitle} numberOfLines={1}>
                Order #{activeOrder.order_number}
              </Text>
              <Text style={styles.activeOrderSub} numberOfLines={1}>
                {activeOrder.restaurant?.name ?? 'Your order'} · Tap to track
              </Text>
            </View>
            <OrderStatusBadge status={activeOrder.status} size="sm" />
          </TouchableOpacity>
        )}

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catList}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setActiveCategory(cat.id)}
                style={[styles.catItem, activeCategory === cat.id && styles.catItemActive]}
              >
                <Text style={styles.catIcon}>{cat.icon}</Text>
                <Text style={[styles.catName, activeCategory === cat.id && styles.catNameActive]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Featured Deals Banner */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Deals</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dealsList}>
            {DEALS.map((deal) => (
              <TouchableOpacity key={deal.id} activeOpacity={0.9}>
                <LinearGradient colors={deal.bg} style={styles.dealCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Text style={styles.dealIcon}>{deal.icon}</Text>
                  <View>
                    <Text style={styles.dealTitle}>{deal.title}</Text>
                    <Text style={styles.dealSubtitle}>{deal.subtitle}</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Featured Restaurants */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Search' as any)}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredList}>
            {loadingFeatured
              ? Array.from({ length: 3 }).map((_, i) => <RestaurantCardSkeleton key={i} />)
              : featured?.map((r) => (
                <RestaurantCard
                  key={r.id}
                  restaurant={r}
                  onPress={() => navigation.navigate('RestaurantDetail', { restaurantId: r.id })}
                  onFavorite={() => toggleFavorite.mutate(r.id)}
                  isFavorite={favoriteIds.has(r.id)}
                />
              ))
            }
          </ScrollView>
        </View>

        {/* Nearby Restaurants */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nearby Restaurants</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Search' as any)}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.nearbyList}>
            {loadingAll
              ? Array.from({ length: 3 }).map((_, i) => <RestaurantCardSkeleton key={i} />)
              : allRestaurants.map((r) => (
                <RestaurantCard
                  key={r.id}
                  restaurant={r}
                  variant="horizontal"
                  onPress={() => navigation.navigate('RestaurantDetail', { restaurantId: r.id })}
                  onFavorite={() => toggleFavorite.mutate(r.id)}
                  isFavorite={favoriteIds.has(r.id)}
                />
              ))
            }
          </View>
        </View>

        <View style={{ height: 100 }} />
      </AnimatedScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingBottom: 16,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1, marginRight: 12 },
  locationText: { fontSize: 13, color: Colors.dark[700], fontWeight: '500', flex: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.light.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarBtn: {},
  avatar: { width: 36, height: 36, borderRadius: 18 },
  avatarPlaceholder: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primary[500],
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  greeting: { fontSize: 22, fontWeight: '800', color: Colors.dark[900], marginTop: 4 },
  greetingSub: { fontSize: 13, color: Colors.light.textSecondary, marginBottom: 14 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderRadius: 14, paddingHorizontal: 14,
    paddingVertical: 13, gap: 10,
    borderWidth: 1, borderColor: Colors.light.border,
  },
  searchPlaceholder: { flex: 1, fontSize: 14, color: Colors.light.placeholder },
  filterBtn: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: Colors.primary[50],
    alignItems: 'center', justifyContent: 'center',
  },
  // Scroll view bg is WHITE so the top overscroll bounce blends with the white
  // header; the content container carries the gray page background.
  scrollBody: { flex: 1, backgroundColor: Colors.white },
  scroll: { paddingTop: 8, flexGrow: 1, backgroundColor: '#F8F9FA' },
  nearbyList: { paddingHorizontal: 20 },
  activeOrderBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.dark[900], marginHorizontal: 20, marginTop: 12,
    borderRadius: 16, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 10, elevation: 5,
  },
  activeOrderIcon: {
    width: 42, height: 42, borderRadius: 12, backgroundColor: Colors.primary[500],
    alignItems: 'center', justifyContent: 'center',
  },
  activeOrderTitle: { fontSize: 14, fontWeight: '800', color: Colors.white },
  activeOrderSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  section: { marginBottom: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 14, marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.dark[900], paddingHorizontal: 20, marginTop: 20, marginBottom: 14 },
  seeAll: { fontSize: 13, color: Colors.primary[600], fontWeight: '600' },
  catList: { paddingHorizontal: 20, gap: 10 },
  catItem: {
    alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 14, backgroundColor: Colors.white,
    borderWidth: 1, borderColor: Colors.light.border, gap: 4, minWidth: 70,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  catItemActive: { backgroundColor: Colors.primary[500], borderColor: Colors.primary[500] },
  catIcon: { fontSize: 22 },
  catName: { fontSize: 11, fontWeight: '600', color: Colors.dark[600] },
  catNameActive: { color: Colors.white },
  dealsList: { paddingHorizontal: 20, gap: 12 },
  dealCard: {
    width: 200, height: 110, borderRadius: 18,
    padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 10, elevation: 6,
  },
  dealIcon: { fontSize: 36 },
  dealTitle: { fontSize: 17, fontWeight: '800', color: Colors.white },
  dealSubtitle: { fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  featuredList: { paddingHorizontal: 20, paddingBottom: 4 },
});
