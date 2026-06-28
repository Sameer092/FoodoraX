import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import OwnerDashboard from '@routes/Owner/Dashboard';
import OrderManagement from '@routes/Owner/OrderManagement';
import MenuManagement from '@routes/Owner/MenuManagement';
import AddMenuItem from '@routes/Owner/AddMenuItem';
import EditMenuItem from '@routes/Owner/EditMenuItem';
import CreateRestaurant from '@routes/Owner/CreateRestaurant';
import Analytics from '@routes/Owner/Analytics';
import RestaurantSettings from '@routes/Owner/RestaurantSettings';
import Profile from '@routes/Customer/Profile';
import EditProfile from '@routes/Customer/EditProfile';
import Notifications from '@routes/Customer/Notifications';
import Chat from '@routes/Customer/Chat';

const Stack = createNativeStackNavigator();

function OwnerStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OwnerDashboard" component={OwnerDashboard} />
      <Stack.Screen name="OrderManagement" component={OrderManagement} />
      <Stack.Screen name="MenuManagement" component={MenuManagement} />
      <Stack.Screen name="AddMenuItem" component={AddMenuItem} />
      <Stack.Screen name="EditMenuItem" component={EditMenuItem} />
      <Stack.Screen name="CreateRestaurant" component={CreateRestaurant} />
      <Stack.Screen name="Analytics" component={Analytics} />
      <Stack.Screen name="RestaurantSettings" component={RestaurantSettings} />
      <Stack.Screen name="Profile" component={Profile} />
      <Stack.Screen name="EditProfile" component={EditProfile} />
      <Stack.Screen name="Notifications" component={Notifications} />
      <Stack.Screen name="Chat" component={Chat} />
    </Stack.Navigator>
  );
}

export default OwnerStack;
