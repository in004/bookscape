import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import clientPromise from "@/lib/mongodb"
import { capturePayPalPayment, getPayPalOrderDetails } from "@/lib/paypal"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json()
    const { orderId } = requestBody

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()

    const existingOrder = await db.collection("orders").findOne({
      paypalOrderId: orderId,
      paymentStatus: "completed",
    })

    if (existingOrder) {
      return NextResponse.json({
        success: true,
        message: "Order already processed",
        orderId: existingOrder._id.toString(),
      })
    }

    let orderDetails = null
    try {
      orderDetails = await getPayPalOrderDetails(orderId)
      if (orderDetails.status === "COMPLETED") {
        await updateOrderInDatabase(db, orderId, orderDetails)
        return NextResponse.json({
          success: true,
          message: "Order was already captured",
          details: orderDetails,
        })
      }
    } catch (detailsError) {
      console.error("Failed to fetch PayPal order details:", detailsError)
    }

    const captureResult = await capturePayPalPayment(orderId)
    await updateOrderInDatabase(db, orderId, captureResult)

    return NextResponse.json({
      success: true,
      message: "Payment captured successfully",
      details: captureResult,
    })
  } catch (error: any) {
    console.error("Capture Payment Server Error:", error)

    // Try to fallback update if PayPal capture failed
    try {
      const requestBody = await request.json()
      const { orderId } = requestBody
      const client = await clientPromise
      const db = client.db()

      const existingOrder = await db.collection("orders").findOne({ paypalOrderId: orderId })

      if (existingOrder) {
        await db.collection("orders").updateOne(
          { _id: existingOrder._id },
          {
            $set: {
              paymentStatus: "completed",
              status: "processing",
              updatedAt: new Date(),
              captureError: error?.message || "Unknown capture error",
            },
          },
        )

        await updateBookStock(db, existingOrder.items)

        return NextResponse.json({
          success: true,
          message: "Order processed (capture had errors)",
          error: error.message || "Unknown error",
        })
      }
    } catch (fallbackError) {
      console.error("Fallback DB update failed:", fallbackError)
    }

    return NextResponse.json(
      {
        error: "Failed to capture payment",
        details: error?.message || "Unexpected server error",
      },
      { status: 500 },
    )
  }
}

// Stock update logic
async function updateBookStock(db: any, items: any[]) {
  for (const item of items) {
    if (!item.bookId) continue
    try {
      const bookId = typeof item.bookId === "string" ? new ObjectId(item.bookId) : item.bookId
      const book = await db.collection("books").findOne({ _id: bookId })
      if (!book) continue

      const newStock = Math.max(0, (book.stock || 0) - (item.quantity || 1))
      await db.collection("books").updateOne({ _id: bookId }, { $set: { stock: newStock } })
    } catch (err) {
      console.error("Stock update error:", err)
    }
  }
}

// Order update logic
async function updateOrderInDatabase(db: any, orderId: string, paypalResult: any) {
  const order = await db.collection("orders").findOne({ paypalOrderId: orderId })

  if (order) {
    await db.collection("orders").updateOne(
      { _id: order._id },
      {
        $set: {
          paymentStatus: "completed",
          status: "processing",
          updatedAt: new Date(),
          paypalResponse: paypalResult,
        },
      },
    )
    await updateBookStock(db, order.items)
  } else {
    const totalAmount = Number(paypalResult?.purchase_units?.[0]?.amount?.value || 0)
    await db.collection("orders").insertOne({
      paypalOrderId: orderId,
      paymentId: orderId,
      paymentStatus: "completed",
      status: "processing",
      items: [],
      totalAmount,
      paypalResponse: paypalResult,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }
}
