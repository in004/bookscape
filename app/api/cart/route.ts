import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Cart from "@/models/Cart";
import clientPromise from "@/lib/mongodb";
import type { NextRequest } from "next/server";

interface CartItem {
  id: string;
  title: string;
  author: string;
  cover: string;
  price: number;
  quantity: number;
}

interface SyncCartRequest {
  userId: string;
  items: CartItem[];
}

export async function POST(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db();

    const { userId, items }: SyncCartRequest = await request.json();

    if (!userId || !items) {
      return NextResponse.json({ error: "User ID and items are required" }, { status: 400 });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    let cart = await Cart.findOne({ user: userObjectId });

    if (!cart) {
      cart = new Cart({
        user: userObjectId,
        items: [],
      });
    }

    cart.items = items.map((item) => ({
      book: new mongoose.Types.ObjectId(item.id),
      quantity: item.quantity,
    }));

    cart.updatedAt = new Date();

    await cart.save();

    return NextResponse.json({
      success: true,
      message: "Cart synchronized successfully",
    });
  } catch (error) {
    console.error("Error syncing cart:", error);
    return NextResponse.json({ error: "Failed to sync cart" }, { status: 500 });
  }
}
