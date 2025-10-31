"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Heart } from "lucide-react"
import { addToCart } from "@/lib/cart-utils"
import { useSession } from "next-auth/react"
import type { Book } from "@/types"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface BookCardProps {
  book: Book
  badgeText?: string
  badgeColor?: string
  showWishlist?: boolean 
}

export default function BookCard({ book, badgeText, badgeColor, showWishlist = true }: BookCardProps) {
  // Check if user is logged in
  const { data: session } = useSession()
  const isLoggedIn = !!session
  const router = useRouter()
  const [isInWishlist, setIsInWishlist] = useState(false)

  // Check if book is in wishlist
  useEffect(() => {
    if (session && typeof window !== "undefined" && showWishlist) {
      const wishlist = JSON.parse(localStorage.getItem("bookscapeWishlist") || "[]")
      setIsInWishlist(wishlist.some((item: any) => item.id === book._id))
    }
  }, [book._id, session, showWishlist])

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!session) {
      toast.error("Please log in to add items to your wishlist")
      return
    }

    try {
      const wishlist = JSON.parse(localStorage.getItem("bookscapeWishlist") || "[]")

      if (isInWishlist) {
        // Remove from wishlist
        const updatedWishlist = wishlist.filter((item: any) => item.id !== book._id)
        localStorage.setItem("bookscapeWishlist", JSON.stringify(updatedWishlist))
        setIsInWishlist(false)
        window.dispatchEvent(new Event("wishlistUpdated"))

        toast.success("💔 Removed from wishlist", {
          description: book.title,
          duration: 3000,
        })
      } else {
        // Add to wishlist
        const newWishlistItem = {
          id: book._id,
          title: book.title,
          addedAt: new Date().toISOString(),
        }

        wishlist.push(newWishlistItem)
        localStorage.setItem("bookscapeWishlist", JSON.stringify(wishlist))
        setIsInWishlist(true)
        window.dispatchEvent(new Event("wishlistUpdated"))

        toast.success("💖 Added to wishlist", {
          description: book.title,
          duration: 3000,
          action: {
            label: "View Wishlist",
            onClick: () => (window.location.href = "/wishlist"),
          },
        })
      }
    } catch (error) {
      console.error("Error updating wishlist:", error)
      toast.error("Failed to update wishlist")
    }
  }

  return (
    <div className="book-card bg-white rounded-lg shadow-md overflow-hidden group flex flex-col h-full relative">
      <Link href={`/books/${book._id}`} className="block relative h-80 overflow-hidden rounded-t-lg">
        <Image
          src={
            book.coverImage
              ? book.coverImage.startsWith("/")
                ? book.coverImage
                : `/bookCovers/${book.coverImage}`
              : "/placeholder.svg?height=200&width=150"
          }
          alt={book.title}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 250px"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {session && showWishlist && (
          <button
            onClick={toggleWishlist}
            className={`absolute top-2 left-2 z-20 p-2 rounded-full bg-white/90 hover:bg-white shadow-lg transition-all duration-200 ${
              isInWishlist ? "text-red-500" : "text-gray-400 hover:text-red-500"
            }`}
            aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart
              size={16}
              className={`transition-all duration-200 ${isInWishlist ? "fill-current scale-110" : ""}`}
            />
          </button>
        )}

        {badgeText && (
          <div
            className={`absolute top-2 right-2 z-10 text-xs font-bold px-2 py-1 rounded-full ${badgeColor || "bg-bookscape-gold text-bookscape-dark"}`}
          >
            {badgeText}
          </div>
        )}
      </Link>

      <div className="p-5 flex flex-col flex-grow">
        <h3 className="font-serif text-lg font-bold mb-1 line-clamp-1">
          <Link href={`/books/${book._id}`} className="hover:text-bookscape-gold transition-colors">
            {book.title}
          </Link>
        </h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-1">
          {book.authors?.map((a) => a.name).join(", ") || "Unknown Author"}
        </p>
        <div className="flex justify-between items-center mt-auto">
          <p
            className={`font-bold ${
              book.isOnSale && book.salePrice && book.salePrice < book.price ? "text-red-600" : "text-bookscape-dark"
            }`}
          >
            $
            {book.isOnSale && book.salePrice && book.salePrice < book.price
              ? book.salePrice.toFixed(2)
              : Number(book.price).toFixed(2)}
          </p>

          <button
            aria-label={`Add ${book.title} to cart`}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (!isLoggedIn) {
                // Store pending cart action and redirect to login
                localStorage.setItem(
                  "pendingCartItem",
                  JSON.stringify({
                    id: book._id,
                    title: book.title,
                    price: book.isOnSale && book.salePrice ? book.salePrice : book.price,
                    cover: book.coverImage || "/placeholder-book-cover.jpg",
                    stock: book.stock,
                    author: book.authors?.map((a) => a.name).join(", ") || "Unknown Author",
                  }),
                )
                router.push("/login?redirect=/") // Redirect back to home after login
                return
              }

              // If logged in, call addToCart and check its return value
              const wasAddedSuccessfully = addToCart({
                id: book._id,
                title: book.title,
                price: book.isOnSale && book.salePrice ? book.salePrice : book.price,
                cover: book.coverImage || "/placeholder-book-cover.jpg",
                stock: book.stock,
                author: book.authors?.map((a) => a.name).join(", ") || "Unknown Author",
              })

              if (wasAddedSuccessfully) {
                toast.success("🛒 Added to cart!", {
                  description: <b>{book.title}</b>,
                  duration: 5000,
                  action: {
                    label: "Go to Cart",
                    onClick: () => router.push("/cart"),
                  },
                })
              }
            }}
            disabled={book.stock !== undefined && book.stock <= 0}
            className="bg-bookscape-dark text-white py-1.5 px-3 rounded text-sm hover:bg-bookscape-gold hover:text-bookscape-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {book.stock !== undefined && book.stock <= 0 ? "Out of Stock" : "Add to Cart"}
          </button>
        </div>
      </div>
    </div>
  )
}
