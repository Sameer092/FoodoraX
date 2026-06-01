import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import type { MenuItem } from '@types/index';
import { Colors } from '@constants/colors';

interface MenuItemCardProps {
  item: MenuItem;
  onAdd: () => void;
  onRemove?: () => void;
  quantity?: number;
}

export function MenuItemCard({ item, onAdd, onRemove, quantity = 0 }: MenuItemCardProps) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(scale.value) }],
  }));

  const effectivePrice = item.discounted_price ?? item.price;

  return (
    <Animated.View style={[styles.card, animStyle]}>
      <View style={styles.info}>
        <View style={styles.badges}>
          {item.is_vegetarian && (
            <View style={[styles.badge, { backgroundColor: '#dcfce7' }]}>
              <Text style={[styles.badgeText, { color: '#166534' }]}>Veg</Text>
            </View>
          )}
          {item.is_spicy && (
            <View style={[styles.badge, { backgroundColor: '#fef3c7' }]}>
              <Text style={[styles.badgeText, { color: '#92400e' }]}>🌶 Spicy</Text>
            </View>
          )}
          {!item.is_available && (
            <View style={[styles.badge, { backgroundColor: Colors.dark[100] }]}>
              <Text style={[styles.badgeText, { color: Colors.dark[500] }]}>Unavailable</Text>
            </View>
          )}
        </View>

        <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
        {item.description && (
          <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
        )}

        <View style={styles.footer}>
          <View style={styles.priceRow}>
            <Text style={styles.price}>${effectivePrice.toFixed(2)}</Text>
            {item.discounted_price && (
              <Text style={styles.originalPrice}>${item.price.toFixed(2)}</Text>
            )}
          </View>

          {item.is_available && (
            <View style={styles.quantityControl}>
              {quantity > 0 ? (
                <>
                  <TouchableOpacity
                    onPress={() => { scale.value = 0.9; onRemove?.(); setTimeout(() => { scale.value = 1; }, 150); }}
                    style={styles.qtyBtn}
                  >
                    <Ionicons name="remove" size={16} color={Colors.primary[500]} />
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{quantity}</Text>
                  <TouchableOpacity
                    onPress={() => { scale.value = 0.9; onAdd(); setTimeout(() => { scale.value = 1; }, 150); }}
                    style={styles.qtyBtn}
                  >
                    <Ionicons name="add" size={16} color={Colors.primary[500]} />
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  onPress={() => { scale.value = 0.85; onAdd(); setTimeout(() => { scale.value = 1; }, 150); }}
                  style={styles.addBtn}
                >
                  <Ionicons name="add" size={18} color={Colors.white} />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>

      {item.image_url && (
        <View style={styles.imageWrapper}>
          <Image source={{ uri: item.image_url }} style={styles.image} contentFit="cover" />
          {item.is_featured && (
            <View style={styles.featuredDot} />
          )}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.border,
  },
  info: { flex: 1, marginRight: 12 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 6 },
  badge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { fontSize: 10, fontWeight: '600' },
  name: { fontSize: 15, fontWeight: '700', color: Colors.dark[900], marginBottom: 4, lineHeight: 20 },
  description: { fontSize: 12, color: Colors.light.textSecondary, lineHeight: 17, marginBottom: 10 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  price: { fontSize: 16, fontWeight: '800', color: Colors.primary[600] },
  originalPrice: {
    fontSize: 12, color: Colors.light.textTertiary,
    textDecorationLine: 'line-through',
  },
  quantityControl: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 1.5, borderColor: Colors.primary[500],
    alignItems: 'center', justifyContent: 'center',
  },
  qtyText: { fontSize: 15, fontWeight: '700', color: Colors.dark[900], minWidth: 20, textAlign: 'center' },
  addBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.primary[500],
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  imageWrapper: { position: 'relative' },
  image: { width: 90, height: 90, borderRadius: 12 },
  featuredDot: {
    position: 'absolute', top: -3, right: -3,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: Colors.primary[500],
    borderWidth: 2, borderColor: Colors.white,
  },
});
