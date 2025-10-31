import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const db = (await clientPromise).db();
    const booksCollection = db.collection("books");

    const bookOnSale = await booksCollection.findOne(
      { isOnSale: true },
      { projection: { salePercentage: 1 } }
    );

    const salePercentage = bookOnSale?.salePercentage || 0;

    return NextResponse.json({ salePercentage });
  } catch (error) {
    console.error("Error fetching current sale:", error);
    return NextResponse.json(
      { message: "Failed to fetch current sale", error: error.message },
      { status: 500 }
    );
  }
}
