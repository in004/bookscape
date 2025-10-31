import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb"; 

export async function GET(request: Request) {
  try {
    const db = (await clientPromise).db();
    const subscribersCollection = db.collection("Subscriber");

    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    // Use deleteOne for specific deletion by token
    const result = await subscribersCollection.deleteOne({ unsubscribeToken: token });

    if (result.deletedCount === 0) { // Check if any document was deleted
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    return NextResponse.json({ message: "Unsubscribed successfully" }, { status: 200 });
  } catch (error) {
    console.error("Unsubscribe error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}