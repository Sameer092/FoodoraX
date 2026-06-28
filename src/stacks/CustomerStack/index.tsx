import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/Ionicons';
import colors from '@colors';
import { wp } from '@utils/utilities';
import Home from '@routes/Customer/Home';
import Search from '@routes/Customer/Search';
import Orders from '@routes/Customer/Orders';
import Favorites from '@routes/Customer/Favorites';
import Profile from '@routes/Customer/Profile';
import RestaurantDetail from '@routes/Customer/RestaurantDetail';
import Cart from '@routes/Customer/Cart';
import Checkout from '@routes/Customer/Checkout';
import OrderTracking from '@routes/Customer/OrderTracking';
import OrderDetail from '@routes/Customer/OrderDetail';
import ReviewOrder from '@routes/Customer/ReviewOrder';
import Notifications from '@routes/Customer/Notifications';
import EditProfile from '@routes/Customer/EditProfile';
import AddAddress from '@routes/Customer/AddAddress';
import Chat from '@routes/Customer/Chat';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const ICONS = { Home: 'home', Search: 'search', Orders: 'receipt', Favorites: 'heart', Profile: 'person' };

function CustomerTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.txtTertiary,
        tabBarStyle: {
          borderTopColor: colors.border,
          height: wp(15) + insets.bottom,
          paddingBottom: insets.bottom + wp(1.5),
          paddingTop: wp(1.5),
        },
        tabBarLabelStyle: { fontSize: wp(2.7) },
        tabBarIcon: ({ color, focused }) => (
          <Icon name={focused ? ICONS[route.name] : `${ICONS[route.name]}-outline`} size={wp(6)} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="Search" component={Search} />
      <Tab.Screen name="Orders" component={Orders} />
      <Tab.Screen name="Favorites" component={Favorites} />
      <Tab.Screen name="Profile" component={Profile} />
    </Tab.Navigator>
  );
}

function CustomerStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CustomerTabs" component={CustomerTabs} />
      <Stack.Screen name="RestaurantDetail" component={RestaurantDetail} />
      <Stack.Screen name="Cart" component={Cart} />
      <Stack.Screen name="Checkout" component={Checkout} />
      <Stack.Screen name="OrderTracking" component={OrderTracking} />
      <Stack.Screen name="OrderDetail" component={OrderDetail} />
      <Stack.Screen name="ReviewOrder" component={ReviewOrder} />
      <Stack.Screen name="Notifications" component={Notifications} />
      <Stack.Screen name="EditProfile" component={EditProfile} />
      <Stack.Screen name="AddAddress" component={AddAddress} />
      <Stack.Screen name="Chat" component={Chat} />
    </Stack.Navigator>
  );
}

export default CustomerStack;
