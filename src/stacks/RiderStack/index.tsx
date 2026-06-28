import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RiderDashboard from '@routes/Rider/Dashboard';
import ActiveDelivery from '@routes/Rider/ActiveDelivery';
import Earnings from '@routes/Rider/Earnings';
import Profile from '@routes/Customer/Profile';
import EditProfile from '@routes/Customer/EditProfile';
import Notifications from '@routes/Customer/Notifications';
import Chat from '@routes/Customer/Chat';

const Stack = createNativeStackNavigator();

function RiderStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="RiderDashboard" component={RiderDashboard} />
      <Stack.Screen name="ActiveDelivery" component={ActiveDelivery} />
      <Stack.Screen name="Earnings" component={Earnings} />
      <Stack.Screen name="Profile" component={Profile} />
      <Stack.Screen name="EditProfile" component={EditProfile} />
      <Stack.Screen name="Notifications" component={Notifications} />
      <Stack.Screen name="Chat" component={Chat} />
    </Stack.Navigator>
  );
}

export default RiderStack;
