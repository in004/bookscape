import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function POST(request) {
  try {
    const body = await request.json();
    const { salePercentage } = body;

    if (!salePercentage || salePercentage <= 0 || salePercentage > 100) {
      return NextResponse.json(
        { message: "Please provide a valid sale percentage between 1 and 100" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    const booksCollection = db.collection("books");

    // Fetch all books to calculate salePrice individually
    const books = await booksCollection.find({}).toArray();

    if (books.length === 0) {
      return NextResponse.json({ message: "No books found to update" }, { status: 404 });
    }

    // Prepare bulk update operations
    const bulkOps = books.map((book) => {
      const originalPrice = book.price || 0;
      const discountAmount = (originalPrice * salePercentage) / 100;
      const salePrice = originalPrice - discountAmount;

      return {
        updateOne: {
          filter: { _id: book._id },
          update: {
            $set: {
              isOnSale: true,
              salePercentage,
              salePrice: Number(salePrice.toFixed(2)),
            },
          },
        },
      };
    });

    // Execute bulk update
    const bulkWriteResult = await booksCollection.bulkWrite(bulkOps);

    return NextResponse.json(
      {
        message: `Sale of ${salePercentage}% applied to ${bulkWriteResult.modifiedCount} books`,
        booksUpdated: bulkWriteResult.modifiedCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error applying sale:", error);
    return NextResponse.json(
      { message: "An error occurred while applying the sale", error: error.message },
      { status: 500 }
    );
  }
}
