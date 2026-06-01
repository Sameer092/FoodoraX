import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@constants/colors';
export function EarningsScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.title}>Earnings History</Text>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: Colors.white, padding: 20 }, title: { fontSize: 24, fontWeight: '800', color: Colors.dark[900] } });
