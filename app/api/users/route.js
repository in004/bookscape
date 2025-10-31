import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(req) {
  try {
    const db = (await clientPromise).db();
    const usersCollection = db.collection("book_users");

    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const role = searchParams.get("role");

    if (email) {
      // Match users whose email starts with the input
      const users = await usersCollection
        .find({ email: { $regex: `^${email}`, $options: "i" } })
        .toArray();

      if (!users.length) {
        return NextResponse.json({ error: "No users found." }, { status: 404 });
      }

      const sanitizedUsers = users.map(({ password, ...user }) => user);
      return NextResponse.json(sanitizedUsers, { status: 200 });
    }

    if (role) {
      // Match users whose role starts with the input
      const users = await usersCollection
        .find({ role: { $regex: `^${role}`, $options: "i" } })
        .toArray();

      if (!users.length) {
        return NextResponse.json({ error: "No users found." }, { status: 404 });
      }

      const sanitizedUsers = users.map(({ password, ...user }) => user);
      return NextResponse.json(sanitizedUsers, { status: 200 });
    }

    // Get all users if no email or role filter
    const users = await usersCollection.find({}).toArray();
    const sanitizedUsers = users.map(({ password, ...user }) => user);
    return NextResponse.json(sanitizedUsers, { status: 200 });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users." }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { email, role } = await request.json();

    if (!email || !role) {
      return NextResponse.json({ error: "Email and new role are required." }, { status: 400 });
    }

    const db = (await clientPromise).db();
    const usersCollection = db.collection("book_users");

    const result = await usersCollection.updateOne(
      { email },
      {
        $set: {
          role,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const updatedUser = await usersCollection.findOne({ email });
    const { password, ...sanitizedUser } = updatedUser;

    return NextResponse.json(sanitizedUser, { status: 200 });
  } catch (error) {
    console.error("Error updating user role:", error);
    return NextResponse.json({ error: "Failed to update user role." }, { status: 500 });
  }
}
