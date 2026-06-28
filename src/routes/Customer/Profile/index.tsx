import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { connect } from 'react-redux';
import Icon from '@expo/vector-icons/Ionicons';
import colors from '@colors';
import { Bold, Regular, Medium } from '@fonts';
import { wp, hp } from '@utils/utilities';
import { NameAvatar } from '@components/common';
import * as AuthActions from '@store/Auth/actions';
import * as UserActions from '@store/Users/actions';

const MENU = [
  { icon: 'person-outline', label: 'Edit Profile', route: 'EditProfile' },
  { icon: 'location-outline', label: 'Saved Addresses', route: 'AddAddress', customerOnly: true },
  { icon: 'notifications-outline', label: 'Notifications', route: 'Notifications' },
  { icon: 'help-circle-outline', label: 'Help & Support' },
  { icon: 'shield-outline', label: 'Privacy Policy' },
];

let connectState = (state) => ({ user: state.Auth.auth.get('user') });
let enhancer = connect(connectState, { ...AuthActions, ...UserActions });

function Profile({ navigation, user, signOut, getProfileStats }) {
  const [stats, setStats] = useState([]);

  useEffect(() => {
    if (user) getProfileStats(user).then(setStats);
  }, [user]);

  const onMenu = (item) => {
    if (item.route) navigation.navigate(item.route);
    else Alert.alert(item.label, 'Coming soon!');
  };

  const menu = MENU.filter((item) => !item.customerOnly || (user && user.role === 'customer'));

  const logout = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: hp(14) }}>
        <View style={styles.header}>
          {navigation.canGoBack() ? (
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Icon name="arrow-back" size={wp(5.5)} color={colors.txtDark} />
            </TouchableOpacity>
          ) : null}
          <Text style={styles.title}>Profile</Text>
        </View>

        <View style={styles.userCard}>
          <NameAvatar name={user && user.full_name} uri={user && user.avatar_url} size={wp(22)} />
          <Text style={styles.name}>{user && user.full_name}</Text>
          <Text style={styles.email}>{user && user.email}</Text>
          <View style={styles.roleBadge}><Text style={styles.roleText}>{user && user.role ? user.role.replace('_', ' ') : ''}</Text></View>
        </View>

        <View style={styles.stats}>
          {stats.map((s, i) => (
            <React.Fragment key={s.label}>
              {i > 0 ? <View style={styles.statDivider} /> : null}
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        <View style={styles.menu}>
          {menu.map((item, i) => (
            <TouchableOpacity key={item.label} style={[styles.menuItem, i === menu.length - 1 && styles.menuItemLast]} onPress={() => onMenu(item)}>
              <View style={styles.menuIcon}><Icon name={item.icon} size={wp(5)} color={colors.primary} /></View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Icon name="chevron-forward" size={wp(4)} color={colors.txtTertiary} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logout} onPress={logout}>
          <Icon name="log-out-outline" size={wp(5)} color={colors.danger} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

export default enhancer(Profile);

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(5),
    paddingTop: hp(1.5),
    gap: wp(2.5)
  },
  backBtn: {
    width: wp(9.5),
    height: wp(9.5),
    borderRadius: wp(4.75),
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    fontWeight: Bold,
    fontSize: wp(6.5),
    color: colors.txtDark
  },
  userCard: {
    alignItems: 'center',
    backgroundColor: colors.white,
    margin: wp(5),
    borderRadius: wp(5),
    padding: wp(6)
  },
  name: {
    fontWeight: Bold,
    fontSize: wp(5),
    color: colors.txtDark,
    marginTop: hp(1.5)
  },
  email: {
    fontWeight: Regular,
    fontSize: wp(3.3),
    color: colors.txtSecondary,
    marginTop: 2
  },
  roleBadge: {
    backgroundColor: colors.primarySoft,
    borderRadius: wp(2.5),
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.5),
    marginTop: hp(1)
  },
  roleText: {
    fontWeight: Bold,
    fontSize: wp(3),
    color: colors.primaryDark,
    textTransform: 'capitalize'
  },
  stats: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    marginHorizontal: wp(5),
    borderRadius: wp(4),
    padding: wp(4)
  },
  statItem: {
    flex: 1,
    alignItems: 'center'
  },
  statValue: {
    fontWeight: Bold,
    fontSize: wp(5.5),
    color: colors.txtDark
  },
  statLabel: {
    fontWeight: Regular,
    fontSize: wp(2.9),
    color: colors.txtSecondary,
    marginTop: 2
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border
  },
  menu: {
    backgroundColor: colors.white,
    marginHorizontal: wp(5),
    marginTop: hp(1.5),
    borderRadius: wp(4),
    overflow: 'hidden'
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: wp(4),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border
  },
  menuItemLast: {
    borderBottomWidth: 0
  },
  menuIcon: {
    width: wp(9.5),
    height: wp(9.5),
    borderRadius: wp(3),
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(3.5)
  },
  menuLabel: {
    flex: 1,
    fontWeight: Medium,
    fontSize: wp(3.8),
    color: colors.dark800
  },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    marginHorizontal: wp(5),
    marginTop: hp(1.5),
    borderRadius: wp(4),
    padding: wp(4),
    borderWidth: 1.5,
    borderColor: colors.dangerSoft,
    gap: wp(2.5)
  },
  logoutText: {
    fontWeight: Bold,
    fontSize: wp(3.8),
    color: colors.danger
  }
});
