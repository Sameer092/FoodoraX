import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './Button';
import { Colors } from '@constants/colors';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon = 'search-outline', title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrapper}>
        <Ionicons name={icon as any} size={48} color={Colors.primary[400]} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
      {actionLabel && onAction && (
        <Button title={actionLabel} onPress={onAction} style={styles.button} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: 40 },
  iconWrapper: {
    width: 96, height: 96,
    borderRadius: 48,
    backgroundColor: Colors.primary[50],
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18, fontWeight: '700',
    color: Colors.dark[900], textAlign: 'center', marginBottom: 8,
  },
  description: {
    fontSize: 14, color: Colors.light.textSecondary,
    textAlign: 'center', lineHeight: 20, marginBottom: 24,
  },
  button: { marginTop: 8, paddingHorizontal: 32 },
});
