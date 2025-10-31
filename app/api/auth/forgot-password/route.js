import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { v4 as uuidv4 } from "uuid";
import clientPromise from "@/lib/mongodb";

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const db = (await clientPromise).db();
    const usersCollection = db.collection("book_users");
    const passwordResetsCollection = db.collection("password_resets");

    const user = await usersCollection.findOne({ email });

    // Always respond with the same message to avoid revealing which emails exist
    const genericResponse = {
      message: "If an account with this email exists, a password reset link has been sent.",
    };

    if (!user) {
      return NextResponse.json(genericResponse, { status: 200 });
    }

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

    await passwordResetsCollection.insertOne({ email, token, expiresAt });

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_EMAIL,
      to: email,
      subject: "Password Reset Request",
      text: `You can reset your password using this link: ${resetLink}

      If you did not request this, please ignore this email.`,
    });

    return NextResponse.json(genericResponse, { status: 200 });
  } catch (error) {
    console.error("Password reset email error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  }
}
