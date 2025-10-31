import Image from "next/image"
import Link from "next/link"
import { Star } from "lucide-react"
import type { Book } from "@/types"
import AddToCartButton from "@/components/add-to-cart-button"

// Function to fetch a single book by its ID
async function getBookById(id: string): Promise<Book | null> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000"
  const apiUrl = `${baseUrl}/api/books/${id}` 
  console.log(`Workspaceing book by ID: ${apiUrl}`)

  try {
    const res = await fetch(apiUrl, { cache: "no-store" }) //
    if (!res.ok) {
      if (res.status === 404) {
        console.warn(`Book with ID ${id} not found by API.`)
        return null
      }
      throw new Error(`Failed to fetch book ${id}: ${res.statusText}`)
    }
    return await res.json()
  } catch (error) {
    console.error(`getBookById error fetching ${apiUrl}:`, error)
    return null
  }
}

export default async function BookDetailPage({ params }: { params: { id: string } }) {
  const { id } = params // The 'bookId' here matches your folder name [bookId]
  const book = await getBookById(id)

  if (!book) {
    return (
      <div className="container mx-auto px-6 py-12 text-center">
        <h1 className="text-3xl font-bold mb-4">Book Not Found</h1>
        <p className="text-gray-600">Sorry, we couldn't find the book you were looking for.</p>
        <Link
          href="/"
          className="mt-6 inline-block px-6 py-3 bg-bookscape-gold text-bookscape-dark rounded-md hover:bg-bookscape-gold-hover"
        >
          Go to Homepage
        </Link>
      </div>
    )
  }

  // --- Render the book details (customize this extensively) ---
  return (
    <div className="container mx-auto px-6 py-12 font-serif">
      <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
        {/* Book Cover Image */}
        <div className="md:col-span-1">
          {book.coverImage ? (
            <Image
              src={`/bookCovers/${book.coverImage}`}
              alt={book.title}
              width={400}
              height={600}
              className="rounded-lg shadow-xl w-full object-cover"
              priority 
            />
          ) : (
            <div className="w-full h-[600px] bg-gray-200 rounded-lg shadow-xl flex items-center justify-center text-gray-400">
              No Image Available
            </div>
          )}
        </div>

        {/* Book Details */}
        <div className="md:col-span-2 space-y-6">
          <h1 className="text-4xl lg:text-5xl font-bold text-bookscape-dark">{book.title}</h1>
          <p className="text-2xl text-gray-700">by {book.authors?.map((a) => a.name).join(", ") || "Unknown Author"}</p>

          {book.isOnSale && book.salePrice && book.salePrice < book.price ? (
            <div className="flex items-center gap-4">
              <p className="text-2xl text-gray-500 line-through">${book.price.toFixed(2)}</p>
              <p className="text-3xl font-semibold text-bookscape-dark">${book.salePrice.toFixed(2)}</p>
            </div>
          ) : (
            <p className="text-3xl font-semibold text-bookscape-dark">${book.price.toFixed(2)}</p>
          )}

          {book.genres && book.genres.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {book.genres.map((genre) => (
                <span key={genre._id} className="px-3 py-1 bg-bookscape-light text-bookscape-dark text-sm rounded-full">
                  {genre.name}
                </span>
              ))}
            </div>
          )}

          {book.year && <p className="text-md text-gray-600">Published: {book.year}</p>}
          <div className="space-y-2">
            <p className={`text-md font-medium ${book.stock && book.stock > 0 ? "text-green-600" : "text-red-600"}`}>
              {book.stock && book.stock > 0 ? "In Stock" : "Out of Stock"}
            </p>
            <AddToCartButton book={book} />
          </div>

          {book.description && (
            <div className="pt-6 border-t border-gray-200">
              <h2 className="text-2xl font-semibold text-bookscape-dark mb-3">Description</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{book.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
