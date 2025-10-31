"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { User, Mail, Key, CheckCircle, AlertCircle, X, Edit, ShoppingBag, BookOpen, Eye, EyeOff } from "lucide-react"
import axios from "axios"

export default function UserProfile() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("profile")
  const [isEditing, setIsEditing] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOrdersLoading, setIsOrdersLoading] = useState(false)
  const [orderError, setOrderError] = useState("")
  const [userData, setUserData] = useState({
    fullName: "",
    email: "",
  })

  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  // Fetch user orders
  const fetchOrders = async () => {
    if (isOrdersLoading) return

    setIsOrdersLoading(true)
    setOrderError("")

    try {
      console.log("Fetching user orders...")
      const response = await fetch("/api/orders/user")

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Error response:", errorData)
        throw new Error(errorData.error || "Failed to fetch orders")
      }

      const data = await response.json()
      console.log("User orders fetched:", data.length)

      setOrders(data)
    } catch (error) {
      console.error("Error fetching orders:", error)
      setOrderError(error.message || "Failed to load orders. Please try again.")
    } finally {
      setIsOrdersLoading(false)
    }
  }

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (session?.user) {
      setUserData({
        fullName: session.user.name || "",
        email: session.user.email || "",
      })

      console.log("User data set:", { fullName: session.user.name, email: session.user.email })
    }
  }, [session, status, router])

  // Fetch orders when orders tab is active
  useEffect(() => {
    if (activeTab === "orders" && session?.user) {
      fetchOrders()
    }
  }, [activeTab, session])

  const handleEditToggle = () => {
    if (isEditing) {
      handleSaveProfile()
    }
    setIsEditing(!isEditing)
  }

  const handleSaveProfile = async () => {
    try {
      // Split the full name for backend compatibility
      const nameParts = userData.fullName.trim().split(" ")
      const firstName = nameParts[0] || ""
      const lastName = nameParts.slice(1).join(" ") || ""

      // Update the profile in the database
      const response = await axios.put("/api/users/profile", {
        name: firstName,
        surname: lastName,
      })

      // Update session with new user data
      await session.update({
        ...session,
        user: {
          ...session?.user,
          name: userData.fullName.trim(),
        },
      })

      setMessage({ type: "success", text: "Profile updated successfully!" })
      setTimeout(() => setMessage({ type: "", text: "" }), 3000)
    } catch (error) {
      console.error("Error updating profile:", error)
      setMessage({ type: "error", text: "Failed to update profile. Please try again." })
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (isLoading) return
    setIsLoading(true)

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: "error", text: "New passwords don't match." })
      setIsLoading(false)
      return
    }

    try {
      const response = await axios.post("/api/auth/change-password", {
        email: userData.email,
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      })

      if (response.status === 200) {
        setMessage({
          type: "success",
          text: "Password changed successfully!",
        })

        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
      }
    } catch (error) {
      console.error("Error changing password:", error)
      setMessage({
        type: "error",
        text: error.response?.data?.error || "Failed to change password. Please check your current password.",
      })
    } finally {
      setIsLoading(false)
      setTimeout(() => setMessage({ type: "", text: "" }), 5000)
    }
  }

  const handleRefreshOrders = () => {
    fetchOrders()
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-bookscape-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-bookscape-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-bookscape-dark font-medium">Loading your profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bookscape-bg text-bookscape-text font-serif">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-10 text-center">
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-bookscape-dark mb-2">My Account</h1>
            <div className="w-24 h-1 bg-bookscape-gold mx-auto mb-4"></div>
            <p className="text-gray-600">Manage your profile and view your orders</p>
          </div>

          {/* Message display */}
          {message.text && (
            <div
              className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
                message.type === "success"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle className="h-5 w-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
              )}
              <p>{message.text}</p>
              <button
                onClick={() => setMessage({ type: "", text: "" })}
                className="ml-auto text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-8">
            <button
              onClick={() => setActiveTab("profile")}
              className={`px-6 py-3 font-medium text-sm ${
                activeTab === "profile"
                  ? "text-bookscape-dark border-b-2 border-bookscape-gold"
                  : "text-gray-500 hover:text-bookscape-dark"
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`px-6 py-3 font-medium text-sm ${
                activeTab === "orders"
                  ? "text-bookscape-dark border-b-2 border-bookscape-gold"
                  : "text-gray-500 hover:text-bookscape-dark"
              }`}
            >
              My Orders
            </button>
          </div>

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-serif font-bold text-bookscape-dark">Personal Information</h3>
                <button
                  onClick={handleEditToggle}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium ${
                    isEditing
                      ? "bg-bookscape-dark text-white hover:bg-bookscape-darker"
                      : "bg-bookscape-light text-bookscape-dark hover:bg-bookscape-gold"
                  } transition-colors`}
                >
                  {isEditing ? (
                    <>
                      <CheckCircle size={16} />
                      Save Changes
                    </>
                  ) : (
                    <>
                      <Edit size={16} />
                      Edit Profile
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1"> Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={userData.fullName}
                      onChange={(e) => setUserData({ ...userData, fullName: e.target.value })}
                      placeholder="Enter your full name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bookscape-gold focus:border-transparent"
                    />
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-md">
                      <User size={18} className="text-gray-400" />
                      <span>{userData.fullName || "Not set"}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-md">
                    <Mail size={18} className="text-gray-400" />
                    <span>{userData.email}</span>
                  </div>
                </div>

                {/* Change Password Section */}
                <div className="pt-4 border-t border-gray-100">
                  <h4 className="text-lg font-medium text-bookscape-dark mb-4 flex items-center gap-2">
                    <Key size={18} />
                    Change Password
                  </h4>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          required
                          className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bookscape-gold focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                        >
                          {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? "text" : "password"}
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                            required
                            className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bookscape-gold focus:border-transparent"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                          >
                            {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                            required
                            className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bookscape-gold focus:border-transparent"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                          >
                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="px-6 py-2 bg-bookscape-dark text-white rounded-md hover:bg-bookscape-darker transition-colors disabled:opacity-50"
                      >
                        {isLoading ? "Updating..." : "Update Password"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Orders Tab - Simple, only user's orders */}
          {activeTab === "orders" && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div>
                  <h3 className="text-xl font-serif font-bold text-bookscape-dark">My Orders</h3>
                  <p className="text-gray-600 text-sm mt-1">View your completed orders</p>
                </div>
              </div>

              {isOrdersLoading ? (
                <div className="p-12 text-center">
                  <div className="w-12 h-12 border-4 border-bookscape-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-bookscape-dark font-medium">Loading your orders...</p>
                </div>
              ) : orderError ? (
                <div className="p-12 text-center">
                  <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="h-10 w-10 text-red-500" />
                  </div>
                  <h4 className="text-lg font-medium text-bookscape-dark mb-2">Error loading orders</h4>
                  <p className="text-gray-600 mb-6">{orderError}</p>
                  <button
                    onClick={handleRefreshOrders}
                    className="px-6 py-2 bg-bookscape-dark text-white rounded-md hover:bg-bookscape-darker transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              ) : orders.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShoppingBag className="h-10 w-10 text-gray-400" />
                  </div>
                  <h4 className="text-lg font-medium text-bookscape-dark mb-2">No orders yet</h4>
                  <p className="text-gray-600 mb-6">You haven't placed any orders yet.</p>
                  <button
                    onClick={() => router.push("/")}
                    className="px-6 py-2 bg-bookscape-dark text-white rounded-md hover:bg-bookscape-darker transition-colors"
                  >
                    Browse Books
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {orders.map((order) => (
                    <div key={order._id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-3">
                            <h4 className="font-medium text-bookscape-dark">Order #{order._id}</h4>
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                order.status === "completed"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {order.status === "completed" ? "Completed" : "Processing"}
                            </span>
                          </div>
                          <p className="text-gray-500 text-sm mt-1">
                            Ordered on {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="mt-2 md:mt-0">
                          <p className="text-lg font-medium text-bookscape-dark">
                            ${(order.totalAmount || 0).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {order.items && order.items.length > 0 && (
                        <div className="mt-4 space-y-3">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex items-center gap-4">
                              <div className="w-12 h-16 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                                {item.cover ? (
                                  <img
                                    src={
                                      item.cover
                                        ? item.cover.startsWith("/")
                                          ? item.cover
                                          : `/bookCovers/${item.cover}`
                                        : "/placeholder.svg?height=200&width=150"
                                    }
                                    alt={item.title}
                                    className="w-full h-full object-cover rounded"
                                  />
                                ) : (
                                  <BookOpen className="h-6 w-6 text-gray-400" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="font-medium text-bookscape-dark truncate">{item.title}</h5>
                                <p className="text-gray-500 text-sm">{item.author}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-bookscape-dark">${(item.price || 0).toFixed(2)}</p>
                                <p className="text-gray-500 text-sm">Qty: {item.quantity}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
