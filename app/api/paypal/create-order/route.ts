import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/auth"
import clientPromise from "@/lib/mongodb"
import type { NextRequest } from "next/server"
import type { Session } from "next-auth"

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    const { items, totalAmount } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      console.error("Invalid items in request:", items)
      return NextResponse.json({ error: "Invalid items in request" }, { status: 400 })
    }

    if (typeof totalAmount !== "number" || totalAmount <= 0) {
      console.error("Invalid total amount:", totalAmount)
      return NextResponse.json({ error: "Invalid total amount" }, { status: 400 })
    }

    console.log("Processing order request with items:", items.length, "Total:", totalAmount)

    // Get the user session
    const session = (await getServerSession(authOptions as any)) as Session | null

    if (!session?.user?.email) {
      console.error("Authentication required - no valid session")
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const userEmail = session.user.email
    console.log("Creating PayPal order for user:", userEmail)

    // Connect to the database
    const client = await clientPromise
    const db = client.db()

    // Find the user
    const user = await db.collection("book_users").findOne({ email: userEmail })

    if (!user) {
      console.error("User not found in database:", userEmail)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Create PayPal order
    const paypalBaseUrl = process.env.PAYPAL_BASE_URL || "https://api-m.sandbox.paypal.com"
    console.log("Using PayPal base URL:", paypalBaseUrl)

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken()
    console.log("PayPal access token obtained successfully")

    const paypalResponse = await fetch(`${paypalBaseUrl}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "USD",
              value: totalAmount.toFixed(2),
            },
            description: `BookScape Order - ${items.length} item(s)`,
          },
        ],
        application_context: {
          return_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/checkout/success`,
          cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/checkout/cancel`,
        },
      }),
    })

    // Check if the response is OK
    if (!paypalResponse.ok) {
      const errorText = await paypalResponse.text()
      console.error("PayPal API Error Response:", paypalResponse.status, errorText)

      let errorJson = {}
      try {
        errorJson = JSON.parse(errorText)
      } catch (e) {
        console.error("Failed to parse PayPal error response as JSON")
      }

      return NextResponse.json(
        {
          error: "Failed to create PayPal order",
          details: errorJson,
          status: paypalResponse.status,
        },
        { status: 500 },
      )
    }

    const paypalOrder = await paypalResponse.json()
    console.log("PayPal order created:", paypalOrder.id)

    // Save order to our database
    const order = {
      items,
      totalAmount,
      status: "pending",
      deliveryStatus: "pending", 
      userEmail: userEmail, // This is the key field for filtering
      userId: user._id,
      userName: user.name || session.user.name,
      paypalOrderId: paypalOrder.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("orders").insertOne(order)
    console.log("Order saved to database with ID:", result.insertedId)

    // Find the approval URL
    const approvalUrl = paypalOrder.links?.find((link: any) => link.rel === "approve")?.href

    if (!approvalUrl) {
      console.error("No approval URL found in PayPal response:", paypalOrder)
      return NextResponse.json({ error: "No approval URL returned from PayPal" }, { status: 500 })
    }

    return NextResponse.json({
      orderId: result.insertedId,
      paypalOrderId: paypalOrder.id,
      approvalUrl: approvalUrl,
      success: true,
    })
  } catch (error) {
    console.error("Error creating order:", error)
    return NextResponse.json(
      {
        error: "Failed to create order",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET
  const baseUrl = process.env.PAYPAL_BASE_URL || "https://api-m.sandbox.paypal.com"

  if (!clientId || !clientSecret) {
    throw new Error("PayPal credentials not configured")
  }

  console.log("Requesting PayPal access token from:", baseUrl)

  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("PayPal token error:", response.status, errorText)
    throw new Error(`Failed to get PayPal access token: ${response.status} ${errorText}`)
  }

  const data = await response.json()
  return data.access_token
}
