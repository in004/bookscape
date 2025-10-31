import type React from "react"
import BookCard from "../BookCard"
import type { Book } from "@/types"
import Link from "next/link"

interface StaffPicksSectionProps {
  books: Book[]
}

const StaffPicksSection: React.FC<StaffPicksSectionProps> = ({ books }) => {
  return (
    <section className="bg-bookscape-light py-12">
      <div className="container mx-auto text-center">
        <h2 className="text-3xl font-bold text-bookscape-dark mb-4">Staff Picks</h2>
        <p className="text-lg text-bookscape-gray mb-8">Our favorite reads, hand-picked by our knowledgeable staff.</p>

        <div className="flex justify-center mb-8">
          <Link
            href="/browse?isStaffPick=true"
            className="inline-flex items-center px-6 py-3 bg-bookscape-gold text-bookscape-dark font-medium rounded-lg hover:bg-yellow-500 transition-colors"
          >
            View All Staff Picks
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 px-4 sm:px-0">
          {books.map((book) => (
            <BookCard key={book._id} book={book} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default StaffPicksSection
