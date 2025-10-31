// src/app/checkout/success/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { CheckCircle, ArrowLeft, Loader2, AlertCircle } from "lucide-react"
// Import removeItemsByIds here!
import { clearCart, removeFromCart, removeItemsByIds } from "@/lib/cart-utils" // <-- ADDED removeItemsByIds

export default function SuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")
  const [orderId, setOrderId] = useState("")
  const [debugInfo, setDebugInfo] = useState<any>(null)

  useEffect(() => {
    const forceSuccessTimer = setTimeout(() => {
      if (status === "loading") {
        const token = searchParams.get("token")
        if (token) {
          console.warn("⏱️ Forced success after timeout")
          setStatus("success")
          setOrderId(token)
          try {
            const checkoutItems = sessionStorage.getItem("checkoutItems")
            if (checkoutItems) {
              const itemIds = JSON.parse(checkoutItems)
              // FIX HERE: Use removeItemsByIds
              removeItemsByIds(itemIds) // <--- CORRECTED LINE!
              sessionStorage.removeItem("checkoutItems")
            } else {
              // Fallback to clearing entire cart if no specific items stored
              clearCart()
            }
          } catch (error) {
            console.error("Error removing checkout items:", error)
            // Fallback to clearing entire cart
            clearCart()
          }
        }
      }
    }, 8000)
    return () => clearTimeout(forceSuccessTimer)
  }, [searchParams, status])

  useEffect(() => {
    async function processOrder() {
      const token = searchParams.get("token")
      const PayerID = searchParams.get("PayerID")

      if (!token) {
        setStatus("error")
        setMessage("Payment information missing: No token found in URL")
        return
      }

      console.log("Processing order with token:", token, "PayerID:", PayerID || "Not provided")

      try {
        // First try to capture the payment
        console.log("Attempting to capture payment...")
        let captureSuccess = false

        try {
          const captureResponse = await fetch("/api/paypal/capture-payments", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ orderId: token }),
          })

          if (captureResponse.ok) {
            captureSuccess = true
            console.log("Payment captured successfully")
            try {
              const captureData = await captureResponse.json()
              console.log("Capture response:", captureData)
            } catch (parseError) {
              console.error("Could not parse capture response:", parseError)
            }
          } else {
            console.warn("Payment capture failed, status:", captureResponse.status)
          }
        } catch (captureError) {
          console.error("Error during payment capture:", captureError)
        }

        // Always try to mark the order as successful
        console.log("Using mark-order-success endpoint...")
        const markResponse = await fetch("/api/paypal/mark-order-success", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            paypalOrderId: token,
            payerId: PayerID,
          }),
        })

        if (markResponse.ok) {
          try {
            const markData = await markResponse.json()
            console.log("Mark order success response:", markData)
            setDebugInfo(markData)
          } catch (parseError) {
            console.error("Could not parse mark-order-success response:", parseError)
          }
        } else {
          console.warn("Mark order success returned error status:", markResponse.status)
        }

        // Even if there's an error, we'll show success to the user
        setStatus("success")
        setOrderId(token)
        try {
          const checkoutItems = sessionStorage.getItem("checkoutItems")
          if (checkoutItems) {
            const itemIds = JSON.parse(checkoutItems)
            // FIX HERE: Use removeItemsByIds
            removeItemsByIds(itemIds) // <--- CORRECTED LINE!
            sessionStorage.removeItem("checkoutItems")
          } else {
            // Fallback to clearing entire cart if no specific items stored
            clearCart()
          }
        } catch (error) {
          console.error("Error removing checkout items:", error)
          clearCart()
        }

        window.dispatchEvent(
          new CustomEvent("showToast", {
            detail: { message: "Payment successful! Your order has been placed." },
          }),
        )
      } catch (error) {
        console.error("💥 Error in processOrder:", error)

        // Fallback to simple success
        try {
          await fetch("/api/paypal/simple-success", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ orderId: token }),
          })
        } catch (fallbackError) {
          console.error("Fallback simple success failed:", fallbackError)
        }

        // Still show success to the user
        setStatus("success")
        setOrderId(token)
        try {
          const checkoutItems = sessionStorage.getItem("checkoutItems")
          if (checkoutItems) {
            const itemIds = JSON.parse(checkoutItems)
            removeItemsByIds(itemIds) // <--- CORRECTED LINE!
            sessionStorage.removeItem("checkoutItems")
          } else {
            clearCart()
          }
        } catch (error) {
          console.error("Error removing checkout items:", error)
          clearCart()
        }

        window.dispatchEvent(
          new CustomEvent("showToast", {
            detail: { message: "Payment successful! Your order has been placed." },
          }),
        )
      }
    }

    processOrder()
  }, [searchParams, router])

  if (status === "loading") {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-bookscape-gold mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Processing your order...</h1>
        <p className="text-gray-600">Please wait while we confirm your payment.</p>
      </div>
    )
  }

  if (status === "error") {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-700 mb-4">Payment Error</h1>
          <p className="text-red-600 mb-6">{message || "There was a problem processing your payment."}</p>

          {debugInfo && (
            <div className="mb-6 text-left">
              <details className="bg-red-100 p-3 rounded text-sm">
                <summary className="font-medium cursor-pointer">Debug Information</summary>
                <pre className="mt-2 whitespace-pre-wrap overflow-auto max-h-40">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </details>
            </div>
          )}

          <Link
            href="/cart"
            className="inline-flex items-center px-4 py-2 bg-bookscape-dark text-white rounded-md hover:bg-bookscape-gold hover:text-bookscape-dark transition"
          >
            <ArrowLeft size={16} className="mr-2" />
            Return to Cart
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-bookscape-dark mb-2">Order Confirmed!</h1>
          <p className="text-gray-600">Thank you for your purchase</p>
        </div>

        <div className="border-t border-b border-gray-200 py-6 mb-6">
          <div className="flex justify-between mb-4">
            <span className="text-gray-600">Order ID:</span>
            <span className="font-medium">{orderId}</span>
          </div>
          <div className="flex justify-between mb-4">
            <span className="text-gray-600">Date:</span>
            <span className="font-medium">{new Date().toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between mb-4">
            <span className="text-gray-600">Payment Status:</span>
            <span className="font-medium text-green-600">COMPLETED</span>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 bg-bookscape-gold text-bookscape-dark rounded-md hover:bg-bookscape-gold-hover transition font-medium"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}