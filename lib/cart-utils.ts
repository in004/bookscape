import type { CartItem } from "@/types";
import { toast } from "sonner";

const CART_KEY = "bookscape_cart";

// Get items from localStorage
export const getCartItems = (): CartItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const cartData = localStorage.getItem(CART_KEY);
    return cartData ? JSON.parse(cartData) : [];
  } catch (error) {
    console.error("Error getting cart items from localStorage:", error);
    return [];
  }
};

// Save items to localStorage and notify app
const saveCartItems = (cartItems: CartItem[]): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cartItems));
    window.dispatchEvent(new Event("cartUpdated"));
  } catch (error) {
    console.error("Error saving cart items to localStorage:", error);
  }
};

// Add item or increase quantity
export const addToCart = (
  itemToAdd: Omit<CartItem, "quantity">
): boolean => {
  if (typeof window === "undefined") return false;

  try {
    const cartItems = getCartItems();
    const existingItemIndex = cartItems.findIndex(
      (cartItem) => cartItem.id === itemToAdd.id
    );

    if (existingItemIndex !== -1) {
      const existingItem = cartItems[existingItemIndex];
      const newQuantity = existingItem.quantity + 1;
      const currentStock = itemToAdd.stock;

      if (currentStock !== undefined && newQuantity > currentStock) {
        toast.error(
          `Max stock for "${itemToAdd.title}" reached (${currentStock}). Cannot add more.`
        );
        return false;
      }

      cartItems[existingItemIndex].quantity = newQuantity;
      if (itemToAdd.stock !== undefined) {
        cartItems[existingItemIndex].stock = itemToAdd.stock;
      }
    } else {
      if (itemToAdd.stock !== undefined && itemToAdd.stock <= 0) {
        toast.error(`"${itemToAdd.title}" is out of stock.`);
        return false;
      }

      cartItems.push({
        id: itemToAdd.id,
        title: itemToAdd.title,
        author: itemToAdd.author,
        price: itemToAdd.price,
        quantity: 1,
        cover: itemToAdd.cover,
        stock: itemToAdd.stock,
      });
    }

    saveCartItems(cartItems);
    return true;
  } catch (error) {
    console.error("Error adding item to cart:", error);
    toast.error("Could not add item to cart. Please try again.");
    return false;
  }
};

// Update item quantity
export const updateCartItemQuantity = (id: string, newQuantity: number): boolean => {
  if (typeof window === "undefined") return false;

  const cartItems = getCartItems();
  const itemIndex = cartItems.findIndex((item) => item.id === id);

  if (itemIndex === -1) {
    console.warn(`Item with id ${id} not found in cart for quantity update.`);
    toast.error("Item not found in cart to update quantity.");
    return false;
  }

  const itemToUpdate = cartItems[itemIndex];

  if (newQuantity <= 0) {
    return removeFromCart(id);
  }

  if (typeof itemToUpdate.stock === 'number') {
    if (newQuantity > itemToUpdate.stock) {
      cartItems[itemIndex].quantity = itemToUpdate.stock;
      saveCartItems(cartItems);
      toast.warning(
        `Quantity for "${itemToUpdate.title}" set to max available stock: ${itemToUpdate.stock}.`
      );
      return true;
    }
  }

  cartItems[itemIndex].quantity = newQuantity;
  saveCartItems(cartItems);
  return true;
};

// Remove item
export const removeFromCart = (id: string): boolean => {
  if (typeof window === "undefined") return false;

  let cartItems = getCartItems();
  const initialLength = cartItems.length;
  cartItems = cartItems.filter((item) => item.id !== id);

  if (cartItems.length < initialLength) {
    saveCartItems(cartItems);
    return true;
  }

  console.warn(`Item with id ${id} not found in cart for removal.`);
  return false;
};

// Remove multiple items by ID
export const removeItemsByIds = (itemIdsToRemove: string[]): void => {
  if (typeof window === "undefined" || !itemIdsToRemove || itemIdsToRemove.length === 0) {
    return;
  }
  try {
    let cartItems = getCartItems();
    cartItems = cartItems.filter(item => !itemIdsToRemove.includes(item.id));
    saveCartItems(cartItems);
    console.log("Purchased items removed from client-side cart:", itemIdsToRemove);
  } catch (error) {
    console.error("Error removing multiple items from cart:", error);
  }
};

// Calculate total price
export const calculateCartTotal = (cartItems: CartItem[]): number => {
  return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
};

// Clear cart
export const clearCart = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CART_KEY);
  window.dispatchEvent(new Event("cartUpdated"));
};

// Get item count
export const getCartItemCount = (): number => {
  if (typeof window === "undefined") return 0;
  const cartItems = getCartItems();
  return cartItems.reduce((total, item) => total + item.quantity, 0);
};
