import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

interface StockValidationItem {
  id: string
  requestedQuantity: number
}

interface StockValidationRequest {
  items: StockValidationItem[]
}

export async function POST(request: NextRequest) {
  try {
    const body: StockValidationRequest = await request.json()
    const { items } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No items provided for validation" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()
    const errors = []

    // Step 1: Validate stock
    for (const item of items) {
      try {
        let query: any
        if (ObjectId.isValid(item.id)) {
          query = { _id: new ObjectId(item.id) }
        } else {
          query = { id: item.id }
        }

        const book = await db.collection("books").findOne(query)

        if (!book) {
          errors.push({
            itemId: item.id,
            requestedQuantity: item.requestedQuantity,
            availableStock: 0,
            title: "Unknown Book",
            error: "Book not found",
          })
          continue
        }

        const availableStock = book.stock || 0

        if (item.requestedQuantity > availableStock) {
          errors.push({
            itemId: item.id,
            requestedQuantity: item.requestedQuantity,
            availableStock: availableStock,
            title: book.title || "Unknown Book",
          })
        }
      } catch (error) {
        console.error(`Error validating stock for item ${item.id}:`, error)
        errors.push({
          itemId: item.id,
          requestedQuantity: item.requestedQuantity,
          availableStock: 0,
          title: "Unknown Book",
          error: "Validation failed",
        })
      }
    }

    // If there are validation errors, return without updating stock
    if (errors.length > 0) {
      return NextResponse.json({
        valid: false,
        errors: errors,
      })
    }

    // Step 2: Deduct stock
    for (const item of items) {
      let query: any
      if (ObjectId.isValid(item.id)) {
        query = { _id: new ObjectId(item.id) }
      } else {
        query = { id: item.id }
      }

      await db.collection("books").updateOne(query, {
        $inc: { stock: -item.requestedQuantity },
      })
    }

    return NextResponse.json({
      valid: true,
      message: "Stock validated and updated successfully.",
    })
  } catch (error) {
    console.error("Stock validation error:", error)
    return NextResponse.json(
      {
        error: "Failed to validate and update stock",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
