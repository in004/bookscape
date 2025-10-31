"use client";

import type { Book, CartItem } from "@/types";
import { addToCart as addItemToCartUtil } from "@/lib/cart-utils";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ShoppingCart } from "lucide-react";

interface AddToCartButtonProps {
  book: Book;
  className?: string;
}

export default function AddToCartButton({ book, className = "" }: AddToCartButtonProps) {
  const { data: session } = useSession();
  const isLoggedIn = !!session;
  const router = useRouter();

  const effectivePrice = book.isOnSale && typeof book.salePrice === 'number' ? book.salePrice : book.price;

  const handleAddToCartClick = () => {
    if (!isLoggedIn) {
      const itemToStoreForLogin: Omit<CartItem, "quantity"> = {
        id: book._id,
        title: book.title,
        price: effectivePrice,
        cover: book.coverImage || "/placeholder-book-cover.jpg",
        stock: book.stock,
        author: book.authors?.map((a) => a.name).join(", ") || "Unknown Author",
      };
      localStorage.setItem("pendingCartItem", JSON.stringify(itemToStoreForLogin));
      router.push("/login?redirect=/cart");
      return;
    }

    // Call the utility function and store its boolean result
    const success = addItemToCartUtil({ 
      id: book._id,
      title: book.title,
      price: effectivePrice,
      cover: book.coverImage || "/placeholder-book-cover.jpg",
      stock: book.stock,
      author: book.authors?.map((a) => a.name).join(", ") || "Unknown Author",
    });

    if (success) {
      toast.success("🛒 Added to cart!", {
        description: <b className="font-sans">{book.title}</b>,
        duration: 3000,
        action: {
          label: "View Cart",
          onClick: () => router.push("/cart"),
        },
      });
    }
  
  };

  const isDisabled = book.stock !== undefined && book.stock <= 0;
  const buttonText = isDisabled ? "Out of Stock" : "Add to Cart";

  return (
    <button
      aria-label={`Add ${book.title} to cart`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleAddToCartClick();
      }}
      disabled={isDisabled}
      className={`flex items-center justify-center gap-2 bg-bookscape-dark text-white py-1.5 px-4 rounded text-sm font-medium hover:bg-bookscape-gold hover:text-bookscape-dark transition disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
    >
      <ShoppingCart size={16} />
      {buttonText}
    </button>
  );
}