import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import colors from '@colors';
import { Bold } from '@fonts';
import { getInitials } from '@utils/utilities';

function NameAvatar({ name, uri, size = 44, style }) {
  const dimension = { width: size, height: size, borderRadius: size / 2 };

  if (uri) {
    return <Image source={{ uri }} style={[dimension, style]} contentFit="cover" />;
  }

  return (
    <View style={[styles.placeholder, dimension, style]}>
      <Text style={[styles.initials, { fontSize: size * 0.4 }]}>{getInitials(name)}</Text>
    </View>
  );
}

export default NameAvatar;

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  initials: {
    fontWeight: Bold,
    color: colors.white
  }
});
