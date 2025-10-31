import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import User from "@/models/User";
import {connect} from "@/lib/dbConfig";
import crypto from "crypto";
import nodemailer from "nodemailer";


const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, surname, email, password } = body;

    if (!name || !surname || !email || !password) {
      return NextResponse.json(
        { error: "Name, surname, email, and password are required" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format." },
        { status: 400 }
      );
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        {
          error:
            "Password must be at least 8 characters long and include at least one letter and one number.",
        },
        { status: 400 }
      );
    }

    await connect()
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const verifyToken = crypto.randomBytes(32).toString("hex");
    const verifyTokenExpiry = Date.now() + 3600000; // Token expires in 1 hour

    // Create new user
    const newUser = new User({
      name,
      surname,
      email,
      password: hashedPassword,
      isVerified: false,
      verifyToken,
      verifyTokenExpiry,
      role: "client", 
    });

  
    await newUser.save();

    // Send verification email
    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verifyToken}`;

    const mailOptions = {
      from: process.env.SMTP_EMAIL,
      to: email,
      subject: "Email Verification",
      text: `Click the link to verify your email: ${verifyUrl}`,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json(
      { message: "Please verify your email to activate your account." },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error during signup:", error);
    return NextResponse.json(
      { error: "Failed to sign up user. Please try again." },
      { status: 500 }
    );
  }
}
