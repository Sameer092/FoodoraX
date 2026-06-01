import { create } from 'zustand';
import { subscribeWithSelector, persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Cart, CartItem, MenuItem, Restaurant, PromoCode } from '@types/index';
import { Config } from '@constants/config';

interface CartState {
  cart: Cart | null;
  localItems: LocalCartItem[];
  promoCode: PromoCode | null;
  discountAmount: number;

  setCart: (cart: Cart | null) => void;
  addLocalItem: (item: MenuItem, restaurant: Restaurant) => void;
  updateLocalQuantity: (itemId: string, quantity: number) => void;
  removeLocalItem: (itemId: string) => void;
  setPromoCode: (promo: PromoCode | null) => void;
  setDiscountAmount: (amount: number) => void;
  clearCart: () => void;

  // Computed
  getSubtotal: () => number;
  getTax: () => number;
  getTotal: () => number;
  getItemCount: () => number;
}

export interface LocalCartItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
}

export const useCartStore = create<CartState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        cart: null,
        localItems: [],
        promoCode: null,
        discountAmount: 0,

        setCart: (cart) => set({ cart }),

        addLocalItem: (item, restaurant) => {
          const { localItems } = get();
          const existing = localItems.find((i) => i.menuItem.id === item.id);

          if (existing) {
            set({
              localItems: localItems.map((i) =>
                i.menuItem.id === item.id
                  ? { ...i, quantity: i.quantity + 1 }
                  : i
              ),
            });
          } else {
            set({
              localItems: [
                ...localItems,
                { id: item.id, menuItem: item, quantity: 1 },
              ],
            });
          }
        },

        updateLocalQuantity: (itemId, quantity) => {
          if (quantity <= 0) {
            set({ localItems: get().localItems.filter((i) => i.id !== itemId) });
          } else {
            set({
              localItems: get().localItems.map((i) =>
                i.id === itemId ? { ...i, quantity } : i
              ),
            });
          }
        },

        removeLocalItem: (itemId) =>
          set({ localItems: get().localItems.filter((i) => i.id !== itemId) }),

        setPromoCode: (promoCode) => set({ promoCode }),
        setDiscountAmount: (discountAmount) => set({ discountAmount }),

        clearCart: () =>
          set({ cart: null, localItems: [], promoCode: null, discountAmount: 0 }),

        getSubtotal: () => {
          const { localItems } = get();
          return localItems.reduce(
            (sum, item) => sum + item.menuItem.price * item.quantity,
            0
          );
        },

        getTax: () => get().getSubtotal() * Config.app.taxRate,

        getTotal: () => {
          const { cart, discountAmount } = get();
          const sub = get().getSubtotal();
          const tax = get().getTax();
          const delivery = cart?.restaurant?.delivery_fee ?? 0;
          return sub + tax + delivery - discountAmount;
        },

        getItemCount: () =>
          get().localItems.reduce((sum, item) => sum + item.quantity, 0),
      }),
      {
        name: 'foodorax-cart',
        storage: createJSONStorage(() => AsyncStorage),
        partialize: (state) => ({
          localItems: state.localItems,
          promoCode: state.promoCode,
          discountAmount: state.discountAmount,
        }),
      }
    )
  )
);
