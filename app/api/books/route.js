import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export async function GET(req) {
  try {
    const db = (await clientPromise).db();
    const booksCollection = db.collection("books");
    const authorsCollection = db.collection("authors");
    const { searchParams } = new URL(req.url);

    const query = {};
    const aggregationPipeline = [];

    const title = searchParams.get("title");
    const genreName = searchParams.get("genreName");
    if (searchParams.get("isFeatured") === 'true') query.isFeatured = true;
    if (searchParams.get("isBestseller") === 'true') query.isBestseller = true;
    if (searchParams.get("isNewArrival") === 'true') query.isNewArrival = true;
    if (searchParams.get("isStaffPick") === 'true') query.isStaffPick = true;
    if (searchParams.get("minPrice")) query.price = { ...query.price, $gte: parseFloat(searchParams.get("minPrice")) };
    if (searchParams.get("maxPrice")) query.price = { ...query.price, $lte: parseFloat(searchParams.get("maxPrice")) };

    const authorIdsParamForFilter = searchParams.get("authorIds");
    if (authorIdsParamForFilter) {
      const authorObjectIds = authorIdsParamForFilter
        .split(',')
        .map(id => ObjectId.isValid(id.trim()) ? new ObjectId(id.trim()) : null)
        .filter(id => id !== null);
      if (authorObjectIds.length > 0) query.authorIds = { $in: authorObjectIds };
    }

    // --- General Search Term Logic (for navbar search) ---
    const searchTerm = searchParams.get("q");
    if (searchTerm) {
      // 1. Find author IDs that match the search term (case-insensitive)
      const matchingAuthors = await authorsCollection.find(
        { name: { $regex: searchTerm, $options: "i" } },
        { projection: { _id: 1 } }
      ).toArray();
      const matchingAuthorIds = matchingAuthors.map(author => author._id);

      // 2. Build $or query: matches title OR authorIds
      const orConditions = [{ title: { $regex: searchTerm, $options: "i" } }];
      if (matchingAuthorIds.length > 0) {
        orConditions.push({ authorIds: { $in: matchingAuthorIds } });
      }
      query.$or = orConditions;
    }

    // Add the main query to the pipeline
    if (Object.keys(query).length > 0) {
      aggregationPipeline.push({ $match: query });
    }

    aggregationPipeline.push(
      { $lookup: { from: "authors", localField: "authorIds", foreignField: "_id", as: "authors" } },
      { $lookup: { from: "genres", localField: "genreIds", foreignField: "_id", as: "genres" } }
    );

    if (genreName) {
      aggregationPipeline.push({
        $match: { "genres.name": { $regex: `^${genreName}$`, $options: "i" } }
      });
    }

    // Sorting
    const sortParam = searchParams.get("sort");
    if (sortParam === 'price_asc') aggregationPipeline.push({ $sort: { price: 1 } });
    else if (sortParam === 'price_desc') aggregationPipeline.push({ $sort: { price: -1 } });
    else if (searchParams.get("isNewArrival") === 'true' || sortParam === 'createdAt_desc') {
      aggregationPipeline.push({ $sort: { createdAt: -1 } });
    }

    // Limit
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 0;
    if (limit > 0) {
      aggregationPipeline.push({ $limit: limit });
    }

    const books = await booksCollection.aggregate(aggregationPipeline).toArray();
    return NextResponse.json(books, { status: 200 });

  } catch (error) {
    console.error("Error fetching books:", error);
    return NextResponse.json({ error: "Failed to fetch books", details: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const {
      title,
      authorIds,
      genreIds,
      coverImage,
      year,
      price,
      isFeatured,
      isBestseller,
      isNewArrival,
      isStaffPick,
      isEbook,
      stock,
      description,
      isOnSale = false,
      salePercentage = 0,
      salePrice = null,

    } = await request.json();

    const isValidObjectId = (id) => typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);

    if (
      !title ||
      !Array.isArray(authorIds) ||
      authorIds.length === 0 ||
      !authorIds.every(isValidObjectId) ||
      !Array.isArray(genreIds) ||
      genreIds.length === 0 ||
      !genreIds.every(isValidObjectId)
    ) {
      return NextResponse.json(
        { message: "Title, at least one valid authorId, and at least one valid genreId are required." },
        { status: 400 }
      );
    }

    const db = (await clientPromise).db();
    const booksCollection = db.collection("books");

    const newBookData = {
      title,
      authorIds: authorIds.map(id => new ObjectId(id)),
      genreIds: genreIds.map(id => new ObjectId(id)),
      coverImage,
      year,
      price: parseFloat(price),
      isFeatured: Boolean(isFeatured),
      isBestseller: Boolean(isBestseller),
      isNewArrival: Boolean(isNewArrival),
      isStaffPick: Boolean(isStaffPick),
      isEbook: Boolean(isEbook),
      stock: parseInt(stock),
      description: description?.trim() || "",
      isOnSale: Boolean(isOnSale),
      salePercentage: parseFloat(salePercentage),
      salePrice: salePrice !== null ? parseFloat(salePrice) : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await booksCollection.insertOne(newBookData);

    const aggregationPipeline = [
      { $match: { _id: result.insertedId } },
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

    const [newBook] = await booksCollection.aggregate(aggregationPipeline).toArray();

    return NextResponse.json(newBook, { status: 201 });

  } catch (error) {
    console.error("Error during book creation:", error);
    return NextResponse.json(
      { message: "Failed to create book. Please try again." },
      { status: 500 }
    );
  }
}