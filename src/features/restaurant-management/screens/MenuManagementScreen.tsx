import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@constants/colors';
export function MenuManagementScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark[900]} />
        </TouchableOpacity>
        <Text style={styles.title}>Menu Management</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AddMenuItem', { restaurantId: route.params.restaurantId })}>
          <Ionicons name="add" size={24} color={Colors.primary[500]} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  title: { fontSize: 18, fontWeight: '800', color: Colors.dark[900] },
});
