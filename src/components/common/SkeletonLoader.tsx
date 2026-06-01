import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withRepeat, withTiming, interpolate, Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@constants/colors';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.linear }),
      -1,
      false
    );
  }, [shimmer]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(shimmer.value, [0, 1], [-300, 300]) }],
  }));

  return (
    <View style={[{ width, height, borderRadius, overflow: 'hidden', backgroundColor: '#E5E7EB' }, style]}>
      <Animated.View style={[StyleSheet.absoluteFill, animStyle]}>
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.6)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

export function RestaurantCardSkeleton() {
  return (
    <View style={skeletonStyles.card}>
      <Skeleton height={160} borderRadius={12} />
      <View style={{ padding: 12 }}>
        <Skeleton height={18} width="70%" borderRadius={6} style={{ marginBottom: 8 }} />
        <Skeleton height={14} width="50%" borderRadius={6} style={{ marginBottom: 8 }} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Skeleton height={12} width={60} borderRadius={6} />
          <Skeleton height={12} width={60} borderRadius={6} />
        </View>
      </View>
    </View>
  );
}

export function MenuItemSkeleton() {
  return (
    <View style={skeletonStyles.menuItem}>
      <View style={{ flex: 1, marginRight: 12 }}>
        <Skeleton height={16} width="80%" borderRadius={6} style={{ marginBottom: 8 }} />
        <Skeleton height={12} width="90%" borderRadius={6} style={{ marginBottom: 4 }} />
        <Skeleton height={12} width="60%" borderRadius={6} style={{ marginBottom: 12 }} />
        <Skeleton height={16} width={60} borderRadius={6} />
      </View>
      <Skeleton width={90} height={90} borderRadius={12} />
    </View>
  );
}

export function OrderCardSkeleton() {
  return (
    <View style={skeletonStyles.orderCard}>
      <View style={{ flexDirection: 'row', marginBottom: 12 }}>
        <Skeleton width={50} height={50} borderRadius={12} style={{ marginRight: 12 }} />
        <View style={{ flex: 1 }}>
          <Skeleton height={16} width="60%" borderRadius={6} style={{ marginBottom: 6 }} />
          <Skeleton height={12} width="40%" borderRadius={6} />
        </View>
      </View>
      <Skeleton height={1} borderRadius={0} style={{ marginBottom: 12 }} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Skeleton height={14} width={80} borderRadius={6} />
        <Skeleton height={28} width={100} borderRadius={8} />
      </View>
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 12,
    width: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  orderCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
});
