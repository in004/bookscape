"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"

const ORDERS_PER_PAGE = 20

export default function CourierOrdersPage() {
  const { data: session, status } = useSession()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [updatingOrderId, setUpdatingOrderId] = useState(null)

  const courierId = session?.user?.id

  useEffect(() => {
    if (!courierId) return

    async function fetchOrders() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/orders?courierId=${courierId}`)
        if (!res.ok) throw new Error("Failed to fetch orders")
        const data = await res.json()

        // Filter orders assigned to this courier just in case
        const filtered = (data || []).filter(order => order.courierId === courierId)

        setOrders(
          filtered.map(o => ({
            id: o._id || o.id,
            deliveryStatus:
              o.deliveryStatus === "processing"
                ? "processing"
                : o.deliveryStatus === "delivered"
                  ? "delivered"
                  : o.deliveryStatus === "cancelled"
                    ? "cancelled"
                    : "pending",

            email: o.userEmail || "N/A",
            userId: o.userId || "N/A",
            total: o.totalAmount || 0,
            date: o.createdAt ? new Date(o.createdAt).toLocaleString() : "N/A",
            paypalId: o.paypalOrderId || "N/A",
            courierId: o.courierId,
          }))
        )
      } catch (e) {
        setError(e.message || "Unknown error")
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [courierId])

  const updateStatus = async (orderId, status) => {
    setUpdatingOrderId(orderId)
    try {
      const res = await fetch(`/api/orders`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          updateFields: { deliveryStatus: status },
        }),
      })
      if (!res.ok) throw new Error("Failed to update status")

      setOrders(prev =>
        prev.map(o => (o.id === orderId ? { ...o, deliveryStatus: status } : o))
      )
    } catch (error) {
      alert(error.message || "Failed to update status")
    } finally {
      setUpdatingOrderId(null)
    }
  }

  const getStatusBadge = status => {
    const statusStyles = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      processing: "bg-blue-100 text-blue-800 border-blue-200",
      delivered: "bg-green-100 text-green-800 border-green-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
    }

    const displayText = {
      pending: "Pending",
      processing: "Processing",
      delivered: "Delivered",
      cancelled: "Cancelled",
    }


    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusStyles[status] || statusStyles.pending
          }`}
      >
        {displayText[status]}
      </span>
    )
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session || !courierId) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        You must be logged in as a courier to see your orders.
      </div>
    )
  }

  const startIndex = (currentPage - 1) * ORDERS_PER_PAGE
  const endIndex = startIndex + ORDERS_PER_PAGE
  const currentOrders = orders.slice(startIndex, endIndex)
  const totalPages = Math.ceil(orders.length / ORDERS_PER_PAGE)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Your Assigned Orders</h1>

        {loading && (
          <div className="text-center py-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading your orders...</p>
          </div>
        )}

        {error && (
          <div className="text-red-600 font-semibold mb-4 text-center">{error}</div>
        )}

        {!loading && !error && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentOrders.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-4 whitespace-nowrap text-center text-gray-500"
                      >
                        No orders assigned to you.
                      </td>
                    </tr>
                  ) : (
                    currentOrders.map(order => (
                      <tr
                        key={order.id}
                        className="hover:bg-gray-50 transition-colors duration-150"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            #{order.id.slice(-8)}
                          </div>
                          <div className="text-sm text-gray-500">
                            PayPal:{" "}
                            {order.paypalId !== "N/A"
                              ? order.paypalId.slice(-8)
                              : "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{order.email}</div>
                          <div className="text-xs text-gray-500">UserID: {order.userId}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${order.total.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(order.deliveryStatus)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          {order.deliveryStatus === "processing" && (
                            <>
                              <button
                                disabled={updatingOrderId === order.id}
                                onClick={() => updateStatus(order.id, "delivered")}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded disabled:opacity-50"
                              >
                                Mark Delivered
                              </button>
                              <button
                                disabled={updatingOrderId === order.id}
                                onClick={() => updateStatus(order.id, "cancelled")}
                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded disabled:opacity-50"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          {order.deliveryStatus !== "processing" && (
                            <span className="text-gray-500">No actions available</span>
                          )}

                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </div>
              <div>
                <button
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="mr-2 px-3 py-1 rounded border border-gray-300 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
