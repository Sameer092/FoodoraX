import React from 'react';
import {
  TouchableOpacity, Text, ActivityIndicator,
  ViewStyle, TextStyle, StyleSheet, View,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Colors } from '@constants/colors';
import { Theme } from '@constants/theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function Button({
  title, onPress, variant = 'primary', size = 'md',
  loading, disabled, leftIcon, rightIcon, style, textStyle, fullWidth,
}: ButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(scale.value, { damping: 15 }) }],
  }));

  const handlePressIn = () => { scale.value = 0.96; };
  const handlePressOut = () => { scale.value = 1; };

  const containerStyle: ViewStyle[] = [
    styles.base,
    styles[`size_${size}`],
    styles[`variant_${variant}`],
    fullWidth && styles.fullWidth,
    (disabled || loading) && styles.disabled,
    style as ViewStyle,
  ];

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      activeOpacity={0.9}
      style={[animatedStyle, containerStyle]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? Colors.primary[500] : Colors.white} />
      ) : (
        <View style={styles.row}>
          {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
          <Text style={[styles.text, styles[`text_${variant}`], styles[`textSize_${size}`], textStyle]}>
            {title}
          </Text>
          {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
        </View>
      )}
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconLeft: { marginRight: 8 },
  iconRight: { marginLeft: 8 },

  size_sm: { paddingVertical: 8, paddingHorizontal: 16, minHeight: 36 },
  size_md: { paddingVertical: 14, paddingHorizontal: 24, minHeight: 52 },
  size_lg: { paddingVertical: 18, paddingHorizontal: 32, minHeight: 60 },

  variant_primary: {
    backgroundColor: Colors.primary[500],
    shadowColor: Colors.primary[500],
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  variant_secondary: { backgroundColor: Colors.secondary[500] },
  variant_outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.primary[500],
  },
  variant_ghost: { backgroundColor: Colors.primary[50] },
  variant_danger: { backgroundColor: Colors.status.error },

  text: { fontWeight: '700', letterSpacing: 0.3 },
  text_primary: { color: Colors.white },
  text_secondary: { color: Colors.white },
  text_outline: { color: Colors.primary[500] },
  text_ghost: { color: Colors.primary[600] },
  text_danger: { color: Colors.white },

  textSize_sm: { fontSize: 13 },
  textSize_md: { fontSize: 15 },
  textSize_lg: { fontSize: 17 },
});
