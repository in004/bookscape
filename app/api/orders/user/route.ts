import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/auth"
import clientPromise from "@/lib/mongodb"
import type { NextRequest } from "next/server"
import type { Session } from "next-auth"

export async function GET(request: NextRequest) {
  try {
    // Get the user session
    const session = (await getServerSession(authOptions as any)) as Session | null

    // Check if session exists and has user with email
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const userEmail = session.user.email
    console.log("Fetching orders for user:", userEmail)

    // Connect to the database
    const client = await clientPromise
    const db = client.db()

    // Get only orders for the current user that are completed
    const userOrders = await db
      .collection("orders")
      .find({
        userEmail: userEmail,
        status: { $in: ["completed", "processing"] }, // Include both completed and processing orders
      })
      .sort({ createdAt: -1 }) // Sort by newest first
      .toArray()

    console.log(`Found ${userOrders.length} orders for user ${userEmail}`)

    return NextResponse.json(userOrders)
  } catch (error) {
    console.error("Error fetching user orders:", error)
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}
