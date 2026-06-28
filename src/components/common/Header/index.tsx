import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import colors from '@colors';
import { Bold } from '@fonts';
import { wp, hp } from '@utils/utilities';

function Header({ title, onBack, right }) {
  return (
    <View style={styles.header}>
      {onBack ? (
        <TouchableOpacity onPress={onBack} style={styles.side}>
          <Icon name="arrow-back" size={wp(6)} color={colors.txtDark} />
        </TouchableOpacity>
      ) : (
        <View style={styles.side} />
      )}
      <Text style={styles.title}>{title}</Text>
      <View style={styles.side}>{right}</View>
    </View>
  );
}

export default Header;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(5),
    paddingVertical: hp(1.6),
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border
  },
  side: {
    width: wp(8),
    alignItems: 'flex-start'
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontWeight: Bold,
    fontSize: wp(4.6),
    color: colors.txtDark
  }
});
