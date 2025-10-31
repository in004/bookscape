import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import nodemailer from "nodemailer";
import crypto from "crypto";

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function POST(req: Request) {
  try {
    const db = (await clientPromise).db();
    const subscribersCollection = db.collection("Subscriber");

    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const existing = await subscribersCollection.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: "Already subscribed" }, { status: 400 });
    }

    const unsubscribeToken = crypto.randomBytes(32).toString("hex");

    await subscribersCollection.insertOne({ email, unsubscribeToken, subscribedAt: new Date() });

    const unsubscribeUrl = `${process.env.FRONTEND_URL}/unsubscribe?token=${unsubscribeToken}`;
    const homepageUrl = process.env.FRONTEND_URL; 

    const mailOptions = {
      from: process.env.SMTP_EMAIL,
      to: email,
      subject: "Welcome to Bookscape! Your Reading Adventure Awaits!",
      
      html: `
        <div style="font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #fff;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding-bottom: 20px; text-align: center;">
                <h1 style="color: #2a52be; font-size: 28px; margin: 0;">Welcome to Bookscape!</h1>
                <p style="color: #666; font-size: 16px;">Your literary journey begins here.</p>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom: 20px;">
                <p style="font-size: 16px;">Hi there,</p>
                <p style="font-size: 16px;">
                  Thank you for subscribing to the Bookscape newsletter! We're thrilled to have you join our community of book lovers.
                </p>
                <p style="font-size: 16px;">
                  Get ready for exclusive updates on new releases, exciting events, special promotions, and hand-picked recommendations delivered right to your inbox.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom: 20px; text-align: center;">
                <a href="${homepageUrl}" style="display: inline-block; padding: 12px 25px; background-color: #2a52be; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                  Explore Bookscape Now!
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #777;">
                <p>You received this email because you subscribed to Bookscape's newsletter.</p>
                <p>
                  If you no longer wish to receive these emails, you can <a href="${unsubscribeUrl}" style="color: #007bff; text-decoration: underline;">unsubscribe here</a>.
                </p>
                <p>&copy; ${new Date().getFullYear()} Bookscape. All rights reserved.</p>
              </td>
            </tr>
          </table>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ message: `Subscribed with ${email}` }, { status: 200 });
  } catch (err) {
    console.error("Newsletter subscribe error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}