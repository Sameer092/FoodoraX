import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import colors from '@colors';
import { Medium } from '@fonts';
import { wp } from '@utils/utilities';

const CONFIG = {
  pending: { label: 'Pending', icon: 'time-outline', color: colors.warningDark, bg: colors.warningSoft },
  accepted: { label: 'Accepted', icon: 'checkmark-circle-outline', color: colors.info, bg: colors.infoSoft },
  preparing: { label: 'Preparing', icon: 'restaurant-outline', color: '#5b21b6', bg: '#ede9fe' },
  ready: { label: 'Ready', icon: 'bag-check-outline', color: colors.successDark, bg: colors.successSoft },
  picked_up: { label: 'On the way', icon: 'bicycle-outline', color: '#0f766e', bg: colors.secondarySoft },
  delivered: { label: 'Delivered', icon: 'checkmark-done-circle', color: colors.successDark, bg: colors.successSoft },
  cancelled: { label: 'Cancelled', icon: 'close-circle-outline', color: '#7f1d1d', bg: colors.dangerSoft },
  refunded: { label: 'Refunded', icon: 'return-down-back-outline', color: colors.dark600, bg: colors.divider },
};

function StatusBadge({ status }) {
  const cfg = CONFIG[status];
  if (!cfg) return null;

  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Icon name={cfg.icon} size={wp(3.2)} color={cfg.color} />
      <Text style={[styles.label, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

export default StatusBadge;

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: wp(2.5),
    paddingHorizontal: wp(2.5),
    paddingVertical: wp(1.3)
  },
  label: {
    fontWeight: Medium,
    fontSize: wp(3),
    marginLeft: wp(1.2)
  }
});
