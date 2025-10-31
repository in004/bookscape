"use client"

import { Mail } from "lucide-react"
import { useRouter } from "next/navigation"

export default function VerifyNotice() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-bookscape-bg text-bookscape-text font-serif flex items-center justify-center px-4">
      <div className="bg-white shadow-xl rounded-2xl p-10 max-w-md w-full text-center">
        <div className="flex justify-center mb-6 text-bookscape-gold">
          <Mail size={48} />
        </div>
        <h1 className="text-2xl font-bold text-bookscape-dark mb-4">Verify your email</h1>
        <p className="text-gray-600 mb-8">
          We've sent you an email with a link to verify your account. Please check your inbox (and spam folder, just in
          case).
        </p>
        <button
          onClick={() => router.push("/login")}
          className="bg-bookscape-dark hover:bg-bookscape-darker text-white font-medium px-6 py-3 rounded-lg transition-all"
        >
          Go to Login
        </button>
      </div>
    </div>
  )
}
