"use client"

import { useState } from "react"
import { CartItem } from "@/types"

interface PayPalButtonProps {
  items: CartItem[]
  total: number
  onSuccess: (details: Record<string, any>) => void
  onError: (error: Error) => void
}

export default function PayPalButton({ items, total, onSuccess, onError }: PayPalButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCheckout = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log("Starting PayPal checkout with:", { itemCount: items.length, total })

      const response = await fetch("/api/paypal/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, total }),
      })

      // Get response text first for debugging
      const responseText = await response.text()
      console.log("Raw response:", responseText)

      // Try to parse as JSON
      let data
      try {
        data = JSON.parse(responseText)
      } catch (e) {
        console.error("Failed to parse response as JSON:", e)
        throw new Error("Invalid response from server")
      }

      if (!response.ok) {
        throw new Error(data.error || data.details || "Failed to create PayPal order")
      }

      if (data.approvalUrl) {
        console.log("Redirecting to PayPal approval URL:", data.approvalUrl)
        window.location.href = data.approvalUrl
      } else {
        throw new Error("No approval URL returned from PayPal")
      }
    } catch (error) {
      console.error("Checkout error:", error)
      const errorMessage = error instanceof Error ? error.message : "Checkout failed. Please try again."
      setError(errorMessage)
      onError(error instanceof Error ? error : new Error(String(error)))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">{error}</div>}
      <button
        onClick={handleCheckout}
        disabled={loading}
        className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Processing..." : "Checkout with PayPal"}
      </button>
    </div>
  )
}
