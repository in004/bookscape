import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/auth"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import type { NextRequest } from "next/server"
import type { Session } from "next-auth"

export async function POST(request: NextRequest) {
  try {
    const { orderId, paypalOrderId } = await request.json()

    // Get the user session
    const session = (await getServerSession(authOptions as any)) as Session | null

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const userEmail = session.user.email

    console.log("Marking order as successful:", orderId, "for user:", userEmail)

    const client = await clientPromise
    const db = client.db()

    // First, try to find the order by PayPal order ID if provided
    let query = {}

    if (paypalOrderId) {
      query = { paypalOrderId: paypalOrderId }
    } else if (orderId) {
      // Convert orderId to ObjectId if it's a string
      try {
        const orderObjectId = typeof orderId === "string" ? new ObjectId(orderId) : orderId
        query = { _id: orderObjectId }
      } catch (error) {
        console.error("Invalid order ID format:", orderId)
        return NextResponse.json({ error: "Invalid order ID" }, { status: 400 })
      }
    } else {
      return NextResponse.json({ error: "Either orderId or paypalOrderId is required" }, { status: 400 })
    }

    // Update the order status to completed and ensure user email is set
    const updateResult = await db.collection("orders").updateOne(query, {
      $set: {
        status: "completed",
        userEmail: userEmail, 
        updatedAt: new Date(),
        completedAt: new Date(),
      },
    })

    console.log("Update result:", updateResult)

    if (updateResult.matchedCount === 0) {
      console.error("Order not found with query:", query)
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("Error marking order as successful:", error)
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 })
  }
}
