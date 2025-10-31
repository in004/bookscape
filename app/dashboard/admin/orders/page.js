"use client"

import { useEffect, useState } from "react"

const ORDERS_PER_PAGE = 20

export default function OrdersPage() {
    const [orders, setOrders] = useState([])
    const [couriers, setCouriers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [selectedOrders, setSelectedOrders] = useState([])
    const [assigningOrderId, setAssigningOrderId] = useState(null)
    const [selectedCourierId, setSelectedCourierId] = useState(null)

    useEffect(() => {
        async function fetchData() {
            try {
                const [ordersRes, couriersRes] = await Promise.all([
                    fetch("/api/orders"),
                    fetch("/api/users?role=courier"),
                ])

                if (!ordersRes.ok) throw new Error("Failed to fetch orders")
                if (!couriersRes.ok) throw new Error("Failed to fetch couriers")

                const ordersData = await ordersRes.json()
                const couriersData = await couriersRes.json()

                setOrders(
                    (ordersData || []).map((o) => ({
                        id: o._id || o.id,
                        deliveryStatus: o.deliveryStatus || "unknown",
                        email: o.userEmail || "N/A",
                        userId: o.userId || "N/A",
                        total: o.totalAmount || 0,
                        date: o.createdAt ? new Date(o.createdAt).toLocaleString() : "N/A",
                        paypalId: o.paypalOrderId || "N/A",
                        courierId: o.courierId || null, 
                    }))
                )

                setCouriers(couriersData || [])
                setLoading(false)
            } catch (e) {
                setError(e.message || "Unknown error")
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    const handleAssignToCourier = (orderId) => {
        setAssigningOrderId(orderId)
        setSelectedCourierId(null)
    }

    const handleCourierChange = (e) => {
        setSelectedCourierId(e.target.value)
    }

    const confirmAssignCourier = async () => {
        if (!selectedCourierId || !assigningOrderId) return

        try {
            const res = await fetch(`/api/orders`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orderId: assigningOrderId,
                    updateFields: {
                        deliveryStatus: "processing",
                        courierId: selectedCourierId,
                    },
                }),
            })

            if (!res.ok) throw new Error("Failed to assign courier")

            setOrders((prevOrders) =>
                prevOrders.map((order) =>
                    order.id === assigningOrderId
                        ? { ...order, courierId: selectedCourierId, deliveryStatus: "processing" }
                        : order
                )
            )

            setAssigningOrderId(null)
            setSelectedCourierId(null)
            alert("Courier assigned successfully!")
        } catch (error) {
            alert(error.message || "Failed to assign courier")
        }
    }

    const cancelAssign = () => {
        setAssigningOrderId(null)
        setSelectedCourierId(null)
    }

    const handleSelectOrder = (orderId) => {
        setSelectedOrders((prev) =>
            prev.includes(orderId)
                ? prev.filter((id) => id !== orderId)
                : [...prev, orderId]
        )
    }

    const getStatusBadge = (status) => {
        const statusStyles = {
            pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
            processing: "bg-blue-100 text-blue-800 border-blue-200",
            delivered: "bg-green-100 text-green-800 border-green-200",
            cancelled: "bg-red-100 text-red-800 border-red-200",
            unknown: "bg-gray-100 text-gray-800 border-gray-200",
        }

        return (
            <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusStyles[status] || statusStyles.unknown
                    }`}
            >
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        )
    }

    // Helper to get courier name by courierId
    const getCourierName = (courierId) => {
        if (!courierId) return "-"
        const courier = couriers.find(c => c._id === courierId || c.id === courierId)
        return courier ? (courier.name || courier.email || "Unknown Courier") : "Unknown Courier"
    }

    const startIndex = (currentPage - 1) * ORDERS_PER_PAGE
    const endIndex = startIndex + ORDERS_PER_PAGE
    const currentOrders = orders.slice(startIndex, endIndex)
    const totalPages = Math.ceil(orders.length / ORDERS_PER_PAGE)

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading orders...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 text-xl mb-2">⚠️</div>
                    <p className="text-red-600 font-medium">Error: {error}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Orders Management</h1>
                    <p className="mt-2 text-gray-600">
                        Manage and track all customer orders ({orders.length} total orders)
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                        <div className="text-2xl font-bold text-gray-900">{orders.length}</div>
                        <div className="text-sm text-gray-600">Total Orders</div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                        <div className="text-2xl font-bold text-yellow-600">
                            {orders.filter((o) => o.deliveryStatus === "cancelled").length}
                        </div>
                        <div className="text-sm text-gray-600">Cancelled</div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                        <div className="text-2xl font-bold text-blue-600">
                            {orders.filter((o) => o.deliveryStatus === "processing").length}
                        </div>
                        <div className="text-sm text-gray-600">Processing</div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                        <div className="text-2xl font-bold text-green-600">
                            {orders.filter((o) => o.deliveryStatus === "delivered").length}
                        </div>
                        <div className="text-sm text-gray-600">Delivered</div>
                    </div>
                </div>

                {/* Table Container */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    {/* Table Header */}
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-medium text-gray-900">Orders List</h2>
                            <div className="text-sm text-gray-500">
                                Showing {startIndex + 1}-{Math.min(endIndex, orders.length)} of {orders.length} orders
                            </div>
                        </div>
                    </div>

                    {/* Table */}
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
                                        Courier
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {currentOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50 transition-colors duration-150">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                               
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">#{order.id.slice(-8)}</div>
                                                    <div className="text-sm text-gray-500">
                                                        PayPal: {order.paypalId !== "N/A" ? order.paypalId.slice(-8) : "N/A"}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{order.email}</div>
                                            <div className="text-xs text-gray-500">UserID: {order.userId}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            ${order.total.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.date}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(order.deliveryStatus)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {getCourierName(order.courierId)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                            {assigningOrderId === order.id ? (
                                                <>
                                                    <select
                                                        onChange={handleCourierChange}
                                                        value={selectedCourierId || ""}
                                                        className="border border-gray-300 rounded px-2 py-1"
                                                    >
                                                        <option value="" key="select-placeholder">
                                                            Select courier
                                                        </option>
                                                        {couriers.map((courier) => (
                                                            <option value={courier._id || courier.id} key={courier._id || courier.id}>
                                                                {courier.name || courier.email}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        onClick={confirmAssignCourier}
                                                        disabled={!selectedCourierId}
                                                        className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white px-3 py-1 rounded"
                                                    >
                                                        Confirm
                                                    </button>
                                                    <button
                                                        onClick={cancelAssign}
                                                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-1 rounded"
                                                    >
                                                        Cancel
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={() => handleAssignToCourier(order.id)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    Assign Courier
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
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
                                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                                disabled={currentPage === 1}
                                className="mr-2 px-3 py-1 rounded border border-gray-300 disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
