import { createContext, useContext, useState, useEffect } from "react";
import { getCartItems } from "@/lib/cart-utils";

const CartContext = createContext<{
  cartCount: number;
  refreshCart: () => void;
}>({
  cartCount: 0,
  refreshCart: () => {},
});

export function CartProvider({ children }: React.PropsWithChildren<{}>) {
  const [cartCount, setCartCount] = useState(0);

  const refreshCart = () => {
    const items = getCartItems();
    setCartCount(items.reduce((sum, item) => sum + (item.quantity || 1), 0));
  };

  useEffect(() => {
    refreshCart();
    window.addEventListener("cartUpdated", refreshCart);
    return () => window.removeEventListener("cartUpdated", refreshCart);
  }, []);

  return (
    <CartContext.Provider value={{ cartCount, refreshCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}