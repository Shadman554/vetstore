import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from "react";
import type { CartLine, Product } from "./types";

const STORAGE_KEY = "vetmarket-cart";

interface StoredLine {
  productId: string;
  quantity: number;
}

interface CartContextType {
  lines: CartLine[];
  addToCart: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  subtotal: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function loadStored(): StoredLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredLine[]) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [productsById, setProductsById] = useState<Record<string, Product>>({});
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const stored = loadStored();
    return Object.fromEntries(stored.map((l) => [l.productId, l.quantity]));
  });

  useEffect(() => {
    const stored: StoredLine[] = Object.entries(quantities).map(([productId, quantity]) => ({ productId, quantity }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  }, [quantities]);

  const addToCart = (product: Product, quantity = 1) => {
    setProductsById((prev) => ({ ...prev, [product.id]: product }));
    setQuantities((prev) => ({ ...prev, [product.id]: (prev[product.id] ?? 0) + quantity }));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setQuantities((prev) => ({ ...prev, [productId]: quantity }));
  };

  const removeFromCart = (productId: string) => {
    setQuantities((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  };

  const clearCart = () => {
    setQuantities({});
    setProductsById({});
  };

  const lines = useMemo<CartLine[]>(
    () =>
      Object.entries(quantities)
        .filter(([productId]) => productsById[productId])
        .map(([productId, quantity]) => ({ product: productsById[productId], quantity })),
    [quantities, productsById],
  );

  const subtotal = useMemo(
    () => lines.reduce((sum, l) => sum + (l.product.salePrice ?? l.product.price) * l.quantity, 0),
    [lines],
  );
  const itemCount = useMemo(() => lines.reduce((sum, l) => sum + l.quantity, 0), [lines]);

  return (
    <CartContext.Provider value={{ lines, addToCart, updateQuantity, removeFromCart, clearCart, subtotal, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextType {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
