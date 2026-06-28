import React, { useEffect, useState } from 'react';
import { View, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { connect } from 'react-redux';
import colors from '@colors';
import { wp, hp } from '@utils/utilities';
import { TextField, EmptyState, Header } from '@components/common';
import RestaurantCard from '@components/RestaurantCard';
import * as RestaurantActions from '@store/Restaurants/actions';

let enhancer = connect(null, { ...RestaurantActions });

function Search({ navigation, getRestaurants }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      const res = await getRestaurants({ query });
      setResults(res.data);
      setLoading(false);
    }, 400);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Search" onBack={() => navigation.goBack()} />
      <View style={styles.searchWrap}>
        <TextField placeholder="Search restaurants, cuisine..." value={query} onChangeText={setQuery} icon="search" wrapperStyle={{ marginBottom: 0 }} />
      </View>
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: hp(5) }} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState icon="search-outline" title="No restaurants found" description="Try a different search" />}
          renderItem={({ item }) => (
            <RestaurantCard restaurant={item} onPress={() => navigation.navigate('RestaurantDetail', { restaurantId: item.id })} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

export default enhancer(Search);

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background
  },
  searchWrap: {
    paddingHorizontal: wp(5),
    paddingVertical: hp(1.5),
    backgroundColor: colors.white
  },
  list: {
    padding: wp(5)
  }
});
