"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  getCartItems,
  updateCartItemQuantity,
  removeFromCart,
  calculateCartTotal,
} from "@/lib/cart-utils"
import { CartItem } from "@/types"
import { Trash2, Plus, Minus, ShoppingBag, AlertCircle, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface StockValidationError {
  itemId: string
  requestedQuantity: number
  availableStock: number
  title: string
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stockErrors, setStockErrors] = useState<StockValidationError[]>([])
  const [isValidating, setIsValidating] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const updateCart = () => {
      const items = getCartItems()
      setCartItems(items)

      // Auto-select all items initially if no items were previously selected
      if (items.length > 0 && selectedItems.size === 0) {
        setSelectedItems(new Set(items.map((item) => item.id)))
      } else {
        // Ensure selected items are still in the cart after an update
        const currentItemIds = new Set(items.map(item => item.id));
        const newSelection = new Set([...selectedItems].filter(id => currentItemIds.has(id)));
        if (newSelection.size !== selectedItems.size) {
            setSelectedItems(newSelection);
        }
      }
    }

    updateCart() // Initial load
    window.addEventListener("cartUpdated", updateCart)
    return () => window.removeEventListener("cartUpdated", updateCart)
  }, []) 

  // Recalculate total when selection changes or cartItems update
  useEffect(() => {
    const selectedCartItems = cartItems.filter((item) => selectedItems.has(item.id))
    setTotal(calculateCartTotal(selectedCartItems))
  }, [selectedItems, cartItems])


  const handleItemSelection = (itemId: string, checked: boolean) => {
    const newSelection = new Set(selectedItems)
    if (checked) {
      newSelection.add(itemId)
    } else {
      newSelection.delete(itemId)
    }
    setSelectedItems(newSelection)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(cartItems.map((item) => item.id)))
    } else {
      setSelectedItems(new Set())
    }
  }

  const handleQuantityChange = (id: string, change: number) => {
    const item = cartItems.find((item) => item.id === id)
    if (item) {
      const newQuantity = item.quantity + change
      if (newQuantity > 0) {
        updateCartItemQuantity(id, newQuantity)
      } else {
        // If newQuantity is 0 or less, confirm removal
        if (confirm(`Are you sure you want to remove "${item.title}" from your cart?`)) {
          removeFromCart(id);
        }
      }
    }
  }

  const handleRemoveItem = (id: string) => {
    if (confirm("Are you sure you want to remove this item?")) {
        removeFromCart(id)
        const newSelection = new Set(selectedItems)
        newSelection.delete(id)
        setSelectedItems(newSelection)
    }
  }

  // Validate stock for selected items (rest of the code is unchanged)
  const validateStock = async (selectedCartItems: CartItem[]) => {
    setIsValidating(true)
    setStockErrors([])

    try {
      const response = await fetch("/api/books/validate-stock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: selectedCartItems.map((item) => ({
            id: item.id,
            requestedQuantity: item.quantity,
          })),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to validate stock");
      }

      const data = await response.json()

      if (data.errors && data.errors.length > 0) {
        setStockErrors(data.errors)
        const updatedItems = getCartItems();
        data.errors.forEach((err: StockValidationError) => {
            const itemInCart = updatedItems.find(item => item.id === err.itemId);
            if (itemInCart && itemInCart.quantity > err.availableStock) {
            }
        });
        toast.error("Some items in your cart have updated quantities due to stock limits.", { duration: 5000 });
        return false
      }

      return true
    } catch (error) {
      console.error("Stock validation error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to validate stock. Please try again.");
      return false
    } finally {
      setIsValidating(false)
    }
  }

  const handleCheckout = async () => {
    setIsLoading(true)
    setError(null)
    setStockErrors([])

    const selectedCartItems = cartItems.filter((item) => selectedItems.has(item.id))

    if (selectedCartItems.length === 0) {
      setError("Please select at least one item to checkout")
      setIsLoading(false)
      return
    }

    try {
      console.log("Validating stock for selected items...")

      const stockValid = await validateStock(selectedCartItems)

      if (!stockValid) {
        setIsLoading(false)
        return
      }

      console.log("Stock validation passed, creating PayPal order...")

      const response = await fetch("/api/paypal/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: selectedCartItems,
          totalAmount: total,
        }),
      })

      const responseText = await response.text()

      if (!responseText || responseText.trim() === "") {
        throw new Error("Server returned an empty response")
      }

      let data
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error("JSON parse error:", parseError)
        throw new Error(`Failed to parse server response: ${responseText.substring(0, 100)}...`)
      }

      if (!response.ok) {
        console.error("API error response:", data)
        throw new Error(data.error || data.details || "Failed to create PayPal order")
      }

      if (data.approvalUrl) {
        sessionStorage.setItem("checkoutItems", JSON.stringify(selectedCartItems.map((item) => item.id)))

        console.log("Redirecting to PayPal approval URL:", data.approvalUrl)
        window.location.href = data.approvalUrl
      } else {
        throw new Error("No approval URL returned")
      }
    } catch (error) {
      console.error("Checkout error:", error)
      setError(error instanceof Error ? error.message : "Checkout failed. Please try again.")
      toast.error(error instanceof Error ? error.message : "Checkout failed. Please try again.", { duration: 5000 });
    } finally {
      setIsLoading(false)
    }
  }

  if (cartItems.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingBag className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
        <Link href="/" className="text-bookscape-gold hover:underline">
          Continue shopping
        </Link>
      </div>
    )
  }

  const selectedCount = selectedItems.size
  const allSelected = selectedCount === cartItems.length

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Your Cart</h1>

      {stockErrors.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-red-800 font-medium mb-2">Stock Availability Issues</h3>
              <div className="space-y-2">
                {stockErrors.map((error, index) => (
                  <div key={index} className="text-red-700 text-sm">
                    <strong>{error.title}</strong>: You requested {error.requestedQuantity} items, but only{" "}
                    {error.availableStock} are available in stock. Your cart has been updated.
                  </div>
                ))}
              </div>
              <p className="text-red-600 text-sm mt-2">Please review your cart and try again.</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="select-all"
              checked={allSelected}
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="h-4 w-4 text-bookscape-gold focus:ring-bookscape-gold border-gray-300 rounded"
            />
            <label htmlFor="select-all" className="ml-3 text-sm font-medium text-gray-700">
              Select all items ({cartItems.length})
            </label>
            {selectedCount > 0 && selectedCount < cartItems.length && (
              <span className="ml-2 text-sm text-gray-500">({selectedCount} selected)</span>
            )}
          </div>

          {cartItems.map((item) => (
            <div
              key={item.id}
              className={`flex gap-4 border p-4 rounded-lg shadow ${selectedItems.has(item.id) ? "border-bookscape-gold bg-bookscape-gold/5" : ""}`}
            >
              <div className="flex items-start pt-2">
                <input
                  type="checkbox"
                  checked={selectedItems.has(item.id)}
                  onChange={(e) => handleItemSelection(item.id, e.target.checked)}
                  className="h-4 w-4 text-bookscape-gold focus:ring-bookscape-gold border-gray-300 rounded"
                />
              </div>

              <div className="w-20 h-28 flex-shrink-0 relative">
                <Image
                  src={
                    item.cover
                      ? item.cover.startsWith("/")
                        ? item.cover
                        : `/bookCovers/${item.cover}`
                      : "/placeholder.svg?height=200&width=150"
                  }
                  alt={item.title || "Book cover"}
                  fill
                  className="object-cover rounded"
                />
              </div>

              <div className="flex-1">
                <h3 className="font-medium">{item.title}</h3>
                {item.author && <p className="text-sm text-gray-600">{item.author}</p>}
                <p className="font-medium">${item.price.toFixed(2)}</p>

                {item.stock !== undefined && (
                  <p className="text-xs text-gray-500 mt-1">
                    {item.stock > 0 ? `${item.stock} in stock` : "Out of stock"}
                  </p>
                )}

                <div className="flex items-center mt-2">
                  <button
                    onClick={() => handleQuantityChange(item.id, -1)}
                    className="p-1 border rounded-l"
                    disabled={item.quantity <= 1}
                  >
                    <Minus size={16} />
                  </button>
                  <span className="px-3 py-1 border-t border-b">{item.quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(item.id, 1)}
                    className="p-1 border rounded-r"
                    disabled={item.stock !== undefined && item.quantity >= item.stock}
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {item.stock !== undefined && item.quantity >= item.stock && (
                  <p className="text-xs text-amber-600 mt-1 flex items-center">
                    <AlertCircle size={12} className="mr-1" />
                    Maximum quantity reached
                  </p>
                )}

                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="text-red-500 mt-2 flex items-center text-sm hover:text-red-700"
                >
                  <Trash2 size={16} className="mr-1" />
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gray-50 p-4 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Order Summary</h2>

          {selectedCount > 0 && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-700 flex items-center">
                <CheckCircle size={16} className="mr-2" />
                {selectedCount} item{selectedCount !== 1 ? "s" : ""} selected for checkout
              </p>
            </div>
          )}

          <div className="space-y-2 mb-6">
            <div className="flex justify-between">
              <span>Selected items ({selectedCount}):</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <div className="border-t pt-2 font-bold">
              <div className="flex justify-between">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">{error}</div>
          )}

          <button
            onClick={handleCheckout}
            disabled={isLoading || selectedCount === 0 || isValidating}
            className="w-full py-3 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              "Processing..."
            ) : isValidating ? (
              "Validating Stock..."
            ) : selectedCount === 0 ? (
              "Select items to checkout"
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 576 512"
                  className="h-5 w-5 mr-2 fill-current"
                  aria-hidden="true"
                >
                  <path d="M186.3 258.2c0 12.2-9.7 21.5-22 21.5-9.2 0-16-5.2-16-15 0-12.2 9.5-22 21.7-22 9.3 0 16.3 5.7 16.3 15.5zM80.5 209.7h-4.7c-1.5 0-3 1-3.2 2.7l-4.3 26.7 8.2-.3c11 0 19.5-1.5 21.5-14.2 2.3-13.4-6.2-14.9-17.5-14.9zm284 0H360c-1.8 0-3 1-3.2 2.7l-4.2 26.7 8-.3c13 0 22-3 22-18-.1-10.6-9.6-11.1-18.1-11.1zM576 80v352c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V80c0-26.5 21.5-48 48-48h480c26.5 0 48 21.5 48 48zM128.3 215.4c0-21-16.2-28-34.7-28h-40c-2.5 0-5 2-5.2 4.7L32 294.2c-.3 2 1.2 4 3.2 4h19c2.7 0 5.2-2.9 5.5-5.7l4.5-26.6c1-7.2 13.2-4.7 18-4.7 28.6 0 46.1-17 46.1-45.8zm84.2 8.8h-19c-3.8 0-4 5.5-4.2 8.2-5.8-8.5-14.2-10-23.7-10-24.5 0-43.2 21.5-43.2 45.2 0 19.5 12.2 32.2 31.7 32.2 9 0 20.2-4.9 26.5-11.9-.5 1.5-1 4.7-1 6.2 0 2.3 1 4 3.2 4H200c2.7 0 5-2.9 5.5-5.7l10.2-64.3c.3-1.9-1.2-3.9-3.2-3.9zm40.5 97.9l63.7-92.6c.5-.5.5-1 .5-1.7 0-1.7-1.5-3.5-3.2-3.5h-19.2c-1.7 0-3.5 1-4.5 2.5l-26.5 39-11-37.5c-.8-2.2-3-4-5.5-4h-18.7c-1.7 0-3.2 1.8-3.2 3.5 0 1.2 19.5 56.8 21.2 62.1-2.7 3.8-20.5 28.6-20.5 31.6 0 1.8 1.5 3.2 3.2 3.2h19.2c1.8-.1 3.5-1.1 4.5-2.6zm159.3-106.7c0-21-16.2-28-34.7-28h-39.7c-2.7 0-5.2 2-5.5 4.7l-16.2 102c-.2 2 1.3 4 3.2 4h20.5c2 0 3.5-1.5 4-3.2l4.5-29c1-7.2 13.2-4.7 18-4.7 28.4 0 45.9-17 45.9-45.8zm84.2 8.8h-19c-3.8 0-4 5.5-4.3 8.2-5.5-8.5-14-10-23.7-10-24.5 0-43.2 21.5-43.2 45.2 0 19.5 12.2 32.2 31.7 32.2 9.3 0 20.5-4.9 26.5-11.9-.3 1.5-1 4.7-1 6.2 0 2.3 1 4 3.2 4H484c2.7 0 5-2.9 5.5-5.7l10.2-64.3c.3-1.9-1.2-3.9-3.2-3.9zm47.5-33.3c0-2-1.5-3.5-3.2-3.5h-18.5c-1.5 0-3 1.2-3.2 2.7l-16.2 104-.3.5c0 1.8 1.5 3.5 3.5 3.5h16.5c2.5 0 5-2.9 5.2-5.7L504 191.4v-.8z" />
                </svg>
                Checkout with PayPal ({selectedCount} items)
              </>
            )}
          </button>

          {selectedCount > 0 && (
            <p className="text-xs text-gray-500 mt-2 text-center">Only selected items will be purchased</p>
          )}
        </div>
      </div>
    </div>
  )
}