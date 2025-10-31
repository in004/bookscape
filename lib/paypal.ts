import axios from "axios"
import checkoutNodeJssdk from "@paypal/checkout-server-sdk"

// Base URL for PayPal API (sandbox or production)
const PAYPAL_BASE_URL =
  process.env.NODE_ENV === "production" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com"

// Types for PayPal responses
interface PayPalOrderResponse {
  id: string
  status: string
  links: Array<{
    href: string
    rel: string
    method: string
  }>
}

interface PayPalCreateOrderResult {
  id: string
  approvalUrl: string
}

export function getPayPalClient() {
  const clientId = process.env.PAYPAL_CLIENT_ID
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing PayPal client credentials. Please set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET environment variables.",
    )
  }

  // Log which environment we're using
  const isProduction = process.env.NODE_ENV === "production"
  console.log(`Using PayPal ${isProduction ? "Production" : "Sandbox"} environment`)

  const environment = isProduction
    ? new checkoutNodeJssdk.core.LiveEnvironment(clientId, clientSecret)
    : new checkoutNodeJssdk.core.SandboxEnvironment(clientId, clientSecret)

  return new checkoutNodeJssdk.core.PayPalHttpClient(environment)
}

/**
 * Generate PayPal access token for REST API operations
 * Used for direct REST API calls
 */
export async function generateAccessToken() {
  try {
    const clientId = process.env.PAYPAL_CLIENT_ID
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      throw new Error("Missing PayPal client credentials")
    }

    const response = await axios({
      url: `${PAYPAL_BASE_URL}/v1/oauth2/token`,
      method: "post",
      data: "grant_type=client_credentials",
      auth: {
        username: clientId,
        password: clientSecret,
      },
    })

    return response.data.access_token
  } catch (error) {
    console.error("Failed to generate PayPal access token:", error)
    throw new Error("Failed to generate PayPal access token")
  }
}

/**
 * Create a PayPal order using the REST API
 */
export async function createPayPalOrder(items: any[], total: number): Promise<PayPalCreateOrderResult> {
  try {
    const accessToken = await generateAccessToken()

    const response = await axios({
      url: `${PAYPAL_BASE_URL}/v2/checkout/orders`,
      method: "post",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      data: {
        intent: "CAPTURE",
        purchase_units: [
          {
            items: items.map((item) => ({
              name: item.title.substring(0, 127),
              description: item.author ? `By ${item.author}`.substring(0, 127) : undefined,
              quantity: item.quantity.toString(),
              unit_amount: {
                currency_code: "USD",
                value: item.price.toFixed(2),
              },
            })),
            amount: {
              currency_code: "USD",
              value: total.toFixed(2),
              breakdown: {
                item_total: {
                  currency_code: "USD",
                  value: total.toFixed(2),
                },
              },
            },
          },
        ],
        application_context: {
          return_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/checkout/success`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/cart`,
          shipping_preference: "NO_SHIPPING",
          user_action: "PAY_NOW",
          brand_name: "BookScape",
        },
      },
    })

    return {
      id: response.data.id,
      approvalUrl: response.data.links.find((link: any) => link.rel === "approve")?.href,
    }
  } catch (error) {
    console.error("Error creating PayPal order:", error)
    throw error
  }
}

/**
 * Create a PayPal order using the SDK
 * Alternative implementation using the SDK instead of REST API
 */
export async function createPayPalOrderWithSDK(items: any[], total: number): Promise<PayPalCreateOrderResult> {
  try {
    const client = getPayPalClient()
    const request = new checkoutNodeJssdk.orders.OrdersCreateRequest()

    request.prefer("return=representation")
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: total.toFixed(2),
            breakdown: {
              item_total: {
                currency_code: "USD",
                value: total.toFixed(2),
              },
              discount: {
                currency_code: "USD",
                value: "0.00",
              },
              handling: {
                currency_code: "USD",
                value: "0.00",
              },
              insurance: {
                currency_code: "USD",
                value: "0.00",
              },
              shipping_discount: {
                currency_code: "USD",
                value: "0.00",
              },
              shipping: {
                currency_code: "USD",
                value: "0.00",
              },
              tax_total: {
                currency_code: "USD",
                value: "0.00",
              },
            },
          },
          items: items.map((item) => ({
            name: item.title.substring(0, 127),
            unit_amount: {
              currency_code: "USD",
              value: item.price.toFixed(2),
            },
            quantity: item.quantity.toString(),
            category: "PHYSICAL_GOODS", // Added required category field
          })),
        },
      ],
      application_context: {
        return_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/checkout/success`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/cart`,
        user_action: "PAY_NOW",
        brand_name: "BookScape",
      },
    })

    const response = await client.execute(request)
    const result = response.result as PayPalOrderResponse

    const approvalLink = result.links.find((link) => link.rel === "approve")

    if (!approvalLink) {
      throw new Error("No approval URL found in PayPal response")
    }

    return {
      id: result.id,
      approvalUrl: approvalLink.href,
    }
  } catch (error) {
    console.error("Error creating PayPal order with SDK:", error)
    throw error
  }
}

/**
 * Capture a PayPal payment
 */
export async function capturePayPalPayment(orderId: string): Promise<any> {
  try {
    const accessToken = await generateAccessToken()

    console.log(`Capturing payment for order: ${orderId}`)

    const response = await axios({
      url: `${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`,
      method: "post",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        // Add a unique request ID to prevent duplicate captures
        "PayPal-Request-Id": `capture-${orderId}-${Date.now()}`,
      },
    })

    console.log("Capture response status:", response.status)

    // For debugging purposes, log some key information
    if (response.data && response.data.purchase_units) {
      const purchaseUnit = response.data.purchase_units[0]
      if (purchaseUnit && purchaseUnit.payments && purchaseUnit.payments.captures) {
        const capture = purchaseUnit.payments.captures[0]
        console.log("Funds captured:", {
          amount: capture.amount.value,
          currency: capture.amount.currency_code,
          status: capture.status,
          merchantId: capture.payee?.merchant_id || "Not available",
        })
      }
    }

    return response.data
  } catch (error: any) {
    // Enhanced error logging
    if (error.response) {
      console.error("PayPal API error response:", {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
      })
    } else {
      console.error("Error capturing PayPal payment:", error.message)
    }
    throw error
  }
}

/**
 * Capture a PayPal payment using the SDK
 * Alternative implementation using the SDK instead of REST API
 */
export async function capturePayPalPaymentWithSDK(orderId: string): Promise<any> {
  try {
    const client = getPayPalClient()
    const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(orderId)

    // Don't pass an empty object to requestBody
    // The SDK will handle the necessary parameters internally

    const response = await client.execute(request)
    return response.result
  } catch (error) {
    console.error("Error capturing PayPal payment with SDK:", error)
    throw error
  }
}

/**
 * Get PayPal order details
 */
export async function getPayPalOrderDetails(orderId: string): Promise<any> {
  try {
    const accessToken = await generateAccessToken()

    const response = await axios({
      url: `${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}`,
      method: "get",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    })

    return response.data
  } catch (error) {
    console.error("Error getting PayPal order details:", error)
    throw error
  }
}

/**
 * Get PayPal order details using the SDK
 * Alternative implementation using the SDK instead of REST API
 */
export async function getPayPalOrderDetailsWithSDK(orderId: string): Promise<any> {
  try {
    const client = getPayPalClient()
    const request = new checkoutNodeJssdk.orders.OrdersGetRequest(orderId)
    const response = await client.execute(request)
    return response.result
  } catch (error) {
    console.error("Error getting PayPal order details with SDK:", error)
    throw error
  }
}

// Export a default client for backward compatibility
export default {
  client: getPayPalClient,
  createOrder: createPayPalOrder,
  capturePayment: capturePayPalPayment,
  getOrderDetails: getPayPalOrderDetails,
}
