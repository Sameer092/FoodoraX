import { create } from 'zustand';
import { subscribeWithSelector, persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Coordinates, DeliveryAddress } from '@types/index';

interface AppState {
  colorScheme: 'light' | 'dark' | 'system';
  currentLocation: Coordinates | null;
  selectedAddress: DeliveryAddress | null;
  unreadNotifications: number;
  isOnline: boolean;

  setColorScheme: (scheme: 'light' | 'dark' | 'system') => void;
  setCurrentLocation: (loc: Coordinates | null) => void;
  setSelectedAddress: (addr: DeliveryAddress | null) => void;
  setUnreadNotifications: (count: number) => void;
  decrementUnread: () => void;
  setOnline: (online: boolean) => void;
}

export const useAppStore = create<AppState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        colorScheme: 'system',
        currentLocation: null,
        selectedAddress: null,
        unreadNotifications: 0,
        isOnline: true,

        setColorScheme: (colorScheme) => set({ colorScheme }),
        setCurrentLocation: (currentLocation) => set({ currentLocation }),
        setSelectedAddress: (selectedAddress) => set({ selectedAddress }),
        setUnreadNotifications: (unreadNotifications) => set({ unreadNotifications }),
        decrementUnread: () =>
          set({ unreadNotifications: Math.max(0, get().unreadNotifications - 1) }),
        setOnline: (isOnline) => set({ isOnline }),
      }),
      {
        name: 'foodorax-app',
        storage: createJSONStorage(() => AsyncStorage),
        partialize: (state) => ({
          colorScheme: state.colorScheme,
          selectedAddress: state.selectedAddress,
        }),
      }
    )
  )
);
