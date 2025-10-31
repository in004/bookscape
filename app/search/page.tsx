import type { Book } from '@/types';
import BookCard from '@/components/BookCard';
import Link from 'next/link';

// Helper function to fetch books from API
async function getBooks(filter: Record<string, string> = {}, options: RequestInit = { cache: 'no-store' as RequestCache }): Promise<Book[]> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
  const query = new URLSearchParams(filter).toString();
  const apiUrl = `${baseUrl}/api/books?${query}`;
  try {
    const res = await fetch(apiUrl, options);
    if (!res.ok) throw new Error(`Failed to fetch books for search: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    console.error(`Search page getBooks error:`, error);
    return [];
  }
}

// Metadata for SEO
export async function generateMetadata({ searchParams }: { searchParams: { q?: string }}) {
  const searchTerm = searchParams.q || "";
  if (searchTerm) {
    return {
      title: `Search results for "${searchTerm}" - BookScape`,
    };
  }
  return {
    title: "Search - BookScape",
  };
}

export default async function SearchResultsPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const searchTerm = searchParams.q?.trim() || '';
  let books: Book[] = [];

  if (searchTerm) {
    // Use the API that handles 'q' for combined search
    books = await getBooks({ q: searchTerm, limit: '20' });
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 font-serif">
      <h1 className="text-4xl md:text-5xl font-bold text-bookscape-dark mb-4 text-center">
        Search Results
      </h1>
      {searchTerm ? (
        <p className="text-gray-600 mb-10 text-center text-lg">
          Showing results for: <span className="font-semibold text-bookscape-gold">"{searchTerm}"</span>
        </p>
      ) : (
        <p className="text-gray-600 mb-10 text-center text-lg">
          Please enter a term in the search bar above to find books.
        </p>
      )}

      {searchTerm && books.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
          {books.map((book) => (
            <div key={book._id} className="rounded-xl shadow-lg bg-white hover:shadow-2xl transition-shadow duration-300">
              <BookCard book={book} />
            </div>
          ))}
        </div>
      )}

      {searchTerm && books.length === 0 && (
        <div className="text-center py-16">
          <p className="text-2xl text-gray-700 mb-6 font-semibold">No books found matching your search for <span className="text-bookscape-gold">"{searchTerm}"</span>.</p>
          <p className="text-gray-500 mb-8">Try a different search term or explore our categories.</p>
          <Link
            href="/categories"
            className="mt-6 inline-block px-8 py-4 bg-bookscape-gold text-bookscape-dark rounded-lg text-lg font-bold shadow hover:bg-bookscape-gold-hover transition"
          >
            Browse Categories
          </Link>
        </div>
      )}
    </div>
  );
}