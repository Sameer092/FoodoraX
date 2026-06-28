import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { connect } from 'react-redux';
import colors from '@colors';
import { Bold } from '@fonts';
import { wp, hp } from '@utils/utilities';
import { EmptyState } from '@components/common';
import RestaurantCard from '@components/RestaurantCard';
import * as RestaurantActions from '@store/Restaurants/actions';

let connectState = (state) => ({ user: state.Auth.auth.get('user') });
let enhancer = connect(connectState, { ...RestaurantActions });

function Favorites({ navigation, user, getFavorites, toggleFavorite }) {
  const [favorites, setFavorites] = useState([]);

  const load = useCallback(() => {
    if (user) getFavorites(user.id).then((f) => setFavorites(f.filter((x) => x.restaurant_id)));
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onFav = async (id) => {
    await toggleFavorite(user.id, id);
    setFavorites((prev) => prev.filter((f) => f.restaurant_id !== id));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text style={styles.title}>Favorites</Text>
      <FlatList
        data={favorites}
        keyExtractor={(f) => f.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState icon="heart-outline" title="No favorites yet" description="Save restaurants you love and they'll appear here" />}
        renderItem={({ item }) => (
          item.restaurant ? (
            <RestaurantCard restaurant={item.restaurant} onPress={() => navigation.navigate('RestaurantDetail', { restaurantId: item.restaurant_id })} onFavorite={() => onFav(item.restaurant_id)} isFavorite />
          ) : null
        )}
      />
    </SafeAreaView>
  );
}

export default enhancer(Favorites);

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background
  },
  title: {
    fontWeight: Bold,
    fontSize: wp(6.5),
    color: colors.txtDark,
    paddingHorizontal: wp(5),
    paddingTop: hp(1.5),
    paddingBottom: hp(1)
  },
  list: {
    padding: wp(5)
  }
});
