import BookCard from "@/components/BookCard"
import FilterControls from "@/components/categories/FilterControls"
import type { Metadata } from "next"
import type { Author, Book } from "@/types"

// Fetch books for a category with filters
async function getBooksForCategory(
  genreSlug: string,
  filters: Record<string, string | undefined> = {},
): Promise<Book[]> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000"
  const genreNameForAPI = genreSlug.replace(/-/g, " ")

  const queryParams = new URLSearchParams()
  queryParams.append("genreName", genreNameForAPI)

  for (const key in filters) {
    if (filters[key]) {
      queryParams.append(key, filters[key] as string)
    }
  }

  const apiUrl = `${baseUrl}/api/books?${queryParams.toString()}`
  try {
    const res = await fetch(apiUrl, { cache: "no-store" })
    if (!res.ok) throw new Error(`Failed to fetch books for category ${genreSlug}: ${res.statusText}`)
    return await res.json()
  } catch (error) {
    console.error(error)
    return []
  }
}

// Fetch authors for filter options (all authors, or ideally authors in this genre)
async function getAuthorsForGenre(genreSlug: string): Promise<Author[]> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000"
  const apiUrl = `${baseUrl}/api/authors`
  try {
    const res = await fetch(apiUrl, { cache: "no-store" })
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []
  }
}

// Generate page title and metadata
export async function generateMetadata({ params }: { params: { genre: string } }): Promise<Metadata> {
  const pageTitle = params.genre
    .replace(/-/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
  return {
    title: `${pageTitle} Books - BookScape`,
    description: `Explore and filter books in the ${pageTitle} category.`,
  }
}

export default async function GenrePage({
  params,
  searchParams,
}: {
  params: { genre: string }
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const genreSlug = params.genre

  // Extract filter values from searchParams
  const currentFilters: Record<string, string | undefined> = {
    minPrice: searchParams.minPrice as string | undefined,
    maxPrice: searchParams.maxPrice as string | undefined,
    isFeatured: searchParams.isFeatured as string | undefined,
    isBestseller: searchParams.isBestseller as string | undefined,
    isNewArrival: searchParams.isNewArrival as string | undefined,
    isEbook: searchParams.isEbook as string | undefined,
    isStaffPick: searchParams.isStaffPick as string | undefined,
    authorName: searchParams.authorName as string | undefined,
    authorIds: searchParams.authorIds as string | undefined,
  }

  // Fetch books and available authors
  const books = await getBooksForCategory(genreSlug, currentFilters)
  const availableAuthorsForFilter = await getAuthorsForGenre(genreSlug)

  const pageTitle = genreSlug
    .replace(/-/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")

  // Determine active filters for display
  const activeFilters = []
  if (currentFilters.isFeatured === "true") activeFilters.push("Featured")
  if (currentFilters.isBestseller === "true") activeFilters.push("Bestsellers")
  if (currentFilters.isNewArrival === "true") activeFilters.push("New Arrivals")
  if (currentFilters.isEbook === "true") activeFilters.push("E-books")
  if (currentFilters.isStaffPick === "true") activeFilters.push("Staff Picks")
  if (currentFilters.authorName) activeFilters.push(`by ${currentFilters.authorName}`)

  const displayTitle =
    activeFilters.length > 0 ? `${pageTitle} Books - ${activeFilters.join(" & ")}` : `${pageTitle} Books`

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Filter Sidebar */}
          <aside className="lg:col-span-1 mb-8 lg:mb-0">
            <FilterControls />
          </aside>

          {/* Book Grid */}
          <main className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h1 className="text-3xl md:text-4xl font-bold text-bookscape-dark mb-2">{displayTitle}</h1>
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
                <p className="text-gray-700 text-lg mb-4">
                  No books found matching your current filters in this category.
                </p>
                <p className="text-gray-500">Try adjusting your filters or clearing them to see more results.</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
