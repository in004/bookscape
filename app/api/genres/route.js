import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export async function GET(req) {
  try {
    const db = (await clientPromise).db();
    const genresCollection = db.collection("genres");

    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name");

    const query = {};
    if (name) query.name = { $regex: name, $options: "i" };

    const genres = await genresCollection.find(query).toArray();

    if (genres.length === 0) {
      return NextResponse.json({ message: "No genres found." }, { status: 404 });
    }

    return NextResponse.json(genres, { status: 200 });
  } catch (error) {
    console.error("Error fetching genres:", error);
    return NextResponse.json({ error: "Failed to fetch genres" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { name } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "Genre name is required." },
        { status: 400 }
      );
    }

    const db = (await clientPromise).db();
    const genresCollection = db.collection("genres");

    const existingGenre = await genresCollection.findOne({ name });
    if (existingGenre) {
      return NextResponse.json(
        { error: "This genre already exists." },
        { status: 400 }
      );
    }

    const result = await genresCollection.insertOne({
      name,
      createdAt: new Date(),
    });

    const newGenre = await genresCollection.findOne({ _id: result.insertedId });

    return NextResponse.json(newGenre, { status: 200 });
  } catch (error) {
    console.error("Error during genre creation:", error);
    return NextResponse.json(
      { error: "Failed to create genre. Please try again." },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const { id, name } = await request.json();

    if (!id || !name) {
      return NextResponse.json(
        { error: "Genre ID and new name are required." },
        { status: 400 }
      );
    }

    const db = (await clientPromise).db();
    const genresCollection = db.collection("genres");

    const existingGenre = await genresCollection.findOne({ name });
    if (existingGenre) {
      return NextResponse.json(
        { error: "A genre with this name already exists." },
        { status: 400 }
      );
    }

    const result = await genresCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { name } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Genre not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "Genre updated successfully." }, { status: 200 });
  } catch (error) {
    console.error("Error updating genre:", error);
    return NextResponse.json({ error: "Failed to update genre." }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Genre ID is required." }, { status: 400 });
    }

    const db = (await clientPromise).db();
    const genresCollection = db.collection("genres");

    const result = await genresCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Genre not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "Genre deleted successfully." }, { status: 200 });
  } catch (error) {
    console.error("Error deleting genre:", error);
    return NextResponse.json({ error: "Failed to delete genre." }, { status: 500 });
  }
}
