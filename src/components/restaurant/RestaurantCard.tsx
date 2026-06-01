import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { Restaurant } from '@types/index';
import { Colors } from '@constants/colors';
import { Theme } from '@constants/theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.72;

interface RestaurantCardProps {
  restaurant: Restaurant;
  onPress: () => void;
  onFavorite?: () => void;
  isFavorite?: boolean;
  variant?: 'horizontal' | 'vertical';
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function RestaurantCard({
  restaurant, onPress, onFavorite, isFavorite, variant = 'vertical',
}: RestaurantCardProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(scale.value, { damping: 15 }) }],
  }));

  const primaryImage =
    restaurant.images?.find((i) => i.is_primary)?.url ??
    restaurant.images?.[0]?.url ??
    restaurant.cover_url ??
    restaurant.logo_url;

  if (variant === 'horizontal') {
    return (
      <AnimatedTouchable
        onPress={onPress}
        onPressIn={() => { scale.value = 0.97; }}
        onPressOut={() => { scale.value = 1; }}
        activeOpacity={0.95}
        style={[animStyle, styles.horizontalCard]}
      >
        <Image source={{ uri: primaryImage ?? '' }} style={styles.horizontalImage} contentFit="cover" />
        <View style={styles.horizontalInfo}>
          <View style={styles.horizontalHeader}>
            <Text style={styles.name} numberOfLines={1}>{restaurant.name}</Text>
            {!restaurant.is_open && (
              <View style={styles.closedBadge}><Text style={styles.closedText}>Closed</Text></View>
            )}
          </View>
          <Text style={styles.cuisine} numberOfLines={1}>
            {restaurant.cuisine_type?.join(' · ') ?? ''}
          </Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="star" size={12} color="#FBBF24" />
              <Text style={styles.metaText}>{restaurant.avg_rating.toFixed(1)}</Text>
            </View>
            <Text style={styles.dot}>·</Text>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={12} color={Colors.light.textSecondary} />
              <Text style={styles.metaText}>{restaurant.delivery_time} min</Text>
            </View>
            <Text style={styles.dot}>·</Text>
            <Text style={styles.metaText}>
              {restaurant.delivery_fee === 0 ? 'Free delivery' : `$${restaurant.delivery_fee.toFixed(2)}`}
            </Text>
          </View>
        </View>
        {onFavorite && (
          <TouchableOpacity onPress={onFavorite} style={styles.favoriteBtn} hitSlop={8}>
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={20}
              color={isFavorite ? Colors.status.error : Colors.light.textSecondary}
            />
          </TouchableOpacity>
        )}
      </AnimatedTouchable>
    );
  }

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={() => { scale.value = 0.97; }}
      onPressOut={() => { scale.value = 1; }}
      activeOpacity={0.95}
      style={[animStyle, styles.verticalCard]}
    >
      <View style={styles.imageWrapper}>
        <Image source={{ uri: primaryImage ?? '' }} style={styles.verticalImage} contentFit="cover" />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.5)']}
          style={styles.gradient}
        />
        {restaurant.is_featured && (
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredText}>Featured</Text>
          </View>
        )}
        {onFavorite && (
          <TouchableOpacity onPress={onFavorite} style={styles.absoluteFavorite} hitSlop={8}>
            <View style={styles.favoriteCircle}>
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={16}
                color={isFavorite ? Colors.status.error : Colors.dark[600]}
              />
            </View>
          </TouchableOpacity>
        )}
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={11} color="#FBBF24" />
          <Text style={styles.ratingText}>{restaurant.avg_rating.toFixed(1)}</Text>
        </View>
      </View>

      <View style={styles.verticalInfo}>
        <Text style={styles.name} numberOfLines={1}>{restaurant.name}</Text>
        <Text style={styles.cuisine} numberOfLines={1}>{restaurant.cuisine_type?.join(' · ')}</Text>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={12} color={Colors.light.textSecondary} />
            <Text style={styles.metaText}>{restaurant.delivery_time} min</Text>
          </View>
          <Text style={styles.dot}>·</Text>
          <Text style={[styles.metaText, restaurant.delivery_fee === 0 && styles.freeText]}>
            {restaurant.delivery_fee === 0 ? 'Free delivery' : `$${restaurant.delivery_fee.toFixed(2)}`}
          </Text>
        </View>
      </View>
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  verticalCard: {
    width: CARD_WIDTH,
    backgroundColor: Colors.white,
    borderRadius: 20,
    marginRight: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  imageWrapper: { position: 'relative' },
  verticalImage: { width: '100%', height: 160 },
  gradient: { ...StyleSheet.absoluteFillObject },
  featuredBadge: {
    position: 'absolute', top: 10, left: 10,
    backgroundColor: Colors.primary[500],
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
  },
  featuredText: { color: Colors.white, fontSize: 11, fontWeight: '700' },
  absoluteFavorite: { position: 'absolute', top: 10, right: 10 },
  favoriteCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  ratingBadge: {
    position: 'absolute', bottom: 10, left: 10,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, gap: 3,
  },
  ratingText: { color: Colors.white, fontSize: 11, fontWeight: '700' },
  verticalInfo: { padding: 12 },

  horizontalCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  horizontalImage: { width: 100, height: 100 },
  horizontalInfo: { flex: 1, padding: 12, justifyContent: 'center' },
  horizontalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },

  name: { fontSize: 15, fontWeight: '700', color: Colors.dark[900], flex: 1, marginBottom: 3 },
  cuisine: { fontSize: 12, color: Colors.light.textSecondary, marginBottom: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 12, color: Colors.light.textSecondary },
  dot: { color: Colors.light.textTertiary, fontSize: 12 },
  freeText: { color: Colors.status.success, fontWeight: '600' },
  favoriteBtn: { padding: 12, justifyContent: 'center' },
  closedBadge: {
    backgroundColor: Colors.dark[200],
    borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 6,
  },
  closedText: { fontSize: 10, color: Colors.dark[600], fontWeight: '600' },
});
