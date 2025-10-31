import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

export async function DELETE(req, { params }) {
  try {
    const db = (await clientPromise).db();
    const booksCollection = db.collection("books");

    const bookId = params.id;

    if (!ObjectId.isValid(bookId)) {
      return NextResponse.json({ error: "Invalid book ID." }, { status: 400 });
    }

    const result = await booksCollection.deleteOne({ _id: new ObjectId(bookId) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: "Book not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "Book deleted successfully." }, { status: 200 });
  } catch (error) {
    console.error("Error deleting book:", error);
    return NextResponse.json({ error: "Failed to delete book." }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const {
      title,
      authorIds,
      genreIds,
      coverImage,
      year,
      price,
      stock,
      description,
      isFeatured,
      isBestseller,
      isNewArrival,
      isStaffPick,
      isEbook,
    } = await request.json();
    const bookId = params.id;

    if (!ObjectId.isValid(bookId)) {
      return NextResponse.json({ error: "Invalid book ID." }, { status: 400 });
    }

    const db = (await clientPromise).db();
    const booksCollection = db.collection("books");

    const updateData = {
      title,
      authorIds: authorIds.map(id => new ObjectId(id)),
      genreIds: genreIds.map(id => new ObjectId(id)),
      coverImage,
      year,
      price: parseFloat(price),
      stock: parseInt(stock),
      description: description?.trim(),
      isFeatured: Boolean(isFeatured),
      isBestseller: Boolean(isBestseller),
      isNewArrival: Boolean(isNewArrival),
      isStaffPick: Boolean(isStaffPick),
      isEbook: Boolean(isEbook),
      updatedAt: new Date(),
    };

    // Remove undefined fields so they don't overwrite existing data if not provided
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);


    const result = await booksCollection.updateOne(
      { _id: new ObjectId(bookId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Book not found." }, { status: 404 });
    }

    const aggregationPipeline = [
      { $match: { _id: new ObjectId(bookId) } },
      {
        $lookup: {
          from: "authors",
          localField: "authorIds",
          foreignField: "_id",
          as: "authors",
        },
      },
      {
        $lookup: {
          from: "genres",
          localField: "genreIds",
          foreignField: "_id",
          as: "genres",
        },
      },
    ];

    const [updatedBook] = await booksCollection.aggregate(aggregationPipeline).toArray();
    return NextResponse.json(updatedBook, { status: 200 });

  } catch (error) {
    console.error("Error during book update:", error);
    return NextResponse.json(
      { error: "Failed to update book. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET(req, context) {
  const { params } = await context;
  const bookId = params.id;

  try {
    const db = (await clientPromise).db();
    const booksCollection = db.collection("books");

    if (!ObjectId.isValid(bookId)) {
      return NextResponse.json({ error: "Invalid book ID." }, { status: 400 });
    }

    const aggregationPipeline = [
      { $match: { _id: new ObjectId(bookId) } },
      {
        $lookup: {
          from: "authors",
          localField: "authorIds",
          foreignField: "_id",
          as: "authors",
        },
      },
      {
        $lookup: {
          from: "genres",
          localField: "genreIds",
          foreignField: "_id",
          as: "genres",
        },
      },
    ];

    const [book] = await booksCollection.aggregate(aggregationPipeline).toArray();
    if (!book) {
      return NextResponse.json({ error: "Book not found." }, { status: 404 });
    }
    return NextResponse.json(book, { status: 200 });
  } catch (error) {
    console.error("Error fetching book:", error);
    return NextResponse.json({ error: "Failed to fetch book." }, { status: 500 });
  }
}