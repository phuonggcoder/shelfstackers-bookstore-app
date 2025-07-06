import React, { createContext, useCallback, useContext, useState } from 'react';
import { getCart } from '../services/api';

interface CartContextType {
  cartCount: number;
  setCartCount: (n: number) => void;
  cartJustAdded: boolean;
  setCartJustAdded: (b: boolean) => void;
  fetchCartCount: (token?: string) => Promise<void>;
  hasFetched: boolean;
  setHasFetched: (b: boolean) => void;
}

const CartContext = createContext<CartContextType>({
  cartCount: 0,
  setCartCount: () => {},
  cartJustAdded: false,
  setCartJustAdded: () => {},
  fetchCartCount: async () => {},
  hasFetched: false,
  setHasFetched: () => {},
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartCount, setCartCount] = useState(0);
  const [cartJustAdded, setCartJustAdded] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchCartCount = useCallback(async (token?: string) => {
    if (!token) return;
    try {
      const cart = await getCart(token);
      // Tổng quantity các item
      const count = Array.isArray(cart.items)
        ? cart.items.reduce((sum, item) => sum + (item.quantity || 1), 0)
        : 0;
      setCartCount(count);
      setHasFetched(true);
    } catch {
      setCartCount(0);
      setHasFetched(true);
    }
  }, []);

  return (
    <CartContext.Provider value={{ cartCount, setCartCount, cartJustAdded, setCartJustAdded, fetchCartCount, hasFetched, setHasFetched }}>
      {children}
    </CartContext.Provider>
  );
}
export const useCart = () => useContext(CartContext); 