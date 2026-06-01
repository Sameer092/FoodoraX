import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '@services/auth.service';
import { useAuthStore } from '@store/auth.store';
import { Colors } from '@constants/colors';

const MENU_ITEMS = [
  { icon: 'person-outline',    label: 'Edit Profile',         route: 'EditProfile' },
  { icon: 'location-outline',  label: 'Saved Addresses',      route: 'AddAddress' },
  { icon: 'notifications-outline', label: 'Notifications',   route: 'Notifications' },
  { icon: 'heart-outline',     label: 'Favorites',            route: 'Favorites' },
  { icon: 'card-outline',      label: 'Payment Methods',      route: null },
  { icon: 'help-circle-outline', label: 'Help & Support',     route: null },
  { icon: 'shield-outline',    label: 'Privacy Policy',       route: null },
  { icon: 'document-outline',  label: 'Terms of Service',     route: null },
] as const;

export function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => authService.signOut() },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity onPress={() => navigation.navigate('EditProfile')} style={styles.editBtn}>
            <Ionicons name="create-outline" size={20} color={Colors.primary[500]} />
          </TouchableOpacity>
        </View>

        {/* User Card */}
        <View style={styles.userCard}>
          <TouchableOpacity style={styles.avatarWrapper}>
            {user?.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={styles.avatar} contentFit="cover" />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>{user?.full_name?.[0]?.toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.editAvatarBtn}>
              <Ionicons name="camera" size={12} color={Colors.white} />
            </View>
          </TouchableOpacity>
          <Text style={styles.name}>{user?.full_name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          {user?.phone && <Text style={styles.phone}>{user.phone}</Text>}

          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user?.role?.replace('_', ' ')}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>24</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Favorites</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>4.8</Text>
            <Text style={styles.statLabel}>Avg Rating</Text>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.menu}>
          {MENU_ITEMS.map((item, i) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.menuItem, i === MENU_ITEMS.length - 1 && styles.menuItemLast]}
              onPress={() => item.route && navigation.navigate(item.route as any)}
            >
              <View style={styles.menuIcon}>
                <Ionicons name={item.icon as any} size={20} color={Colors.primary[500]} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.light.textTertiary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={Colors.status.error} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>FoodoraX v1.0.0</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4,
  },
  headerTitle: { fontSize: 26, fontWeight: '900', color: Colors.dark[900] },
  editBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.primary[50],
    alignItems: 'center', justifyContent: 'center',
  },
  userCard: {
    alignItems: 'center', backgroundColor: Colors.white,
    marginHorizontal: 16, marginTop: 12, borderRadius: 20,
    padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 5,
  },
  avatarWrapper: { position: 'relative', marginBottom: 14 },
  avatar: { width: 90, height: 90, borderRadius: 45 },
  avatarPlaceholder: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: Colors.primary[500],
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { color: Colors.white, fontSize: 36, fontWeight: '700' },
  editAvatarBtn: {
    position: 'absolute', bottom: 0, right: 0,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: Colors.primary[500],
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.white,
  },
  name: { fontSize: 20, fontWeight: '800', color: Colors.dark[900], marginBottom: 4 },
  email: { fontSize: 13, color: Colors.light.textSecondary, marginBottom: 2 },
  phone: { fontSize: 13, color: Colors.light.textSecondary, marginBottom: 10 },
  roleBadge: {
    backgroundColor: Colors.primary[50], borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 4, marginTop: 4,
  },
  roleText: { fontSize: 12, fontWeight: '700', color: Colors.primary[600], textTransform: 'capitalize' },
  stats: {
    flexDirection: 'row', backgroundColor: Colors.white,
    marginHorizontal: 16, marginTop: 12, borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '900', color: Colors.dark[900] },
  statLabel: { fontSize: 11, color: Colors.light.textSecondary, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: Colors.light.border },
  menu: {
    backgroundColor: Colors.white, marginHorizontal: 16, marginTop: 12,
    borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.light.border,
  },
  menuItemLast: { borderBottomWidth: 0 },
  menuIcon: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: Colors.primary[50],
    alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: Colors.dark[800] },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: Colors.white, marginHorizontal: 16, marginTop: 12,
    borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: '#fee2e2',
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: Colors.status.error },
  version: { textAlign: 'center', fontSize: 12, color: Colors.light.textTertiary, marginTop: 20 },
});
