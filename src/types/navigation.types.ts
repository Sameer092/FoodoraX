import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp, RouteProp } from '@react-navigation/native';

// ─── Auth Stack ────────────────────────────────────────────────
export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  OtpVerification: { email: string };
  RoleSelect: undefined;
};

// ─── Customer Bottom Tabs ──────────────────────────────────────
export type CustomerTabParamList = {
  Home: undefined;
  Search: undefined;
  Orders: undefined;
  Favorites: undefined;
  Profile: undefined;
};

// ─── Customer Stack ────────────────────────────────────────────
export type CustomerStackParamList = {
  CustomerTabs: undefined;
  RestaurantDetail: { restaurantId: string };
  Cart: undefined;
  Checkout: undefined;
  OrderTracking: { orderId: string };
  OrderDetail: { orderId: string };
  AddressSelection: { returnTo?: string };
  AddAddress: { editId?: string };
  ReviewOrder: { orderId: string };
  Notifications: undefined;
  EditProfile: undefined;
  Chat: { orderId: string; otherName?: string };
};

// ─── Restaurant Owner Stack ────────────────────────────────────
export type RestaurantOwnerStackParamList = {
  OwnerDashboard: undefined;
  MenuManagement: { restaurantId: string };
  AddMenuItem: { restaurantId: string; categoryId?: string };
  EditMenuItem: { restaurantId: string; itemId: string };
  OrderManagement: { restaurantId: string; restaurantIds?: string[] };
  OrderDetail: { orderId: string };
  RestaurantSettings: { restaurantId: string };
  CreateRestaurant: undefined;
  EditRestaurant: { restaurantId: string };
  Analytics: { restaurantId: string };
  Profile: undefined;
  EditProfile: undefined;
  AddAddress: { editId?: string };
  Notifications: undefined;
};

// ─── Rider Stack ───────────────────────────────────────────────
export type RiderStackParamList = {
  RiderDashboard: undefined;
  DeliveryDetail: { orderId: string };
  ActiveDelivery: { orderId: string };
  EarningsHistory: undefined;
  RiderProfile: undefined;
  EditProfile: undefined;
  AddAddress: { editId?: string };
  Notifications: undefined;
  Chat: { orderId: string; otherName?: string };
};

// ─── Admin Stack ───────────────────────────────────────────────
export type AdminStackParamList = {
  AdminDashboard: undefined;
  ManageRestaurants: undefined;
  ManageRiders: undefined;
  ManageUsers: undefined;
  PlatformSettings: undefined;
  AdminOrders: undefined;
};

// ─── Root Stack ────────────────────────────────────────────────
export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Customer: undefined;
  RestaurantOwner: undefined;
  Admin: undefined;
  Rider: undefined;
};

// ─── Navigation Props ──────────────────────────────────────────
export type CustomerStackNavigationProp = NativeStackNavigationProp<CustomerStackParamList>;
export type AuthStackNavigationProp = NativeStackNavigationProp<AuthStackParamList>;
export type RiderStackNavigationProp = NativeStackNavigationProp<RiderStackParamList>;
export type RestaurantOwnerStackNavigationProp = NativeStackNavigationProp<RestaurantOwnerStackParamList>;
