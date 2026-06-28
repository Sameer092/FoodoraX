import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { connect } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import colors from '@colors';
import * as AuthActions from '@store/Auth/actions';
import { onAuthStateChange } from '@store/Auth/api';
import AuthStack from '@stacks/AuthStack';
import CustomerStack from '@stacks/CustomerStack';
import OwnerStack from '@stacks/OwnerStack';
import RiderStack from '@stacks/RiderStack';
import AdminStack from '@stacks/AdminStack';

let connectState = (state) => ({
  user: state.Auth.auth.get('user'),
  ready: state.Auth.auth.get('ready'),
});

let connectProps = { ...AuthActions };

let enhancer = connect(connectState, connectProps);

function Main({ user, ready, setUser, loadCurrentUser, getSession }) {
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const session = await getSession();
        if (!mounted) return;
        if (session) await loadCurrentUser();
        else setUser(null);
      } catch {
        if (mounted) setUser(null);
      }
    })();

    const { data } = onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === 'SIGNED_OUT') setUser(null);
      else if (session) setTimeout(() => { if (mounted) loadCurrentUser(); }, 0);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  if (!ready) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const renderStack = () => {
    if (!user) return <AuthStack />;
    if (user.role === 'admin') return <AdminStack />;
    if (user.role === 'restaurant_owner') return <OwnerStack />;
    if (user.role === 'rider') return <RiderStack />;
    return <CustomerStack />;
  };

  return <NavigationContainer>{renderStack()}</NavigationContainer>;
}

export default enhancer(Main);

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white
  }
});
