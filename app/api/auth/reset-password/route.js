import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";

export async function POST(request) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: "Token and new password are required." },
        { status: 400 }
      );
    }

    const db = (await clientPromise).db();
    const passwordResetsCollection = db.collection("password_resets");

    const resetRecord = await passwordResetsCollection.findOne({ token });

    if (!resetRecord) {
      return NextResponse.json(
        { error: "Invalid or expired token." },
        { status: 400 }
      );
    }

    // Check token expiration
    const now = new Date();
    const expiresAt = new Date(resetRecord.expiresAt);
    if (now > expiresAt) {
      await passwordResetsCollection.deleteOne({ token }); 
      return NextResponse.json(
        { error: "Token has expired." },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user's password
    const usersCollection = db.collection("book_users");
    const updateResult = await usersCollection.updateOne(
      { email: resetRecord.email },
      { $set: { password: hashedPassword } }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    // Delete the used token
    await passwordResetsCollection.deleteOne({ token });

    return NextResponse.json(
      { message: "Password has been successfully reset." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error during password reset:", error);
    return NextResponse.json(
      { error: "Failed to reset password. Please try again later." },
      { status: 500 }
    );
  }
}
