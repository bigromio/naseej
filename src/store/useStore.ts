import { create } from 'zustand';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin' | 'workshop';
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  width?: number;
  length?: number;
  image: string;
}

interface AppState {
  language: 'ar' | 'en';
  setLanguage: (lang: 'ar' | 'en') => void;
  user: User | null;
  setUser: (user: User | null) => void;
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}

export const useStore = create<AppState>((set) => ({
  language: 'ar',
  setLanguage: (lang) => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    set({ language: lang });
  },
  user: null,
  setUser: (user) => set({ user }),
  cart: [],
  addToCart: (item) => set((state) => {
    const existing = state.cart.find(i => i.id === item.id);
    if (existing) {
      return { cart: state.cart.map(i => i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i) };
    }
    return { cart: [...state.cart, item] };
  }),
  removeFromCart: (id) => set((state) => ({ cart: state.cart.filter(i => i.id !== id) })),
  updateQuantity: (id, quantity) => set((state) => ({ cart: state.cart.map(i => i.id === id ? { ...i, quantity } : i) })),
  clearCart: () => set({ cart: [] }),
}));
