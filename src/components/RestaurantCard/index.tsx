import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import Icon from '@expo/vector-icons/Ionicons';
import colors from '@colors';
import { Bold, Regular } from '@fonts';
import { wp, hp, currency } from '@utils/utilities';

function RestaurantCard({ restaurant, onPress, onFavorite, isFavorite }) {
  const image =
    (restaurant.images && (restaurant.images.find((i) => i.is_primary) || restaurant.images[0]) || {}).url ||
    restaurant.cover_url ||
    restaurant.logo_url;
  const rating = restaurant.avg_rating || 0;
  const fee = restaurant.delivery_fee || 0;
  const time = restaurant.delivery_time || 0;

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.card}>
      <Image source={{ uri: image || '' }} style={styles.image} contentFit="cover" />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{restaurant.name}</Text>
        <Text style={styles.cuisine} numberOfLines={1}>{(restaurant.cuisine_type || []).join(' · ')}</Text>
        <View style={styles.metaRow}>
          <Icon name="star" size={wp(3.2)} color={colors.golden} />
          <Text style={styles.meta}>{rating.toFixed(1)}</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.meta}>{time} min</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={[styles.meta, fee === 0 && styles.free]}>{fee === 0 ? 'Free' : currency(fee)}</Text>
        </View>
      </View>
      {onFavorite ? (
        <TouchableOpacity onPress={onFavorite} hitSlop={8} style={styles.fav}>
          <Icon name={isFavorite ? 'heart' : 'heart-outline'} size={wp(5)} color={isFavorite ? colors.danger : colors.txtSecondary} />
        </TouchableOpacity>
      ) : null}
    </TouchableOpacity>
  );
}

export default RestaurantCard;

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: wp(4),
    marginBottom: hp(1.5),
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3
  },
  image: {
    width: wp(25),
    height: wp(25)
  },
  info: {
    flex: 1,
    padding: wp(3),
    justifyContent: 'center'
  },
  name: {
    fontWeight: Bold,
    fontSize: wp(4),
    color: colors.txtDark,
    marginBottom: hp(0.4)
  },
  cuisine: {
    fontWeight: Regular,
    fontSize: wp(3.2),
    color: colors.txtSecondary,
    marginBottom: hp(0.8)
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  meta: {
    fontWeight: Regular,
    fontSize: wp(3.2),
    color: colors.txtSecondary,
    marginLeft: wp(1)
  },
  dot: {
    color: colors.txtTertiary,
    marginHorizontal: wp(1.5)
  },
  free: {
    color: colors.success
  },
  fav: {
    padding: wp(3),
    justifyContent: 'center'
  }
});
