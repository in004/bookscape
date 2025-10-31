import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import clientPromise from "@/lib/mongodb"
import type { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, currentPassword, newPassword } = await request.json()

    if (!email || !currentPassword || !newPassword) {
      return NextResponse.json({ error: "Email, current password, and new password are required." }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()
    const usersCollection = db.collection("book_users")

    // Find the user
    const user = await usersCollection.findOne({ email })

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 })
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password)
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 })
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update the password
    await usersCollection.updateOne({ email }, { $set: { password: hashedPassword, updatedAt: new Date() } })

    return NextResponse.json({ message: "Password updated successfully." }, { status: 200 })
  } catch (error) {
    console.error("Error changing password:", error)
    return NextResponse.json({ error: "Failed to change password. Please try again later." }, { status: 500 })
  }
}
