import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { OrderStatus } from '@types/index';
import { Colors } from '@constants/colors';

const STATUS_CONFIG: Record<OrderStatus, { label: string; icon: string; color: string; bg: string }> = {
  pending:   { label: 'Pending',    icon: 'time-outline',          color: '#92400e', bg: '#fef3c7' },
  accepted:  { label: 'Accepted',   icon: 'checkmark-circle-outline', color: '#1e40af', bg: '#dbeafe' },
  preparing: { label: 'Preparing',  icon: 'restaurant-outline',    color: '#5b21b6', bg: '#ede9fe' },
  ready:     { label: 'Ready',      icon: 'bag-check-outline',     color: '#065f46', bg: '#d1fae5' },
  picked_up: { label: 'On the way', icon: 'bicycle-outline',       color: '#0f766e', bg: '#ccfbf1' },
  delivered: { label: 'Delivered',  icon: 'checkmark-done-circle', color: '#065f46', bg: '#d1fae5' },
  cancelled: { label: 'Cancelled',  icon: 'close-circle-outline',  color: '#7f1d1d', bg: '#fee2e2' },
  refunded:  { label: 'Refunded',   icon: 'return-down-back-outline', color: '#374151', bg: '#f3f4f6' },
};

interface OrderStatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md';
}

export function OrderStatusBadge({ status, size = 'md' }: OrderStatusBadgeProps) {
  const cfg = STATUS_CONFIG[status];
  if (!cfg) return null;

  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }, size === 'sm' && styles.sm]}>
      <Ionicons name={cfg.icon as any} size={size === 'sm' ? 12 : 14} color={cfg.color} />
      <Text style={[styles.label, { color: cfg.color }, size === 'sm' && styles.labelSm]}>
        {cfg.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  sm: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7 },
  label: { fontSize: 13, fontWeight: '600' },
  labelSm: { fontSize: 11 },
});
