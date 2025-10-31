"use client"

import type { ReactNode } from "react"
import { PayPalScriptProvider } from "@paypal/react-paypal-js"

export default function PayPalProvider({ children }: { children: ReactNode }) {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || ""

  return (
    <PayPalScriptProvider
      options={{
     clientId,
        currency: "USD",
        intent: "capture",
      }}
    >
      {children}
    </PayPalScriptProvider>
  )
}
