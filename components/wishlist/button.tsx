"use client"

import { Heart } from "lucide-react"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"

export default function WishlistButton() {
  const { data: session } = useSession()
  const [itemCount, setItemCount] = useState(0)

  useEffect(() => {
    const updateCount = () => {
      if (session && typeof window !== "undefined") {
        try {
          const wishlist = JSON.parse(localStorage.getItem("bookscapeWishlist") || "[]")
          setItemCount(wishlist.length)
        } catch (error) {
          console.error("Error updating wishlist count:", error)
          setItemCount(0)
        }
      } else {
        setItemCount(0)
      }
    }

    updateCount()
    window.addEventListener("wishlistUpdated", updateCount)
    return () => window.removeEventListener("wishlistUpdated", updateCount)
  }, [session])

  return (
    <div className="relative">
      <Heart className="h-6 w-6" />
      {itemCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
          {itemCount}
        </span>
      )}
    </div>
  )
}
