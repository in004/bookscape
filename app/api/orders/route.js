import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const orders = await db.collection("orders").find({}).toArray();

    return NextResponse.json(orders);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { orderId, updateFields } = body;

    if (!orderId || !updateFields) {
      return NextResponse.json({ error: "Missing orderId or updateFields" }, { status: 400 });
    }

    if (updateFields.courierId) {
      updateFields.courierId = new ObjectId(updateFields.courierId);
    }
    if (updateFields.userId) {
      updateFields.userId = new ObjectId(updateFields.userId);
    }
    
    if (updateFields.completedAt && typeof updateFields.completedAt === "string") {
      updateFields.completedAt = new Date(updateFields.completedAt);
    }

    const client = await clientPromise;
    const db = client.db();

    const result = await db.collection("orders").updateOne(
      { _id: new ObjectId(orderId) },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 