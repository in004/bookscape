"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { X, DollarSign } from "lucide-react"

interface Genre {
  _id: string
  name: string
}

interface Author {
  _id: string
  name: string
}

export default function FilterControls() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [categories, setCategories] = useState<Genre[]>([])
  const [authors, setAuthors] = useState<Author[]>([])
  const [minPrice, setMinPrice] = useState("")
  const [maxPrice, setMaxPrice] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories
        const categoriesResponse = await fetch("/api/genres")
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json()
          setCategories(categoriesData)
        }

        // Fetch authors
        const authorsResponse = await fetch("/api/authors")
        if (authorsResponse.ok) {
          const authorsData = await authorsResponse.json()
          setAuthors(authorsData)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      }
    }
    fetchData()
  }, [])

  // Initialize price inputs from URL params
  useEffect(() => {
    setMinPrice(searchParams.get("minPrice") || "")
    setMaxPrice(searchParams.get("maxPrice") || "")
  }, [searchParams])

  const handlePriceFilter = () => {
    const params = new URLSearchParams(searchParams.toString())

    if (minPrice) {
      params.set("minPrice", minPrice)
    } else {
      params.delete("minPrice")
    }

    if (maxPrice) {
      params.set("maxPrice", maxPrice)
    } else {
      params.delete("maxPrice")
    }

    router.push(`${window.location.pathname}?${params.toString()}`)
  }

  const clearAllFilters = () => {
    // Keep only the genreName if we're on a category page
    const currentPath = window.location.pathname
    if (currentPath.includes("/categories/")) {
      router.push(currentPath)
    } else {
      router.push("/browse")
    }
  }

  const removeFilter = (filterKey: string) => {
    const params = new URLSearchParams(searchParams.toString())

    if (filterKey === "authorName") {
      // Remove all author filters
      params.delete("authorName")
      params.delete("authorIds")
    } else {
      params.delete(filterKey)
    }

    router.push(`${window.location.pathname}?${params.toString()}`)
  }

  // Get active filters for display
  const getActiveFilters = () => {
    const active = []

    if (searchParams.get("isFeatured") === "true") active.push({ key: "isFeatured", label: "Featured Books" })
    if (searchParams.get("isBestseller") === "true") active.push({ key: "isBestseller", label: "Bestsellers" })
    if (searchParams.get("isNewArrival") === "true") active.push({ key: "isNewArrival", label: "New Arrivals" })
    if (searchParams.get("isStaffPick") === "true") active.push({ key: "isStaffPick", label: "Staff Picks" })
    if (searchParams.get("isEbook") === "true") active.push({ key: "isEbook", label: "E-books" })

    // Always show genreName filter if it exists, regardless of page
    if (searchParams.get("genreName")) {
      active.push({ key: "genreName", label: `Category: ${searchParams.get("genreName")}` })
    }

    // Handle multiple authors
    const selectedAuthors = searchParams.getAll("authorName")
    if (selectedAuthors.length > 0) {
      active.push({ key: "authorName", label: `Authors: ${selectedAuthors.join(", ")}` })
    }

    if (searchParams.get("minPrice")) active.push({ key: "minPrice", label: `Min: $${searchParams.get("minPrice")}` })
    if (searchParams.get("maxPrice")) active.push({ key: "maxPrice", label: `Max: $${searchParams.get("maxPrice")}` })

    return active
  }

  const activeFilters = getActiveFilters()

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-bookscape-dark">Filters</h2>
        {activeFilters.length > 0 && (
          <button onClick={clearAllFilters} className="text-sm text-red-600 hover:text-red-800 font-medium">
            Clear All
          </button>
        )}
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Active Filters</h3>
          <div className="flex flex-wrap gap-2">
            {activeFilters.map((filter) => (
              <span
                key={filter.key}
                className="inline-flex items-center gap-1 px-3 py-1 bg-bookscape-gold text-bookscape-dark text-sm rounded-full"
              >
                {filter.label}
                <button onClick={() => removeFilter(filter.key)} className="hover:text-red-600">
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Price Range Filter */}
        <div className="border-b border-gray-200 pb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign size={18} />
            Price Range
          </h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Min Price</label>
                <input
                  type="number"
                  placeholder="0"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-bookscape-gold focus:border-bookscape-gold"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Max Price</label>
                <input
                  type="number"
                  placeholder="999"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-bookscape-gold focus:border-bookscape-gold"
                />
              </div>
            </div>
            <button
              onClick={handlePriceFilter}
              className="w-full px-4 py-2 bg-bookscape-gold text-bookscape-dark font-medium rounded-md hover:bg-yellow-500 transition-colors"
            >
              Apply Price Filter
            </button>
          </div>
        </div>

        {/* Special Collections Filter */}
        <div className="border-b border-gray-200 pb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Special Collections</h3>
          <div className="space-y-3">
            {[
              { key: "isFeatured", label: "Featured Books", param: "isFeatured" },
              { key: "isBestseller", label: "Bestsellers", param: "isBestseller" },
              { key: "isNewArrival", label: "New Arrivals", param: "isNewArrival" },
              { key: "isStaffPick", label: "Staff Picks", param: "isStaffPick" },
            ].map((collection) => (
              <label key={collection.key} className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                <input
                  type="checkbox"
                  checked={searchParams.get(collection.param) === "true"}
                  onChange={(e) => {
                    const params = new URLSearchParams(searchParams.toString())
                    if (e.target.checked) {
                      params.set(collection.param, "true")
                    } else {
                      params.delete(collection.param)
                    }
                    router.push(`${window.location.pathname}?${params.toString()}`)
                  }}
                  className="h-4 w-4 text-bookscape-gold focus:ring-bookscape-gold border-gray-300 rounded"
                />
                <span className="ml-3 text-sm text-gray-700">{collection.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Categories Filter - Now always shows */}
        <div className="border-b border-gray-200 pb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Categories</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {categories.map((category) => (
              <label key={category._id} className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                <input
                  type="checkbox"
                  checked={searchParams.get("genreName") === category.name}
                  onChange={(e) => {
                    const params = new URLSearchParams(searchParams.toString())
                    if (e.target.checked) {
                      params.set("genreName", category.name)
                    } else {
                      params.delete("genreName")
                    }
                    router.push(`${window.location.pathname}?${params.toString()}`)
                  }}
                  className="h-4 w-4 text-bookscape-gold focus:ring-bookscape-gold border-gray-300 rounded"
                />
                <span className="ml-3 text-sm text-gray-700">{category.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Author Filter */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Authors</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {authors.map((author) => (
              <label key={author._id} className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                <input
                  type="checkbox"
                  checked={searchParams.getAll("authorName").includes(author.name)}
                  onChange={(e) => {
                    const params = new URLSearchParams(searchParams.toString())
                    const currentAuthors = params.getAll("authorName")
                    const currentAuthorIds = params.getAll("authorIds")

                    if (e.target.checked) {
                      // Add author name and ID
                      params.append("authorName", author.name)
                      params.append("authorIds", author._id)
                    } else {
                      // Remove all author params and re-add the ones we want to keep
                      params.delete("authorName")
                      params.delete("authorIds")

                      currentAuthors
                        .filter((name) => name !== author.name)
                        .forEach((name) => {
                          params.append("authorName", name)
                        })

                      // Find corresponding author IDs to keep
                      const authorsToKeep = currentAuthors.filter((name) => name !== author.name)
                      authorsToKeep.forEach((authorName) => {
                        const authorObj = authors.find((a) => a.name === authorName)
                        if (authorObj) {
                          params.append("authorIds", authorObj._id)
                        }
                      })
                    }
                    router.push(`${window.location.pathname}?${params.toString()}`)
                  }}
                  className="h-4 w-4 text-bookscape-gold focus:ring-bookscape-gold border-gray-300 rounded"
                />
                <span className="ml-3 text-sm text-gray-700">{author.name}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
