import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const db = (await clientPromise).db();
    const authorsCollection = db.collection("authors");
    const authors = await authorsCollection.find({}).sort({ name: 1 }).toArray();
    return NextResponse.json(authors, { status: 200 });
  } catch (error) {
    console.error("Error fetching authors:", error);
    return NextResponse.json({ error: "Failed to fetch authors" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { name } = await request.json();
    if (!name) {
      return NextResponse.json({ message: "Author name is required" }, { status: 400 });
    }
    const db = (await clientPromise).db();
    const authorsCollection = db.collection("authors");
    const existingAuthor = await authorsCollection.findOne({ name: { $regex: `^${name}$`, $options: "i" } });
    if (existingAuthor) {
      // Always return the author object for frontend select
      return NextResponse.json({ _id: existingAuthor._id, name: existingAuthor.name }, { status: 201 });
    }
    const result = await authorsCollection.insertOne({ name, createdAt: new Date() });
    const newAuthor = await authorsCollection.findOne({ _id: result.insertedId });
    return NextResponse.json({ _id: newAuthor._id, name: newAuthor.name }, { status: 201 });
  } catch (error) {
    console.error("Error creating author:", error);
    return NextResponse.json({ message: "Failed to create author" }, { status: 500 });
  }
}