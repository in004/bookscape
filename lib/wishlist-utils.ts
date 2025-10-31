"use client"

export interface WishlistItem {
  id: string
  title: string
  addedAt: string
}

export function getWishlistItems(): WishlistItem[] {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("bookscapeWishlist")
    try {
      return stored ? JSON.parse(stored) : []
    } catch (e) {
      console.error("Failed to parse wishlist items:", e)
      return []
    }
  }
  return []
}

export function addToWishlist(bookId: string, bookTitle: string): boolean {
  try {
    const wishlist = getWishlistItems()
    const existingItem = wishlist.find((item) => item.id === bookId)

    if (existingItem) {
      return false // Already in wishlist
    }

    const newItem: WishlistItem = {
      id: bookId,
      title: bookTitle,
      addedAt: new Date().toISOString(),
    }

    wishlist.push(newItem)
    localStorage.setItem("bookscapeWishlist", JSON.stringify(wishlist))
    window.dispatchEvent(new Event("wishlistUpdated"))
    return true
  } catch (error) {
    console.error("Error adding to wishlist:", error)
    return false
  }
}

export function removeFromWishlist(bookId: string): boolean {
  try {
    const wishlist = getWishlistItems()
    const updatedWishlist = wishlist.filter((item) => item.id !== bookId)

    localStorage.setItem("bookscapeWishlist", JSON.stringify(updatedWishlist))
    window.dispatchEvent(new Event("wishlistUpdated"))
    return true
  } catch (error) {
    console.error("Error removing from wishlist:", error)
    return false
  }
}

export function isInWishlist(bookId: string): boolean {
  const wishlist = getWishlistItems()
  return wishlist.some((item) => item.id === bookId)
}

export function clearWishlist(): boolean {
  try {
    localStorage.removeItem("bookscapeWishlist")
    window.dispatchEvent(new Event("wishlistUpdated"))
    return true
  } catch (error) {
    console.error("Error clearing wishlist:", error)
    return false
  }
}

export function getWishlistCount(): number {
  return getWishlistItems().length
}
