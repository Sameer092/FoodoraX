import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { connect } from 'react-redux';
import Icon from '@expo/vector-icons/Ionicons';
import colors from '@colors';
import { Bold, Regular } from '@fonts';
import { wp, hp } from '@utils/utilities';
import { format } from 'date-fns';
import { Header, EmptyState } from '@components/common';
import * as NotificationActions from '@store/Notifications/actions';

const ICONS = {
  order_accepted: 'checkmark-circle', order_preparing: 'restaurant', order_ready: 'bag-check',
  rider_assigned: 'bicycle', rider_nearby: 'locate', order_delivered: 'checkmark-done-circle',
  order_cancelled: 'close-circle', promotion: 'pricetag', system: 'information-circle',
};

let connectState = (state) => ({ user: state.Auth.auth.get('user') });
let enhancer = connect(connectState, { ...NotificationActions });

function Notifications({ navigation, user, getNotifications, markAsRead }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (user) getNotifications(user.id).then(setItems);
  }, [user]);

  const onPress = async (item) => {
    if (!item.is_read) {
      await markAsRead(item.id);
      setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n)));
    }
    if (item.data && item.data.orderId) navigation.navigate('OrderTracking', { orderId: item.data.orderId });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Notifications" onBack={() => navigation.goBack()} />
      <FlatList
        data={items}
        keyExtractor={(n) => n.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState icon="notifications-outline" title="No notifications" description="You're all caught up!" />}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.item, !item.is_read && styles.unread]} onPress={() => onPress(item)}>
            <View style={styles.iconBg}><Icon name={ICONS[item.type] || 'notifications'} size={wp(5)} color={colors.primary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.itemTitle, !item.is_read && styles.bold]}>{item.title}</Text>
              <Text style={styles.itemBody} numberOfLines={2}>{item.body}</Text>
              <Text style={styles.itemTime}>{format(new Date(item.created_at), 'MMM d, h:mm a')}</Text>
            </View>
            {!item.is_read ? <View style={styles.dot} /> : null}
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

export default enhancer(Notifications);

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background
  },
  list: {
    padding: wp(5),
    gap: hp(1.2)
  },
  item: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: wp(3.5),
    padding: wp(3.5)
  },
  unread: {
    backgroundColor: colors.primarySoft
  },
  iconBg: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
    backgroundColor: colors.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(3)
  },
  itemTitle: {
    fontWeight: Regular,
    fontSize: wp(3.6),
    color: colors.txtDark
  },
  bold: {
    fontWeight: Bold
  },
  itemBody: {
    fontWeight: Regular,
    fontSize: wp(3.3),
    color: colors.dark600,
    marginTop: 2
  },
  itemTime: {
    fontWeight: Regular,
    fontSize: wp(2.8),
    color: colors.txtTertiary,
    marginTop: hp(0.5)
  },
  dot: {
    width: wp(2),
    height: wp(2),
    borderRadius: wp(1),
    backgroundColor: colors.primary,
    marginTop: hp(0.5)
  }
});
