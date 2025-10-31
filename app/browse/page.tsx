// app/browse/page.tsx

import BookCard from "@/components/BookCard"
import FilterControls from "@/components/categories/FilterControls"

async function getBooksWithFilters(filters: Record<string, string | undefined>): Promise<any[]> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000"
  const url = new URL(`${baseUrl}/api/books`)

  // Append filter parameters to the URL
  for (const key in filters) {
    if (filters[key]) {
      url.searchParams.append(key, filters[key]!)
    }
  }

  try {
    const res = await fetch(url.toString(), { cache: "no-store" })
    if (!res.ok) {
      throw new Error(`Failed to fetch books: ${res.statusText}`)
    }
    return await res.json()
  } catch (error) {
    console.error(error)
    return []
  }
}

// Fetch categories for filter controls
async function getCategories(): Promise<{ _id: string; name: string }[]> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000"

  try {
    const res = await fetch(`${baseUrl}/api/genres`, { cache: "no-store" })
    if (!res.ok) throw new Error(`Failed to fetch categories: ${res.statusText}`)
    return await res.json()
  } catch (error) {
    console.error(error)
    return []
  }
}

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  // Extract filter values from searchParams
  const currentFilters: Record<string, string | undefined> = {
    minPrice: searchParams.minPrice as string | undefined,
    maxPrice: searchParams.maxPrice as string | undefined,
    isFeatured: searchParams.isFeatured as string | undefined,
    isBestseller: searchParams.isBestseller as string | undefined,
    isNewArrival: searchParams.isNewArrival as string | undefined,
    isEbook: searchParams.isEbook as string | undefined,
    isStaffPick: searchParams.isStaffPick as string | undefined,
    genreName: searchParams.genreName as string | undefined,
    authorName: searchParams.authorName as string | undefined,
    authorIds: searchParams.authorIds as string | undefined,
  }

  // Fetch books and categories
  const [books, categories] = await Promise.all([getBooksWithFilters(currentFilters), getCategories()])

  // Determine page title showing all active filters
  const activeFilters = []
  if (currentFilters.isFeatured === "true") activeFilters.push("Featured Books")
  if (currentFilters.isBestseller === "true") activeFilters.push("Bestsellers")
  if (currentFilters.isNewArrival === "true") activeFilters.push("New Arrivals")
  if (currentFilters.isStaffPick === "true") activeFilters.push("Staff Picks")
  if (currentFilters.genreName) activeFilters.push(`${currentFilters.genreName}`)
  if (currentFilters.authorName) activeFilters.push(`Books by ${currentFilters.authorName}`)

  const pageTitle = activeFilters.length > 0 ? activeFilters.join(" & ") : "Browse Books"

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Filter Sidebar */}
          <aside className="lg:col-span-1 mb-8 lg:mb-0">
            <FilterControls/>
          </aside>

          {/* Book Grid */}
          <main className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h1 className="text-3xl md:text-4xl font-bold text-bookscape-dark mb-2">{pageTitle}</h1>
              <p className="text-gray-600">
                Showing {books.length} book{books.length !== 1 ? "s" : ""}
                {activeFilters.length > 0 && (
                  <span className="text-bookscape-gold font-medium"> matching your filters</span>
                )}
              </p>
            </div>

            {books.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
                {books.map((book) => (
                  <BookCard key={book._id} book={book} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <p className="text-gray-700 text-lg mb-4">No books found matching your current filters.</p>
                <p className="text-gray-500">Try adjusting your filters or clearing them to see more results.</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
