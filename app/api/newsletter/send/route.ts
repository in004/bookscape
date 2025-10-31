import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
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

     const db = (await clientPromise).db();
    const subscribersCollection = db.collection("Subscriber");

    // Get the email content from the request body
    const { subject, htmlContent } = await req.json();

    if (!subject || !htmlContent) {
      return NextResponse.json({ error: "Missing subject or HTML content" }, { status: 400 });
    }

    // Fetch all subscribers
    const subscribers = await subscribersCollection.find({}).toArray();

    if (subscribers.length === 0) {
      return NextResponse.json({ message: "No subscribers found to send emails." }, { status: 200 });
    }

    let emailsSentCount = 0;
    let errorsSendingCount = 0;
    const failedEmails: string[] = [];

    // Send email to each subscriber
    for (const subscriber of subscribers) {
      const unsubscribeUrl = `${process.env.FRONTEND_URL}/unsubscribe?token=${subscriber.unsubscribeToken}`;

      const mailOptions = {
        from: process.env.SMTP_EMAIL,
        to: subscriber.email,
        subject: subject,
        html: `${htmlContent}
            <br><br>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 0.8em; color: #888;">
              If you no longer wish to receive these emails, you can <a href="${unsubscribeUrl}" style="color: #007bff;">unsubscribe here</a>.
            </p>`,
      };

      try {
        await transporter.sendMail(mailOptions);
        emailsSentCount++;
        console.log(`Email sent to: ${subscriber.email}`);
      } catch (error) {
        errorsSendingCount++;
        failedEmails.push(subscriber.email);
        console.error(`Failed to send email to ${subscriber.email}:`, error);
      }
    }

    return NextResponse.json({
      message: `Newsletter sending completed. Sent to ${emailsSentCount} subscribers.`,
      totalSubscribers: subscribers.length,
      emailsSent: emailsSentCount,
      errors: errorsSendingCount,
      failedEmails: failedEmails,
    }, { status: 200 });

  } catch (error) {
    console.error("Error sending newsletter:", error);
    return NextResponse.json({ error: "Server error during newsletter sending" }, { status: 500 });
  }
}