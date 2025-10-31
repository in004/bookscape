"use client"

import "./globals.css"
import { useEffect, useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { Search, ShoppingCart, User, Menu, X, ChevronDown, Heart, LogOut, Home, Settings } from "lucide-react"
import Link from "next/link"
import { Providers } from "./providers"
import { useRouter } from "next/navigation"
import { addToCart } from "@/lib/cart-utils"
import { Toaster } from "sonner"
import { CartProvider, useCart } from "@/context/CartContext"
import Wishlist from "@/components/wishlist/button"

export default function RootLayout({ children }) {
  return (
    <Providers>
      <CartProvider>
        <Toaster
          position="top-right"
          richColors
          toastOptions={{
            style: {
              fontSize: "1.05rem",
              fontWeight: "bold",
              borderRadius: "12px",
              boxShadow: "0 4px 18px 0 rgba(0,0,0,0.12)",
              padding: "1rem 1.5rem",
              minWidth: "220px",
              maxWidth: "90vw",
            },
          }}
        />
        <RootLayoutContent>{children}</RootLayoutContent>
      </CartProvider>
    </Providers>
  )
}

function RootLayoutContent({ children }) {
  const { data: session } = useSession()
  const user = session?.user
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeSubmenu, setActiveSubmenu] = useState(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [categories, setCategories] = useState([])
  const [authors, setAuthors] = useState([])
  const router = useRouter()
  const { cartCount } = useCart()

  // Handle pending cart item after login
  useEffect(() => {
    if (typeof window !== "undefined" && session) {
      const pending = localStorage.getItem("pendingCartItem")
      if (pending) {
        try {
          const item = JSON.parse(pending)
          addToCart(item)
        } catch {}
        localStorage.removeItem("pendingCartItem")
        router.push("/cart")
      }
    }
  }, [session])

  useEffect(() => {
    const syncLogout = (event) => {
      if (event.key === "logout") {
        signOut({ callbackUrl: "/" })
      }
    }
    window.addEventListener("storage", syncLogout)
    return () => window.removeEventListener("storage", syncLogout)
  }, [])

  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        const categoriesResponse = await fetch("/api/genres")
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json()
          setCategories(categoriesData)
        }

        const authorsResponse = await fetch("/api/authors")
        if (authorsResponse.ok) {
          const authorsData = await authorsResponse.json()
          setAuthors(authorsData)
        }
      } catch (error) {
        console.error("Error fetching menu data:", error)
      }
    }

    fetchMenuData()
  }, [])

  const handleLogout = () => {
    localStorage.setItem("logout", Date.now().toString())
    signOut({ callbackUrl: "/" })
    router.push("/")
  }

  const toggleSubmenu = (submenu) => {
    setActiveSubmenu(activeSubmenu === submenu ? null : submenu)
  }

  const menuCategories = [
    {
      name: "Browse All Books",
      submenu: [],
    },
    {
      name: "Featured Books",
      submenu: [],
    },
    {
      name: "Bestsellers",
      submenu: [],
    },
    {
      name: "New Arrivals",
      submenu: [],
    },
    {
      name: "Staff Picks",
      submenu: [],
    },
    {
      name: "Categories",
      submenu: [...categories.map((cat) => cat.name), "Children's Books"],
    },
    {
      name: "Authors",
      submenu: authors.map((author) => author.name),
    },
  ]

  const handleMenuClick = (itemName, submenuItem) => {
    setIsMenuOpen(false)

    if (submenuItem) {
      if (itemName === "Categories") {
        if (submenuItem === "Children's Books") {
          router.push("/browse?genreName=Children")
        } else {
          router.push(`/browse?genreName=${encodeURIComponent(submenuItem)}`)
        }
      } else if (itemName === "Authors") {
        const author = authors.find((a) => a.name === submenuItem)
        if (author) {
          router.push(`/browse?authorName=${encodeURIComponent(submenuItem)}&authorIds=${author._id}`)
        } else {
          router.push(`/browse?authorName=${encodeURIComponent(submenuItem)}`)
        }
      }
    } else {
      switch (itemName) {
        case "Browse All Books":
          router.push("/browse")
          break
        case "Featured Books":
          router.push("/browse?isFeatured=true")
          break
        case "Bestsellers":
          router.push("/browse?isBestseller=true")
          break
        case "New Arrivals":
          router.push("/browse?isNewArrival=true")
          break
        case "Staff Picks":
          router.push("/browse?isStaffPick=true")
          break
      }
    }
  }

  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-bookscape-bg text-bookscape-text font-serif">
        {/* Header */}
        <header className="bg-bookscape-dark text-white sticky top-0 z-50 shadow-lg">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="menu-button hover:text-bookscape-gold transition"
                  aria-label="Toggle menu"
                >
                  {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
                </button>
                <Link href="/" className="text-2xl md:text-3xl font-serif font-bold text-bookscape-gold">
                  Bookscape
                </Link>
              </div>

              <div className="flex items-center gap-4">
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    const trimmed = searchTerm.trim()
                    if (trimmed) {
                      router.push(`/search?q=${encodeURIComponent(trimmed)}`)
                      setSearchTerm("")
                    }
                  }}
                  className="relative hidden md:block w-full max-w-xs lg:max-w-sm"
                >
                  <input
                    type="search"
                    name="q"
                    placeholder="Search books, authors, genres..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="py-2 pl-10 pr-4 rounded-full border border-gray-400 focus:border-bookscape-gold focus:ring-1 focus:ring-bookscape-gold text-gray-800 placeholder-gray-500 w-80 shadow transition-all"
                    style={{ color: "white" }}
                  />
                  <button
                    type="submit"
                    aria-label="Search"
                    className="absolute left-3 top-2.5 text-gray-500 hover:text-bookscape-gold"
                    tabIndex={-1}
                    style={{ background: "none", border: "none", padding: 0 }}
                  >
                    <Search size={18} />
                  </button>
                </form>

                <div className="hidden md:flex items-center gap-6">
                  {!user ? (
                    <>
                      <Link href="/wishlist" className="hover:text-bookscape-gold transition">
                        <Wishlist Button/>
                      </Link>
                      {/* Use the new CartButton component */}
                      <Link href="/cart" className="hover:text-bookscape-gold transition relative">
                        <ShoppingCart size={24} />
                        <span className="absolute -top-2 -right-2 bg-bookscape-gold text-bookscape-dark rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                          0
                        </span>
                      </Link>
                      <Link href="/login" className="hover:text-bookscape-gold transition">
                        <User size={24} />
                      </Link>
                    </>
                  ) : (
                    <>
                      {/* Only show wishlist and cart for non-admin users */}
                      {user.role !== "admin" && (
                        <>
                          <Link href="/wishlist" className="hover:text-bookscape-gold transition">
                            <Wishlist Button/>
                          </Link>
                          {/* Use the new CartButton component */}
                          <Link href="/cart" className="hover:text-bookscape-gold transition relative">
                            <ShoppingCart size={24} />
                            <span className="absolute -top-2 -right-2 bg-bookscape-gold text-bookscape-dark rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                              {cartCount}
                            </span>
                          </Link>
                        </>
                      )}
                      <div className="relative flex items-center">
                        <button
                          className="hover:text-bookscape-gold transition"
                          onClick={() => setUserMenuOpen(!userMenuOpen)}
                          aria-label="User menu"
                        >
                          <User size={24} />
                        </button>
                        {userMenuOpen && (
                          <div className="absolute right-0 top-full mt-4 w-72 bg-white rounded-lg shadow-xl overflow-hidden z-50 border border-gray-200">
                            {/* Consistent header styling for both user and admin roles */}
                            <div className="px-6 py-5 border-b border-gray-100 bg-bookscape-gold">
                              <div>
                                <p className="font-bold text-bookscape-dark text-lg">{user.name || "User"}</p>
                                <p className="text-sm font-medium text-bookscape-dark/90">{user.email}</p>
                              </div>
                            </div>
                            <div className="py-2">
                              {/* Menu items - same structure for both roles, just different content */}
                              {user.role === "admin" ? (
                                <Link
                                  href="/dashboard/admin"
                                  className="flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-gray-100 font-medium"
                                  onClick={() => setUserMenuOpen(false)}
                                >
                                  <Settings className="h-5 w-5 text-bookscape-gold" />
                                  Admin Dashboard
                                </Link>
                              ) : user.role === "courier" ? (
                                <Link
                                  href="/dashboard/courier"
                                  className="flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-gray-100 font-medium"
                                  onClick={() => setUserMenuOpen(false)}
                                >
                                  <Settings className="h-5 w-5 text-bookscape-gold" />
                                  Courier Dashboard
                                </Link>
                              ) : (
                                <Link
                                  href="/dashboard/client"
                                  className="flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-gray-100 font-medium"
                                  onClick={() => setUserMenuOpen(false)}
                                >
                                  <User className="h-5 w-5 text-bookscape-gold" />
                                  My Profile
                                </Link>
                              )}
                              <Link
                                href="/"
                                className="flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-gray-100 font-medium"
                                onClick={() => setUserMenuOpen(false)}
                              >
                                <Home className="h-5 w-5 text-bookscape-gold" />
                                Home
                              </Link>
                              <button
                                onClick={() => {
                                  handleLogout()
                                  setUserMenuOpen(false)
                                }}
                                className="flex items-center gap-3 px-6 py-3 w-full text-left text-red-600 hover:bg-gray-100 font-medium border-t border-gray-100"
                              >
                                <LogOut className="h-5 w-5" />
                                Log out
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Simplified Slide-out Menu */}
        <div
          className={`main-menu fixed inset-0 z-40 transform ${
            isMenuOpen ? "translate-x-0" : "-translate-x-full"
          } transition-transform duration-300 ease-in-out`}
        >
          <div className="absolute inset-0 bg-black bg-opacity-30" onClick={() => setIsMenuOpen(false)}></div>
          <div className="relative h-full w-full max-w-md bg-white shadow-xl overflow-y-auto">
            {/* Removed the dark header section completely */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <Link
                  href="/"
                  className="text-2xl font-serif font-bold text-bookscape-dark"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Bookscape
                </Link>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="text-bookscape-dark hover:text-bookscape-gold transition"
                  aria-label="Close menu"
                >
                  <X size={24} />
                </button>
              </div>

              <nav>
                <ul className="space-y-3">
                  {menuCategories.map((category) => (
                    <li key={category.name} className="py-1">
                      <button
                        onClick={() => {
                          if (category.submenu.length > 0) {
                            toggleSubmenu(category.name)
                          } else {
                            handleMenuClick(category.name)
                          }
                        }}
                        className="flex items-center justify-between w-full text-left text-lg font-medium text-bookscape-dark hover:text-bookscape-gold transition py-2"
                      >
                        {category.name}
                        {category.submenu.length > 0 && (
                          <ChevronDown
                            size={20}
                            className={`transition-transform ${activeSubmenu === category.name ? "rotate-180" : ""}`}
                          />
                        )}
                      </button>

                      {activeSubmenu === category.name && category.submenu.length > 0 && (
                        <ul className="mt-2 ml-4 space-y-2">
                          {category.submenu.map((item) => (
                            <li key={item}>
                              <button
                                onClick={() => handleMenuClick(category.name, item)}
                                className="block py-1 text-gray-700 hover:text-bookscape-gold transition text-base w-full text-left"
                              >
                                {item}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </div>
        </div>

        <main className="flex-grow">{children}</main>
      </body>
    </html>
  )
}
