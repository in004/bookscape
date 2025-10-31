// src/app/page.tsx

import Link from "next/link"
import { BookOpen, Truck, Users } from "lucide-react"
import FeaturedSection from "@/components/home/FeaturedSection"
import BooksCarousel from "../components/home/BooksCarousel"
import StaffPicksSection from "@/components/home/StaffPicksSection"
import ChildrensBooksGrid from "../components/home/ChildrensBooksGrid"
import NewsletterForm from "../components/home/NewsletterForm"
import SaleBanner from "@/components/sales/SaleBanner"
import type { Book, Genre } from "@/types"

// --- Data Fetching Helper ---
async function getBooks(filter: Record<string, string> = {}, options = { cache: "no-store" }) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000"
  const stringFilter: Record<string, string> = {}
  for (const key in filter) {
    stringFilter[key] = String(filter[key])
  }
  const query = new URLSearchParams(stringFilter).toString()
  const apiUrl = `${baseUrl}/api/books?${query}`
  console.log(`Fetching: ${apiUrl}`)

  try {
    const res = await fetch(apiUrl, { ...options, cache: "no-store" as RequestCache })
    if (!res.ok) {
      console.error(`API Error (${apiUrl}): ${res.status} ${res.statusText}`)
      try {
        const errorBody = await res.json()
        console.error("API Error Body:", errorBody)
      } catch (e) {
        console.error("Could not parse error body")
      }
      throw new Error(`Failed to fetch books (${res.status})`)
    }
    return (await res.json()) as Book[]
  } catch (error) {
    console.error(`getBooks error fetching ${apiUrl}:`, error)
    return [] // Return empty array on error
  }
}

// --- Data Fetching Helper for Genres ---
async function getCategories() {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000"
  const apiUrl = `${baseUrl}/api/genres`
  try {
    const res = await fetch(apiUrl, { cache: "no-store" })
    if (!res.ok) throw new Error("Failed to fetch categories")
    return (await res.json()) as Genre[]
  } catch (error) {
    console.error("getCategories error:", error)
    return []
  }
}

export default async function Home() {
  // Fetch all data concurrently
  const [
    featuredBooksData,
    bestsellersData,
    newArrivalsData,
    staffPicksData,
    ebooksData,
    childrenBooksData,
    categories,
  ] = await Promise.all([
    getBooks({ isFeatured: "true", limit: "3" }),
    getBooks({ isBestseller: "true", limit: "8" }),
    getBooks({ isNewArrival: "true", limit: "8", sort: "createdAt_desc" }),
    getBooks({ isStaffPick: "true", limit: "4" }),
    getBooks({ isEbook: "true", limit: "5" }),
    getBooks({ genreName: "Children", limit: "10" }),
    getCategories(),
  ])

  // --- Render Page ---
  return (
    <div className="min-h-screen bg-bookscape-bg text-bookscape-text font-serif">
      <SaleBanner />

      {/* === Featured Section (Uses Client Component) === */}
      <FeaturedSection books={featuredBooksData} />

      {/* === Browse by Category Section (Dynamic Categories) === */}
      <section className="py-12 bg-white" aria-labelledby="browse-categories-heading">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 id="browse-categories-heading" className="text-3xl font-serif font-bold mb-4">
              Browse by Category
            </h2>
            <div className="w-24 h-1 bg-bookscape-gold mx-auto"></div>
            <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
              Discover your next favorite book from our carefully curated collection of genres
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6" role="list">
            {categories.map((category) => (
              <Link
                key={category._id}
                href={`/categories/${category.name.toLowerCase().replace(/\s+/g, "-")}`}
                className="group bg-bookscape-light rounded-lg p-6 transition-all hover:shadow-xl hover:bg-white"
                aria-label={`Browse books in ${category.name}`}
                role="listitem"
              >
                <h3 className="font-serif font-bold text-lg mb-2 group-hover:text-bookscape-gold transition-colors">
                  {category.name}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* === Bestsellers Section (Uses Client Component) === */}
      <BooksCarousel
        sectionId="bestsellers"
        title="Bestsellers"
        subtitle="The books everyone's talking about"
        books={bestsellersData}
        viewAllLink="/browse?isBestseller=true"
        badgeText="Bestseller"
        badgeColor="bg-bookscape-gold text-bookscape-dark"
        bgColor="bg-bookscape-bg"
      />

      {/* === Quote Section === */}
      <section className="py-10 bg-white">
        <div className="container mx-auto px-6">
          <blockquote className="elegant-quote text-center max-w-4xl mx-auto text-xl md:text-2xl text-gray-700">
            Books are the quietest and most constant of friends; they are the most accessible and wisest of counselors,
            and the most patient of teachers.
            <footer className="mt-4 text-right text-gray-500 text-base">— Charles W. Eliot</footer>
          </blockquote>
        </div>
      </section>

      {/* === New Arrivals Section (Uses Client Component) === */}
      <BooksCarousel
        sectionId="new-arrivals"
        title="New Arrivals"
        subtitle="Hot off the press"
        books={newArrivalsData}
        viewAllLink="/browse?isNewArrival=true"
        badgeText="New"
        badgeColor="bg-bookscape-accent text-white"
        bgColor="bg-bookscape-light"
      />

      {/* === Staff Picks Section === */}
      <StaffPicksSection books={staffPicksData} />

      {/* === Children's Books Section === */}
      <ChildrensBooksGrid books={childrenBooksData} />

      {/* === Features Section === */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-lg hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-bookscape-light rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="text-bookscape-dark" size={28} />
              </div>
              <h3 className="text-xl font-serif font-bold mb-3">Curated Selection</h3>
              <p className="text-gray-600">
                Our team of passionate readers carefully selects each title to ensure quality and diversity.
              </p>
            </div>
            <div className="text-center p-6 rounded-lg hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-bookscape-light rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="text-bookscape-dark" size={28} />
              </div>
              <h3 className="text-xl font-serif font-bold mb-3">Fast Shipping</h3>
              <p className="text-gray-600">Free shipping on orders over $35 and quick delivery to your doorstep.</p>
            </div>
            <div className="text-center p-6 rounded-lg hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-bookscape-light rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="text-bookscape-dark" size={28} />
              </div>
              <h3 className="text-xl font-serif font-bold mb-3">Expert Staff</h3>
              <p className="text-gray-600">
                Our knowledgeable team is always ready to help you find your perfect read.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* === Newsletter Section === */}
      <NewsletterForm />

{/* === Clean Centered Footer === */}
<footer className="py-8 bg-bookscape-dark text-white">
  <div className="container mx-auto px-6 max-w-4xl">
    <div className="flex flex-col md:flex-row justify-center gap-8 md:gap-16 mb-6">
      {/* About Section */}
      <div className="text-center md:text-left">
        <h4 className="text-lg font-semibold text-white mb-3 font-serif">BookScape</h4>
        <p className="text-gray-300 text-sm">
          Your curated corner for captivating reads. Explore worlds, discover authors.
        </p>
      </div>
      
      {/* Contact Section */}
      <div className="text-center md:text-left">
        <h4 className="text-lg font-semibold text-white mb-3 font-serif">Contact</h4>
        <div className="text-gray-300 text-sm">
          <a 
            href="mailto:bookscapeteam@gmail.com" 
            className="text-bookscape-gold hover:underline"
          >
            bookscapeteam@gmail.com
          </a>
        </div>
      </div>
    </div>
    
    {/* Copyright Section */}
    <div className="border-t border-gray-700 pt-6 text-center text-xs text-gray-400">
      &copy; {new Date().getFullYear()} BookScape. All Rights Reserved. |{" "}
      <Link href="/privacy" className="hover:text-bookscape-gold">
        Privacy Policy
      </Link>{" "}
      |{" "}
      <Link href="/terms" className="hover:text-bookscape-gold">
        Terms
      </Link>
    </div>
  </div>
</footer>
    </div>
  )
}