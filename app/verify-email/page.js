"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"

export default function VerifyEmail() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const router = useRouter()
  const [status, setStatus] = useState("Verifying...")

  useEffect(() => {
    if (!token) {
      setStatus("Invalid verification link.")
      return
    }
    ;(async () => {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${token}`)
        const data = await res.json()
        if (res.ok) {
          setStatus(data.message)
        } else {
          setStatus(data.error)
        }
      } catch {
        setStatus("An unexpected error occurred. Please try again.")
      }
    })()
  }, [token])

  return (
    <div className="fixed inset-0 bg-bookscape-bg text-bookscape-text font-serif overflow-hidden">
      <div className="w-full h-full flex flex-col items-center justify-center p-6">
        <div className="bg-white shadow-xl rounded-2xl p-10 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-bookscape-dark mb-4">Email Verification</h1>
          <p className="mb-6 text-gray-600">{status}</p>
          {status === "Email verified successfully!" && (
            <button
              onClick={() => router.push("/login")}
              className="bg-bookscape-dark hover:bg-bookscape-darker text-white font-medium px-6 py-2 rounded-lg transition-all"
            >
              Go to Login
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
