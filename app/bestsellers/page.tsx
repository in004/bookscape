import type { Book } from '@/types'; 
import BookCard from '@/components/BookCard';  
import { Metadata } from 'next';

async function getBooks(filter: Record<string, string> = {}, options: RequestInit = { cache: 'no-store' }): Promise<Book[]> {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
    const query = new URLSearchParams(filter).toString();
    const apiUrl = `${baseUrl}/api/books?${query}`;
    console.log(`Workspaceing Bestsellers Page: ${apiUrl}`);
    try {
        const res = await fetch(apiUrl, options);
        if (!res.ok) throw new Error(`Failed to fetch books: ${res.statusText}`);
        return await res.json();
    } catch (error) {
        console.error(`getBooks error:`, error);
        return [];
    }
}

export const metadata: Metadata = {
  title: 'Bestselling Books - BookScape',
  description: 'Discover our current bestselling books.',
};

export default async function BestsellersPage() {
  // Fetch all bestsellers (no limit, or implement pagination later)
  const bestsellers = await getBooks({ isBestseller: 'true' });

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 font-serif">
      <div className="text-center mb-10 md:mb-12">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-bookscape-dark">Bestselling Books</h1>
        <p className="text-lg text-gray-600 mt-2">The most popular reads, loved by our community.</p>
      </div>

      {bestsellers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 xl:gap-8">
          {bestsellers.map((book) => (
            <BookCard key={book._id} book={book} badgeText="Bestseller" badgeColor="bg-bookscape-gold text-bookscape-dark" />
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-700 text-lg">No bestselling books available at the moment. Check back soon!</p>
      )}
      
    </div>
  );
}