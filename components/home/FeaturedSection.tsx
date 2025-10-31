// src/components/home/FeaturedSection.tsx
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Star } from "lucide-react"
import type { Book } from "@/types"
import { addToCart } from "@/lib/cart-utils"
import { toast } from "sonner"

interface FeaturedSectionProps {
  books: Book[]
}

export default function FeaturedSection({ books }: FeaturedSectionProps) {
  const [featuredIndex, setFeaturedIndex] = useState(0)

  // Auto-rotate featured books
  useEffect(() => {
    if (!books || books.length <= 1) return // Only rotate if more than one book
    const interval = setInterval(() => {
      setFeaturedIndex((prev) => (prev + 1) % books.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [books])

  if (!books || books.length === 0) {
    // Render nothing or a placeholder if no featured books
    return (
      <section className="min-h-[600px] flex items-center justify-center bg-bookscape-dark text-white">
        Loading Featured...
      </section>
    )
  }

  const currentBook = books[featuredIndex]

  return (
    <section className="relative min-h-[600px] flex items-center bg-bookscape-dark">
      <div className="absolute inset-0 opacity-20 bg-[url('/placeholder.svg?height=1000&width=1600')] bg-cover bg-center mix-blend-overlay"></div>
      <div className="container mx-auto px-6 py-16 relative z-10">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          
          <div className="text-white space-y-6">
            <div className="inline-block px-3 py-1 bg-bookscape-gold text-bookscape-dark rounded-full text-sm font-medium mb-2">
              Featured Book
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold leading-tight">{currentBook.title}</h1>
            <p className="text-xl text-gray-300">
              by {currentBook.authors?.map((a) => a.name).join(", ") || "Unknown Author"}
            </p>
            
            {
              currentBook.rating ? (
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={20}
                      className={i < Math.floor(currentBook.rating!) ? "text-bookscape-gold" : "text-gray-400"}
                      fill={i < Math.floor(currentBook.rating!) ? "currentColor" : "none"}
                    />
                  ))}
                  <span className="ml-2 text-gray-300">{currentBook.rating.toFixed(1)}</span>
                </div>
              ) : (
                <div className="h-[20px]"></div>
              ) 
            }

            <p className="text-gray-300 max-w-lg">{currentBook.description || "Description not available."}</p>
            
            <div className="flex flex-wrap gap-2 mb-6">
              {currentBook.genres?.map((genre) => (
                <span key={genre._id} className="px-3 py-1 bg-white/10 rounded-full text-sm">
                  {genre.name}
                </span>
              ))}
            </div>
            
            <div className="flex flex-wrap gap-4">
              <Link
                href={`/books/${currentBook._id}`}
                className="px-6 py-3 bg-bookscape-gold text-bookscape-dark font-medium rounded-md hover:bg-bookscape-gold-hover transition"
              >
                View Details
              </Link>
              <button
                onClick={() => {
                  const cartItem = {
                    id: currentBook._id,
                    title: currentBook.title,
                    price: currentBook.isOnSale && currentBook.salePrice ? currentBook.salePrice : currentBook.price,
                    cover: currentBook.coverImage
                      ? `/bookCovers/${currentBook.coverImage}`
                      : "/placeholder.svg?height=600&width=400",
                    author: currentBook.authors?.map((a) => a.name).join(", ") || "Unknown Author",
                    stock: currentBook.stock,
                  }

                  const success = addToCart(cartItem)
                  if (success) {
                    // Show toast notification
                    toast.success("🛒 Added to cart!", {
                      description: <b>{currentBook.title}</b>,
                      duration: 4000,
                      action: {
                        label: "Go to Cart",
                        onClick: () => window.location.href = "/cart",
                      },
                    })
                  }
                }}
                className="px-6 py-3 border border-white text-white rounded-md hover:bg-white/10 transition"
                disabled={!currentBook.stock || currentBook.stock <= 0}
              >
                {!currentBook.stock || currentBook.stock <= 0
                  ? "Out of Stock"
                  : `Add to Cart - $${
                      currentBook.isOnSale && currentBook.salePrice && currentBook.salePrice < currentBook.price
                        ? currentBook.salePrice.toFixed(2)
                        : currentBook.price.toFixed(2)
                    }`}
              </button>
            </div>
          </div>

          {/* Right Side - Image - Copied structure & classes */}
          <div className="hidden md:flex justify-center">
            <div className="relative">
              <div className="absolute -inset-4 bg-bookscape-gold/20 rounded-lg blur-md"></div>
              <Image
                key={currentBook._id}
                src={
                  currentBook.coverImage
                    ? `/bookCovers/${currentBook.coverImage}`
                    : "/placeholder.svg?height=600&width=400"
                } // Match original placeholder size
                alt={currentBook.title}
                width={300}
                height={450}
                priority={true}
                className="rounded-lg shadow-2xl relative z-10 transform transition-all duration-500"
              />
            </div>
          </div>
        </div>

        {books.length > 1 && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {books.map((_, index) => (
              <button
                key={index}
                onClick={() => setFeaturedIndex(index)}
                className={`w-3 h-3 rounded-full transition-all ${index === featuredIndex ? "bg-bookscape-gold w-6" : "bg-white/50"}`}
                aria-label={`View featured book ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}