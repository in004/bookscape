"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Heart, Trash2, ShoppingCart, BookOpen } from "lucide-react"
import { addToCart } from "@/lib/cart-utils"
import { toast } from "sonner"

interface WishlistItem {
  id: string
  title: string
  addedAt: string
}

interface BookDetails {
  _id: string
  title: string
  authors: Array<{ name: string }>
  price: number
  salePrice?: number
  isOnSale?: boolean
  coverImage?: string
  stock?: number
  description?: string
}

export default function WishlistPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [bookDetails, setBookDetails] = useState<Record<string, BookDetails>>({})
  const [isLoading, setIsLoading] = useState(true)

  // Redirect if not logged in
  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/login")
      return
    }
  }, [session, status, router])

  // Load wishlist items
  useEffect(() => {
    if (session && typeof window !== "undefined") {
      const wishlist = JSON.parse(localStorage.getItem("bookscapeWishlist") || "[]")
      setWishlistItems(wishlist)
    }
  }, [session])

  // Fetch book details for wishlist items
  useEffect(() => {
    const fetchBookDetails = async () => {
      if (wishlistItems.length === 0) {
        setIsLoading(false)
        return
      }

      try {
        const bookIds = wishlistItems.map((item) => item.id)
        const promises = bookIds.map(async (id) => {
          try {
            const response = await fetch(`/api/books/${id}`)
            if (response.ok) {
              return await response.json()
            }
            return null
          } catch (error) {
            console.error(`Error fetching book ${id}:`, error)
            return null
          }
        })

        const books = await Promise.all(promises)
        const bookDetailsMap: Record<string, BookDetails> = {}

        books.forEach((book) => {
          if (book) {
            bookDetailsMap[book._id] = book
          }
        })

        setBookDetails(bookDetailsMap)
      } catch (error) {
        console.error("Error fetching book details:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBookDetails()
  }, [wishlistItems])

  const removeFromWishlist = (bookId: string) => {
    const updatedWishlist = wishlistItems.filter((item) => item.id !== bookId)
    setWishlistItems(updatedWishlist)
    localStorage.setItem("bookscapeWishlist", JSON.stringify(updatedWishlist))

    // Dispatch event to update wishlist count
    window.dispatchEvent(new Event("wishlistUpdated"))

    const book = bookDetails[bookId]
    toast.success("💔 Removed from wishlist", {
      description: book?.title || "Book removed",
      duration: 3000,
    })
  }

  const addToCartFromWishlist = (bookId: string) => {
    const book = bookDetails[bookId]
    if (!book) return

    // Check stock before adding to cart
    if (!book.stock || book.stock <= 0) {
      toast.error("This book is currently out of stock", {
        description: book.title,
        duration: 3000,
      })
      return
    }

    const cartItem = {
      id: book._id,
      title: book.title,
      price: book.isOnSale && book.salePrice ? book.salePrice : book.price,
      cover: book.coverImage ? `/bookCovers/${book.coverImage}` : "/placeholder.svg?height=600&width=400",
      author: book.authors?.map((a) => a.name).join(", ") || "Unknown Author",
      stock: book.stock,
    }

    const success = addToCart(cartItem)
    if (success) {
      toast.success("🛒 Added to cart!", {
        description: book.title,
        duration: 4000,
        action: {
          label: "Go to Cart",
          onClick: () => router.push("/cart"),
        },
      })
    } else {
      toast.error("Failed to add to cart", {
        description: "Please try again",
        duration: 3000,
      })
    }
  }

  const clearWishlist = () => {
    setWishlistItems([])
    localStorage.removeItem("bookscapeWishlist")
    window.dispatchEvent(new Event("wishlistUpdated"))
    toast.success("Wishlist cleared", {
      duration: 3000,
    })
  }

  if (status === "loading" || !session) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="animate-pulse">
          <div className="h-8 w-64 bg-gray-200 rounded mx-auto mb-8"></div>
          <div className="h-4 w-full max-w-md bg-gray-200 rounded mx-auto mb-3"></div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="animate-pulse">
          <div className="h-8 w-64 bg-gray-200 rounded mx-auto mb-8"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-80 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (wishlistItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Heart className="mx-auto h-16 w-16 text-gray-400 mb-6" />
        <h1 className="text-3xl font-bold mb-4 text-bookscape-dark">Your Wishlist is Empty</h1>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Start adding books you love to your wishlist by clicking the heart icon on any book.
        </p>
        <Link
          href="/"
          className="inline-flex items-center px-6 py-3 bg-bookscape-gold text-bookscape-dark rounded-md hover:bg-bookscape-gold-hover transition font-medium"
        >
          <BookOpen className="mr-2 h-5 w-5" />
          Browse Books
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-bookscape-dark mb-2">My Wishlist</h1>
          <p className="text-gray-600">
            {wishlistItems.length} book{wishlistItems.length !== 1 ? "s" : ""} saved for later
          </p>
        </div>

        {wishlistItems.length > 0 && (
          <button
            onClick={clearWishlist}
            className="px-4 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors font-medium"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {wishlistItems.map((item) => {
          const book = bookDetails[item.id]

          if (!book) {
            return (
              <div key={item.id} className="bg-gray-100 rounded-lg p-4 text-center">
                <p className="text-gray-500">Book not found</p>
                <button
                  onClick={() => removeFromWishlist(item.id)}
                  className="mt-2 text-red-500 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              </div>
            )
          }

          const displayPrice = book.isOnSale && book.salePrice ? book.salePrice : book.price
          const isOutOfStock = !book.stock || book.stock <= 0

          return (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="relative">
                <Link href={`/books/${book._id}`}>
                  <div className="aspect-[3/4] relative">
                    <Image
                      src={book.coverImage ? `/bookCovers/${book.coverImage}` : "/placeholder.svg?height=400&width=300"}
                      alt={book.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                </Link>

                {/* Remove from wishlist button */}
                <button
                  onClick={() => removeFromWishlist(item.id)}
                  className="absolute top-2 right-2 p-2 bg-white/90 hover:bg-white rounded-full shadow-md transition-all text-red-500 hover:text-red-700"
                  aria-label="Remove from wishlist"
                >
                  <Trash2 size={16} />
                </button>

                {/* Sale badge */}
                {book.isOnSale && book.salePrice && book.salePrice < book.price && (
                  <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-bold">
                    SALE
                  </div>
                )}
              </div>

              <div className="p-4">
                <Link href={`/books/${book._id}`}>
                  <h3 className="font-semibold text-bookscape-dark mb-1 line-clamp-2 hover:text-bookscape-gold transition-colors">
                    {book.title}
                  </h3>
                </Link>

                <p className="text-sm text-gray-600 mb-2">
                  {book.authors?.map((a) => a.name).join(", ") || "Unknown Author"}
                </p>

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-bookscape-dark">${displayPrice.toFixed(2)}</span>
                    {book.isOnSale && book.salePrice && book.salePrice < book.price && (
                      <span className="text-sm text-gray-500 line-through">${book.price.toFixed(2)}</span>
                    )}
                  </div>
                </div>

                {/* Stock status and warnings */}
                {isOutOfStock ? (
                  <p className="text-sm text-red-600 mb-2 font-medium">Out of Stock</p>
                ) : book.stock && book.stock <= 5 ? (
                  <p className="text-sm text-orange-600 mb-2 font-medium">Only {book.stock} left in stock</p>
                ) : (
                  <p className="text-sm text-green-600 mb-2 font-medium">In Stock</p>
                )}

                {/* Add to cart button - matches home page styling */}
                <button
                  onClick={() => addToCartFromWishlist(item.id)}
                  disabled={isOutOfStock}
                  className={`w-full py-2 px-4 rounded text-sm font-medium transition flex items-center justify-center gap-2 ${
                    isOutOfStock
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-bookscape-dark text-white hover:bg-bookscape-gold hover:text-bookscape-dark"
                  }`}
                >
                  <ShoppingCart size={16} />
                  {isOutOfStock ? "Out of Stock" : "Add to Cart"}
                </button>

                {/* Added date */}
                <p className="text-xs text-gray-400 mt-2 text-center">
                  Added {new Date(item.addedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
