import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@constants/colors';
export function AnalyticsScreen() {
  const navigation = useNavigation<any>();
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark[900]} />
        </TouchableOpacity>
        <Text style={styles.title}>Analytics</Text>
        <View style={{ width: 24 }} />
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: Colors.white }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 }, title: { fontSize: 18, fontWeight: '800', color: Colors.dark[900] } });
