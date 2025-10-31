// interface Author { _id: string; name: string; }

// interface Genre { _id: string; name: string; }

// interface Book {
//   _id: string;
//   title: string;
//   authors: Author[];
//   genres: Genre[];
//   coverImage?: string;
//   price: number;
//   year?: string;
//   description?: string;
//   rating?: number;
//   // Add any other fields your API returns
// }

// --- Type Definitions (or import from a shared types file) ---

export interface Author {
  _id: string;
  name: string;
}

export interface Genre {
  _id: string;
  name: string;
  icon: String,          // emoji or icon class name or image URL
  description: String
}

export interface Book {
  _id: string;
  title: string;
  authors: Author[];    // Expecting populated authors
  genres: Genre[];      // Expecting populated genres
  coverImage?: string;
  price: number;
  year?: string;
  isFeatured?: boolean;
  isBestseller?: boolean;
  isNewArrival?: boolean;
  isStaffPick?: boolean;
  isEbook?: boolean;
  stock?: number; 
  // Optional fields based on original mock data - ensure your API provides them if needed
  description?: string;
  rating?: number;
  featured?: boolean; // For children's grid special styling (if needed)
  salePrice?: number;
  salePercentage?: number;
  isOnSale?: boolean;
}

export interface CartItem {
  id: string
  title: string
  price: number
  cover: string // Changed from coverImage
  quantity: number
  stock?: number
  author?: string
}
export interface WishlistItem {
  id: string
  title: string
  addedAt: string
}

// --- End Type Definitions ---