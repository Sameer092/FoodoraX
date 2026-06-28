import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { connect } from 'react-redux';
import Icon from '@expo/vector-icons/Ionicons';
import colors from '@colors';
import { Bold, Regular, Medium } from '@fonts';
import { wp, hp, greeting } from '@utils/utilities';
import { requestPermission, getCurrentLocation, reverseGeocode } from '@library/location';
import { NameAvatar, Skeleton } from '@components/common';
import RestaurantCard from '@components/RestaurantCard';
import StatusBadge from '@components/common/StatusBadge';
import * as RestaurantActions from '@store/Restaurants/actions';
import * as OrderActions from '@store/Orders/actions';
import * as CommonActions from '@store/Common/actions';

const CATEGORIES = [
  { id: '1', name: 'All', icon: '🍽️' },
  { id: '2', name: 'Burgers', icon: '🍔' },
  { id: '3', name: 'Pizza', icon: '🍕' },
  { id: '4', name: 'Sushi', icon: '🍱' },
  { id: '5', name: 'Mexican', icon: '🌮' },
  { id: '6', name: 'Salads', icon: '🥗' },
  { id: '7', name: 'Desserts', icon: '🍰' },
];

let connectState = (state) => ({
  user: state.Auth.auth.get('user'),
  currentLocation: state.Common.common.get('currentLocation'),
});

let enhancer = connect(connectState, { ...RestaurantActions, ...OrderActions, ...CommonActions });

function Home({ navigation, user, currentLocation, getFeatured, getNearby, getRestaurants, getFavorites, toggleFavorite, getCustomerOrders, setLocation }) {
  const [featured, setFeatured] = useState([]);
  const [all, setAll] = useState([]);
  const [favIds, setFavIds] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCat, setActiveCat] = useState('1');

  const load = useCallback(async () => {
    try {
      const [feat, list] = await Promise.all([getFeatured(), getRestaurants({ isOpen: true })]);
      setFeatured(feat);
      setAll(list.data);
      if (user) {
        const favs = await getFavorites(user.id);
        setFavIds(favs.map((f) => f.restaurant_id));
        const orders = await getCustomerOrders(user.id);
        setActiveOrder(orders.find((o) => !['delivered', 'cancelled', 'refunded'].includes(o.status)));
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    (async () => {
      const granted = await requestPermission();
      if (!granted) return;
      const coords = await getCurrentLocation();
      setLocation(coords);
      setAddress(await reverseGeocode(coords));
    })();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const onFav = async (id) => {
    if (!user) return;
    await toggleFavorite(user.id, id);
    setFavIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.locationRow}>
          <Icon name="location" size={wp(4)} color={colors.primary} />
          <Text style={styles.locationText} numberOfLines={1}>{address || 'Getting location...'}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('Notifications')}>
            <Icon name="notifications-outline" size={wp(5.5)} color={colors.dark800} />
          </TouchableOpacity>
          <NameAvatar name={user && user.full_name} uri={user && user.avatar_url} size={wp(9)} />
        </View>
      </View>

      <ScrollView
        style={styles.body}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <Text style={styles.greeting}>{greeting()}, {user && user.full_name ? user.full_name.split(' ')[0] : ''} 👋</Text>
        <Text style={styles.greetingSub}>What would you like to eat?</Text>

        <TouchableOpacity style={styles.searchBar} onPress={() => navigation.navigate('Search')} activeOpacity={0.8}>
          <Icon name="search" size={wp(4.5)} color={colors.txtTertiary} />
          <Text style={styles.searchPlaceholder}>Search restaurants or food...</Text>
        </TouchableOpacity>

        {activeOrder ? (
          <TouchableOpacity style={styles.activeBanner} onPress={() => navigation.navigate('OrderTracking', { orderId: activeOrder.id })}>
            <View style={styles.activeIcon}><Icon name="bicycle" size={wp(5)} color={colors.white} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.activeTitle}>Order #{activeOrder.order_number}</Text>
              <Text style={styles.activeSub} numberOfLines={1}>{(activeOrder.restaurant && activeOrder.restaurant.name) || 'Your order'} · Tap to track</Text>
            </View>
            <StatusBadge status={activeOrder.status} />
          </TouchableOpacity>
        ) : null}

        <Text style={styles.sectionTitle}>Categories</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catList}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity key={c.id} onPress={() => setActiveCat(c.id)} style={[styles.cat, activeCat === c.id && styles.catActive]}>
              <Text style={styles.catIcon}>{c.icon}</Text>
              <Text style={[styles.catName, activeCat === c.id && styles.catNameActive]}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredList}>
          {loading
            ? [1, 2].map((i) => <Skeleton key={i} width={wp(60)} height={hp(20)} radius={wp(4)} style={{ marginRight: wp(3) }} />)
            : featured.map((r) => (
              <View key={r.id} style={{ width: wp(72), marginRight: wp(3) }}>
                <RestaurantCard restaurant={r} onPress={() => navigation.navigate('RestaurantDetail', { restaurantId: r.id })} onFavorite={() => onFav(r.id)} isFavorite={favIds.includes(r.id)} />
              </View>
            ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>Nearby Restaurants</Text>
        <View style={styles.nearby}>
          {loading
            ? [1, 2, 3].map((i) => <Skeleton key={i} height={hp(12)} radius={wp(4)} style={{ marginBottom: hp(1.5) }} />)
            : all.map((r) => (
              <RestaurantCard key={r.id} restaurant={r} onPress={() => navigation.navigate('RestaurantDetail', { restaurantId: r.id })} onFavorite={() => onFav(r.id)} isFavorite={favIds.includes(r.id)} />
            ))}
        </View>
        <View style={{ height: hp(4) }} />
      </ScrollView>
    </SafeAreaView>
  );
}

export default enhancer(Home);

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.white
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(5),
    paddingVertical: hp(1.2)
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: wp(3)
  },
  locationText: {
    fontWeight: Medium,
    fontSize: wp(3.4),
    color: colors.dark700,
    marginLeft: wp(1)
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3)
  },
  headerBtn: {
    width: wp(9),
    height: wp(9),
    borderRadius: wp(4.5),
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center'
  },
  body: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: wp(5)
  },
  greeting: {
    fontWeight: Bold,
    fontSize: wp(5.5),
    color: colors.txtDark,
    marginTop: hp(2)
  },
  greetingSub: {
    fontWeight: Regular,
    fontSize: wp(3.4),
    color: colors.txtSecondary,
    marginBottom: hp(1.5)
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: wp(3.5),
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.6),
    borderWidth: 1,
    borderColor: colors.border
  },
  searchPlaceholder: {
    flex: 1,
    fontWeight: Regular,
    fontSize: wp(3.6),
    color: colors.placeholder,
    marginLeft: wp(2.5)
  },
  activeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dark900,
    borderRadius: wp(4),
    padding: wp(3.5),
    marginTop: hp(2)
  },
  activeIcon: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(3),
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(3)
  },
  activeTitle: {
    fontWeight: Bold,
    fontSize: wp(3.6),
    color: colors.white
  },
  activeSub: {
    fontWeight: Regular,
    fontSize: wp(3),
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2
  },
  sectionTitle: {
    fontWeight: Bold,
    fontSize: wp(4.6),
    color: colors.txtDark,
    marginTop: hp(2.5),
    marginBottom: hp(1.5)
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  catList: {
    gap: wp(2.5),
    paddingBottom: hp(0.5)
  },
  cat: {
    alignItems: 'center',
    paddingHorizontal: wp(3.5),
    paddingVertical: hp(1.2),
    borderRadius: wp(3.5),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: wp(17)
  },
  catActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  catIcon: {
    fontSize: wp(5.5)
  },
  catName: {
    fontWeight: Medium,
    fontSize: wp(2.8),
    color: colors.dark600,
    marginTop: 2
  },
  catNameActive: {
    color: colors.white
  },
  featuredList: {
    paddingBottom: hp(0.5)
  },
  nearby: {}
});
