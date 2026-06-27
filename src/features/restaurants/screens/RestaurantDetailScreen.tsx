import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, SectionList, Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedScrollHandler, useSharedValue,
  useAnimatedStyle, interpolate, Extrapolation,
} from 'react-native-reanimated';
import { useRestaurant, useToggleFavorite, useFavorites } from '@hooks/useRestaurants';
import { useCartStore } from '@store/cart.store';
import { useAuthStore } from '@store/auth.store';
import { MenuItemCard } from '@components/restaurant/MenuItemCard';
import { MenuItemSkeleton } from '@components/common/SkeletonLoader';
import { OrderStatusBadge } from '@components/order/OrderStatusBadge';
import { Colors } from '@constants/colors';

const { width, height } = Dimensions.get('window');
const HEADER_HEIGHT = 280;

export function RestaurantDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { restaurantId } = route.params;

  const { data: restaurant, isLoading } = useRestaurant(restaurantId);
  const { data: favorites } = useFavorites();
  const toggleFavorite = useToggleFavorite();
  const { user } = useAuthStore();
  const { localItems, addLocalItem, updateLocalQuantity, getItemCount } = useCartStore();

  const scrollY = useSharedValue(0);
  const isFavorite = favorites?.some((f) => f.restaurant_id === restaurantId);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => { scrollY.value = e.contentOffset.y; },
  });

  const headerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, HEADER_HEIGHT * 0.6], [1, 0], Extrapolation.CLAMP),
    transform: [{
      translateY: interpolate(scrollY.value, [0, HEADER_HEIGHT], [0, -HEADER_HEIGHT * 0.3], Extrapolation.CLAMP),
    }],
  }));

  const navBarStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(255,255,255,${interpolate(scrollY.value, [HEADER_HEIGHT * 0.5, HEADER_HEIGHT], [0, 1], Extrapolation.CLAMP)})`,
  }));

  const getQuantity = (itemId: string) =>
    localItems.find((i) => i.menuItem.id === itemId)?.quantity ?? 0;

  const handleAddItem = (item: any) => {
    if (localItems.length > 0 && localItems[0].menuItem.restaurant_id !== item.restaurant_id) {
      Alert.alert(
        'Start New Cart?',
        'Your cart has items from another restaurant. Start a new cart?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Start New Cart',
            style: 'destructive',
            onPress: () => {
              useCartStore.getState().clearCart();
              useCartStore.getState().addLocalItem(item, restaurant!);
            },
          },
        ]
      );
    } else {
      addLocalItem(item, restaurant!);
    }
  };

  const sections = restaurant?.categories?.map((cat) => ({
    title: cat.name,
    data: cat.items ?? [],
  })) ?? [];

  const cartCount = getItemCount();

  return (
    <View style={styles.container}>
      {/* Fixed nav bar */}
      <Animated.View style={[styles.navBar, navBarStyle]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.dark[900]} />
        </TouchableOpacity>
        <Animated.Text style={[styles.navTitle, {
          opacity: interpolate(scrollY.value, [HEADER_HEIGHT * 0.7, HEADER_HEIGHT], [0, 1], Extrapolation.CLAMP),
        }]}>
          {restaurant?.name}
        </Animated.Text>
        <TouchableOpacity
          onPress={() => toggleFavorite.mutate(restaurantId)}
          style={styles.navBtn}
        >
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={20}
            color={isFavorite ? Colors.status.error : Colors.dark[900]}
          />
        </TouchableOpacity>
      </Animated.View>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}
      >
        {/* Hero Image */}
        <Animated.View style={[styles.hero, headerStyle]}>
          <Image
            source={{ uri: restaurant?.cover_url ?? restaurant?.images?.[0]?.url ?? '' }}
            style={styles.heroImage}
            contentFit="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.heroGradient}
          />
          <View style={styles.heroInfo}>
            {restaurant?.logo_url && (
              <Image source={{ uri: restaurant.logo_url }} style={styles.logo} contentFit="cover" />
            )}
            <View style={styles.heroText}>
              <Text style={styles.heroName}>{restaurant?.name}</Text>
              <Text style={styles.heroCuisine}>{restaurant?.cuisine_type?.join(' · ')}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Info Strip */}
        <View style={styles.infoStrip}>
          <View style={styles.infoItem}>
            <Ionicons name="star" size={16} color="#FBBF24" />
            <Text style={styles.infoValue}>{restaurant?.avg_rating?.toFixed(1)}</Text>
            <Text style={styles.infoLabel}>({restaurant?.total_reviews})</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={16} color={Colors.light.textSecondary} />
            <Text style={styles.infoValue}>{restaurant?.delivery_time} min</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoItem}>
            <Ionicons name="car-outline" size={16} color={Colors.light.textSecondary} />
            <Text style={styles.infoValue}>
              {restaurant?.delivery_fee === 0 ? 'Free' : `$${restaurant?.delivery_fee?.toFixed(2)}`}
            </Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoItem}>
            <View style={[styles.openDot, { backgroundColor: restaurant?.is_open ? Colors.status.success : Colors.status.error }]} />
            <Text style={styles.infoValue}>{restaurant?.is_open ? 'Open' : 'Closed'}</Text>
          </View>
        </View>

        {/* Menu */}
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <MenuItemSkeleton key={i} />)
        ) : (
          sections.map((section) => (
            <View key={section.title}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryTitle}>{section.title}</Text>
              </View>
              {section.data.map((item: any) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  quantity={getQuantity(item.id)}
                  onAdd={() => handleAddItem(item)}
                  onRemove={() => {
                    const existing = localItems.find((i) => i.menuItem.id === item.id);
                    if (existing) updateLocalQuantity(item.id, existing.quantity - 1);
                  }}
                />
              ))}
            </View>
          ))
        )}
        <View style={{ height: 120 }} />
      </Animated.ScrollView>

      {/* Cart CTA */}
      {cartCount > 0 && (
        <View style={styles.cartCta}>
          <TouchableOpacity
            style={styles.cartBtn}
            onPress={() => navigation.navigate('Cart')}
            activeOpacity={0.9}
          >
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
            <Text style={styles.cartBtnText}>View Cart</Text>
            <Text style={styles.cartBtnPrice}>
              ${useCartStore.getState().getSubtotal().toFixed(2)}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  navBar: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 52, paddingBottom: 12, paddingHorizontal: 16,
  },
  navBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 6, elevation: 4,
  },
  navTitle: { fontSize: 16, fontWeight: '700', color: Colors.dark[900] },
  hero: { height: HEADER_HEIGHT, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroGradient: { ...StyleSheet.absoluteFillObject },
  heroInfo: {
    position: 'absolute', bottom: 16, left: 16, right: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  logo: {
    width: 60, height: 60, borderRadius: 14,
    borderWidth: 2, borderColor: Colors.white,
  },
  heroText: { flex: 1 },
  heroName: { fontSize: 22, fontWeight: '800', color: Colors.white, marginBottom: 3 },
  heroCuisine: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  infoStrip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.white, paddingVertical: 14, paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.light.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
  },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  infoValue: { fontSize: 13, fontWeight: '700', color: Colors.dark[900] },
  infoLabel: { fontSize: 12, color: Colors.light.textSecondary },
  infoDivider: { width: 1, height: 20, backgroundColor: Colors.light.border },
  openDot: { width: 8, height: 8, borderRadius: 4 },
  categoryHeader: {
    paddingHorizontal: 20, paddingTop: 24, paddingBottom: 8,
    backgroundColor: '#F8F9FA',
  },
  categoryTitle: { fontSize: 18, fontWeight: '800', color: Colors.dark[900] },
  cartCta: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20, paddingBottom: 34, paddingTop: 12,
    backgroundColor: Colors.white,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.light.border,
  },
  cartBtn: {
    backgroundColor: Colors.primary[500],
    borderRadius: 16, paddingVertical: 16, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    shadowColor: Colors.primary[500],
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 14, elevation: 8,
  },
  cartBadge: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  cartBadgeText: { color: Colors.white, fontSize: 13, fontWeight: '800' },
  cartBtnText: { fontSize: 16, fontWeight: '700', color: Colors.white },
  cartBtnPrice: { fontSize: 15, fontWeight: '700', color: Colors.white },
});
