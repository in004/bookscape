import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function POST() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const booksCollection = db.collection("books");

    // Fetch all books that are currently on sale
    const booksOnSale = await booksCollection.find({ isOnSale: true }).toArray();

    if (booksOnSale.length === 0) {
      return NextResponse.json({ message: "No books currently on sale" }, { status: 404 });
    }

    // Prepare bulk update operations to remove the sale
    const bulkOps = booksOnSale.map((book) => ({
      updateOne: {
        filter: { _id: book._id },
        update: {
          $unset: { salePrice: "", salePercentage: "" },
          $set: { isOnSale: false },
        },
      },
    }));

    // Execute bulk update
    const bulkWriteResult = await booksCollection.bulkWrite(bulkOps);

    return NextResponse.json(
      {
        message: `Sale removed from ${bulkWriteResult.modifiedCount} books`,
        booksUpdated: bulkWriteResult.modifiedCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error removing sale:", error);
    return NextResponse.json(
      { message: "An error occurred while removing the sale", error: error.message },
      { status: 500 }
    );
  }
}
