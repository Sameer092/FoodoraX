import React, { useState, forwardRef } from 'react';
import {
  View, TextInput, Text, TouchableOpacity,
  StyleSheet, ViewStyle, TextStyle, TextInputProps,
} from 'react-native';
import Animated, { useAnimatedStyle, withTiming, useSharedValue, interpolateColor } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@constants/colors';
import { Theme } from '@constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  isPassword?: boolean;
}

export const Input = forwardRef<TextInput, InputProps>(({
  label, error, hint, leftIcon, rightIcon,
  containerStyle, inputStyle, isPassword, ...props
}, ref) => {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const focusAnim = useSharedValue(0);

  const handleFocus = () => {
    setFocused(true);
    focusAnim.value = withTiming(1, { duration: 200 });
    props.onFocus?.(null as any);
  };

  const handleBlur = () => {
    setFocused(false);
    focusAnim.value = withTiming(0, { duration: 200 });
    props.onBlur?.(null as any);
  };

  const borderStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      focusAnim.value,
      [0, 1],
      [error ? Colors.status.error : Colors.light.border, Colors.primary[500]]
    ),
  }));

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <Animated.View style={[styles.inputContainer, borderStyle, error && styles.errorBorder]}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

        <TextInput
          ref={ref}
          style={[styles.input, inputStyle]}
          placeholderTextColor={Colors.light.placeholder}
          secureTextEntry={isPassword && !showPassword}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />

        {isPassword && (
          <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={styles.rightIcon}>
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={Colors.light.textTertiary}
            />
          </TouchableOpacity>
        )}

        {rightIcon && !isPassword && <View style={styles.rightIcon}>{rightIcon}</View>}
      </Animated.View>

      {error && <Text style={styles.error}>{error}</Text>}
      {hint && !error && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
});

Input.displayName = 'Input';

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.dark[700],
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    paddingHorizontal: 14,
    minHeight: 52,
  },
  errorBorder: { borderColor: Colors.status.error },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.dark[900],
    paddingVertical: 0,
  },
  leftIcon: { marginRight: 10 },
  rightIcon: { marginLeft: 10 },
  error: { fontSize: 12, color: Colors.status.error, marginTop: 4 },
  hint: { fontSize: 12, color: Colors.light.textTertiary, marginTop: 4 },
});
