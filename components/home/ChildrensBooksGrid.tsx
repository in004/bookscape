import type React from "react"
import BookCard from "@/components/BookCard"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import type { Book } from "@/types"

interface ChildrensBooksGridProps {
  books: Book[]
}

const ChildrensBooksGrid: React.FC<ChildrensBooksGridProps> = ({ books }) => {
  return (
    <section className="py-16 bg-bookscape-light">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-serif font-bold mb-4">Children's Books</h2>
          <div className="w-24 h-1 bg-bookscape-gold mx-auto"></div>
          <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
            Spark imagination and foster a love of reading with our carefully selected children's collection
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-12">
          {books.map((book) => (
            <BookCard key={book._id} book={book} />
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/browse?genreName=Children"
            className="inline-flex items-center px-8 py-3 bg-bookscape-accent text-white font-medium rounded-lg hover:bg-blue-600 transition-colors shadow-lg"
          >
            Explore All Books
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  )
}

export default ChildrensBooksGrid
