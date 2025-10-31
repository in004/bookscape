"use client";


import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import BookCard from "@/components/BookCard";
import { Book} from "@/types";
interface BooksCarouselProps {
  sectionId: string;
  title: string;
  subtitle?: string;
  books: Book[];
  viewAllLink?: string;
  badgeText?: string;
  badgeColor?: string; 
  bgColor?: string; 
}

export default function BooksCarousel({
  sectionId,
  title,
  subtitle,
  books,
  viewAllLink,
  badgeText,
  badgeColor,
  bgColor = "bg-bookscape-bg" 
}: BooksCarouselProps) {

  const scroll = (direction: "left" | "right") => {
    const element = document.getElementById(sectionId);
    if (element) {
      const scrollAmount = direction === "left" ? -300 : 300;
      element.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  if (!books || books.length === 0) {
    // Optional: Render nothing or a message if no books for this section
    return null;
  }

  return (
    <section className={`py-14 md:py-16 ${bgColor}`}>
      <div className="container mx-auto px-6 relative">
        {/* Section Header - Copied structure & classes */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-serif font-bold">{title}</h2>
            {subtitle && <p className="text-gray-600 mt-2">{subtitle}</p>}
          </div>
          {viewAllLink && (
            <Link
              href={viewAllLink}
              className="text-bookscape-dark hover:text-bookscape-gold transition animated-underline"
            >
              View All
            </Link>
          )}
        </div>

        {/* Carousel */}
        <div className="relative">
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 bg-bookscape-dark text-white p-3 rounded-full hover:bg-bookscape-gold hover:text-bookscape-dark transition z-10 -ml-4 shadow-lg hidden md:block"
            aria-label="Scroll left"
          >
            <ChevronLeft size={24} />
          </button>

          <div
            id={sectionId}
            className="flex gap-6 overflow-x-auto pb-8 scrollbar-hide px-8 -mx-8 md:px-0 md:-mx-0" // Adjust padding/margin carefully for button positioning
          >
            {books.map((book) => (
              <div key={book._id} className="flex-shrink-0 w-64">
                 <BookCard book={book} badgeText={badgeText} badgeColor={badgeColor} />
              </div>
            ))}
          </div>

          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 bg-bookscape-dark text-white p-3 rounded-full hover:bg-bookscape-gold hover:text-bookscape-dark transition z-10 -mr-4 shadow-lg hidden md:block"
            aria-label="Scroll right"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
    </section>
  );
}