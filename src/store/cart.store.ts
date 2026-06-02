import { create } from 'zustand';
import { subscribeWithSelector, persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MenuItem, Restaurant, PromoCode } from '@types/index';
import { Config } from '@constants/config';

export interface LocalCartItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
}

interface CartState {
  restaurant: Restaurant | null;
  localItems: LocalCartItem[];
  promoCode: PromoCode | null;
  discountAmount: number;

  addLocalItem: (item: MenuItem, restaurant: Restaurant) => void;
  updateLocalQuantity: (itemId: string, quantity: number) => void;
  removeLocalItem: (itemId: string) => void;
  setPromoCode: (promo: PromoCode | null) => void;
  setDiscountAmount: (amount: number) => void;
  clearCart: () => void;

  // Computed
  getDeliveryFee: () => number;
  getSubtotal: () => number;
  getTax: () => number;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        restaurant: null,
        localItems: [],
        promoCode: null,
        discountAmount: 0,

        addLocalItem: (item, restaurant) => {
          const { localItems } = get();
          const existing = localItems.find((i) => i.menuItem.id === item.id);

          if (existing) {
            set({
              restaurant,
              localItems: localItems.map((i) =>
                i.menuItem.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
              ),
            });
          } else {
            set({
              restaurant,
              localItems: [...localItems, { id: item.id, menuItem: item, quantity: 1 }],
            });
          }
        },

        updateLocalQuantity: (itemId, quantity) => {
          if (quantity <= 0) {
            const remaining = get().localItems.filter((i) => i.id !== itemId);
            set({ localItems: remaining, restaurant: remaining.length ? get().restaurant : null });
          } else {
            set({
              localItems: get().localItems.map((i) =>
                i.id === itemId ? { ...i, quantity } : i
              ),
            });
          }
        },

        removeLocalItem: (itemId) => {
          const remaining = get().localItems.filter((i) => i.id !== itemId);
          set({ localItems: remaining, restaurant: remaining.length ? get().restaurant : null });
        },

        setPromoCode: (promoCode) => set({ promoCode }),
        setDiscountAmount: (discountAmount) => set({ discountAmount }),

        clearCart: () =>
          set({ restaurant: null, localItems: [], promoCode: null, discountAmount: 0 }),

        getDeliveryFee: () => get().restaurant?.delivery_fee ?? 0,

        getSubtotal: () =>
          get().localItems.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0),

        getTax: () => get().getSubtotal() * Config.app.taxRate,

        getTotal: () => {
          const sub = get().getSubtotal();
          const tax = get().getTax();
          const delivery = get().getDeliveryFee();
          return Math.max(0, sub + tax + delivery - get().discountAmount);
        },

        getItemCount: () =>
          get().localItems.reduce((sum, item) => sum + item.quantity, 0),
      }),
      {
        name: 'foodorax-cart',
        storage: createJSONStorage(() => AsyncStorage),
        partialize: (state) => ({
          restaurant: state.restaurant,
          localItems: state.localItems,
          promoCode: state.promoCode,
          discountAmount: state.discountAmount,
        }),
      }
    )
  )
);
