import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import Icon from '@expo/vector-icons/Ionicons';
import colors from '@colors';
import { Bold, Regular } from '@fonts';
import { wp, hp, currency } from '@utils/utilities';

function MenuItemCard({ item, quantity = 0, onAdd, onRemove }) {
  return (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
        {item.description ? <Text style={styles.desc} numberOfLines={2}>{item.description}</Text> : null}
        <View style={styles.footer}>
          <Text style={styles.price}>{currency(item.price)}</Text>
          {item.is_available ? (
            quantity > 0 ? (
              <View style={styles.qtyRow}>
                <TouchableOpacity onPress={onRemove} style={styles.qtyBtn}>
                  <Icon name="remove" size={wp(4)} color={colors.primary} />
                </TouchableOpacity>
                <Text style={styles.qty}>{quantity}</Text>
                <TouchableOpacity onPress={onAdd} style={styles.qtyBtn}>
                  <Icon name="add" size={wp(4)} color={colors.primary} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={onAdd} style={styles.addBtn}>
                <Icon name="add" size={wp(4.5)} color={colors.white} />
              </TouchableOpacity>
            )
          ) : (
            <Text style={styles.unavailable}>Unavailable</Text>
          )}
        </View>
      </View>
      {item.image_url ? <Image source={{ uri: item.image_url }} style={styles.image} contentFit="cover" /> : null}
    </View>
  );
}

export default MenuItemCard;

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    paddingVertical: hp(2),
    paddingHorizontal: wp(5),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border
  },
  info: {
    flex: 1,
    marginRight: wp(3)
  },
  name: {
    fontWeight: Bold,
    fontSize: wp(3.9),
    color: colors.txtDark,
    marginBottom: hp(0.5)
  },
  desc: {
    fontWeight: Regular,
    fontSize: wp(3.2),
    color: colors.txtSecondary,
    lineHeight: hp(2.3),
    marginBottom: hp(1.2)
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  price: {
    fontWeight: Bold,
    fontSize: wp(4),
    color: colors.primaryDark
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  qtyBtn: {
    width: wp(7),
    height: wp(7),
    borderRadius: wp(3.5),
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  qty: {
    fontWeight: Bold,
    fontSize: wp(3.8),
    color: colors.txtDark,
    marginHorizontal: wp(3)
  },
  addBtn: {
    width: wp(8),
    height: wp(8),
    borderRadius: wp(4),
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  unavailable: {
    fontWeight: Regular,
    fontSize: wp(3.2),
    color: colors.txtTertiary
  },
  image: {
    width: wp(22),
    height: wp(22),
    borderRadius: wp(3)
  }
});
