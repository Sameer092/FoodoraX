import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import colors from '@colors';
import { Bold, Regular } from '@fonts';
import { wp, hp } from '@utils/utilities';
import Button from '@components/common/Button';

function EmptyState({ icon = 'search-outline', title, description, actionLabel, onAction }) {
  return (
    <View style={styles.container}>
      <View style={styles.circle}>
        <Icon name={icon} size={wp(11)} color={colors.primaryLight} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} buttonStyle={styles.button} />
      ) : null}
    </View>
  );
}

export default EmptyState;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: wp(10)
  },
  circle: {
    width: wp(24),
    height: wp(24),
    borderRadius: wp(12),
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(2.5)
  },
  title: {
    fontWeight: Bold,
    fontSize: wp(4.6),
    color: colors.txtDark,
    textAlign: 'center',
    marginBottom: hp(1)
  },
  description: {
    fontWeight: Regular,
    fontSize: wp(3.6),
    color: colors.txtSecondary,
    textAlign: 'center',
    lineHeight: hp(2.6),
    marginBottom: hp(3)
  },
  button: {
    paddingHorizontal: wp(8)
  }
});
