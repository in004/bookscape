"use client"

import { useEffect, useState } from "react"
import { X, BookOpen } from "lucide-react"

const BANNER_KEY = "lastSaleBannerShown"
const BANNER_INTERVAL_MINUTES = 30

export default function SaleBanner() {
  const [salePercentage, setSalePercentage] = useState<number | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    const lastShown = localStorage.getItem(BANNER_KEY)
    const now = Date.now()

    if (lastShown && now - parseInt(lastShown) < BANNER_INTERVAL_MINUTES * 60 * 1000) {
      return // Don't show if less than 30 minutes have passed
    }

    async function fetchSale() {
      try {
        const res = await fetch("/api/books/current-sale")
        const data = await res.json()
        if (data.salePercentage > 0) {
          setSalePercentage(data.salePercentage)
          setIsVisible(true)
          setIsAnimating(true)
          localStorage.setItem(BANNER_KEY, now.toString()) // Save the time when banner is shown
        }
      } catch (error) {
        console.error("Failed to fetch sale data:", error)
      }
    }

    fetchSale()
  }, [])

  const handleClose = () => {
    setIsAnimating(false)
    setTimeout(() => setIsVisible(false), 300)
  }

  if (!isVisible || salePercentage === null) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4 ${
        isAnimating ? "animate-in fade-in duration-300" : "animate-out fade-out duration-300"
      }`}
    >
      <div
        className={`relative w-[450px] max-w-full rounded-lg border border-[#e9d7a7] shadow-2xl bg-white overflow-hidden ${
          isAnimating ? "animate-in zoom-in-95 duration-300 delay-100" : "animate-out zoom-out-95 duration-300"
        }`}
      >
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 h-8 w-8 rounded-full flex items-center justify-center hover:bg-[#f5ecd8]/50 transition-colors z-10"
          aria-label="Close sale banner"
        >
          <X className="h-5 w-5 text-[#1a2c41]" />
        </button>

        <div className="bg-[#1a2c41] py-2 px-4 text-center border-b border-[#e9d7a7]">
          <span className="inline-block px-4 py-1 text-sm font-bold rounded-full bg-[#e9d7a7] text-[#1a2c41] shadow-sm">
            Limited Time
          </span>
        </div>

        <div className="flex flex-col items-center justify-center text-center p-8 pt-10 pb-12 bg-[#f5ecd8]">
          <div className="bg-white rounded-full p-4 mb-5 border border-[#e9d7a7]">
            <BookOpen className="h-10 w-10 text-[#1a2c41]" />
          </div>

          <h3 className="font-serif font-bold text-3xl mb-2 text-[#1a2c41]">FLASH SALE</h3>

          <div className="text-6xl font-extrabold text-[#1a2c41] mb-4 font-serif tracking-tight">
            {salePercentage}% <span className="text-5xl">OFF</span>
          </div>

          <p className="text-lg text-[#1a2c41]/80 max-w-xs mx-auto">ALL BOOKS ON SALE</p>

          <button
            onClick={handleClose}
            className="mt-6 px-8 py-3 bg-[#1a2c41] hover:bg-[#2a3c51] text-white font-medium rounded-md transition-colors shadow-md border border-[#e9d7a7]"
          >
            Browse Books
          </button>
        </div>
      </div>
    </div>
  )
}
