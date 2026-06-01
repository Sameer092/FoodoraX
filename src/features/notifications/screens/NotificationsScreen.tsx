import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications, useMarkNotificationRead } from '@hooks/useNotifications';
import { EmptyState } from '@components/common/EmptyState';
import { Colors } from '@constants/colors';
import { format } from 'date-fns';
import type { Notification } from '@types/index';

const NOTIFICATION_ICONS: Record<string, string> = {
  order_accepted:  'checkmark-circle',
  order_preparing: 'restaurant',
  order_ready:     'bag-check',
  rider_assigned:  'bicycle',
  rider_nearby:    'locate',
  order_delivered: 'checkmark-done-circle',
  order_cancelled: 'close-circle',
  promotion:       'pricetag',
  system:          'information-circle',
};

const NOTIFICATION_COLORS: Record<string, string> = {
  order_accepted:  Colors.status.info,
  order_preparing: '#7c3aed',
  order_ready:     Colors.status.success,
  rider_assigned:  Colors.primary[500],
  rider_nearby:    Colors.secondary[500],
  order_delivered: Colors.status.success,
  order_cancelled: Colors.status.error,
  promotion:       Colors.status.warning,
  system:          Colors.dark[500],
};

export function NotificationsScreen() {
  const navigation = useNavigation<any>();
  const { data, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();

  const notifications = data?.data ?? [];

  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.item, !item.is_read && styles.itemUnread]}
      onPress={async () => {
        if (!item.is_read) await markRead(item.id);
        if (item.data?.orderId) {
          navigation.navigate('OrderTracking', { orderId: item.data.orderId });
        }
      }}
    >
      <View style={[styles.iconBg, { backgroundColor: `${NOTIFICATION_COLORS[item.type]}20` }]}>
        <Ionicons
          name={(NOTIFICATION_ICONS[item.type] ?? 'notifications') as any}
          size={22}
          color={NOTIFICATION_COLORS[item.type] ?? Colors.dark[500]}
        />
      </View>
      <View style={styles.itemContent}>
        <Text style={[styles.itemTitle, !item.is_read && styles.itemTitleBold]}>{item.title}</Text>
        <Text style={styles.itemBody} numberOfLines={2}>{item.body}</Text>
        <Text style={styles.itemTime}>{format(new Date(item.created_at), 'MMM d, h:mm a')}</Text>
      </View>
      {!item.is_read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark[900]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(n) => n.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState icon="notifications-outline" title="No notifications" description="You're all caught up!" />
        }
      />
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
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.dark[900] },
  list: { padding: 16, gap: 8 },
  item: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: Colors.white, borderRadius: 14, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  itemUnread: { backgroundColor: Colors.primary[50] },
  iconBg: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  itemContent: { flex: 1 },
  itemTitle: { fontSize: 14, color: Colors.dark[900], marginBottom: 3 },
  itemTitleBold: { fontWeight: '700' },
  itemBody: { fontSize: 13, color: Colors.dark[600], lineHeight: 18 },
  itemTime: { fontSize: 11, color: Colors.light.textTertiary, marginTop: 5 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary[500], marginTop: 4, flexShrink: 0 },
});
