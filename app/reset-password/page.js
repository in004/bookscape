"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Lock } from "lucide-react"

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [token, setToken] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const tokenFromUrl = searchParams.get("token")
    if (tokenFromUrl) {
      setToken(tokenFromUrl)
    } else {
      setErrorMessage("Invalid or missing reset token.")
    }
  }, [searchParams])

  const handleSubmit = async (e) => {
    e.preventDefault()

    setErrorMessage("")
    setSuccessMessage("")

    if (!newPassword || !confirmPassword) {
      setErrorMessage("All fields are required.")
      return
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.")
      return
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrorMessage(data.error || "An error occurred. Please try again.")
        return
      }

      setSuccessMessage("Your password has been successfully reset.")
      setTimeout(() => router.push("/login"), 2000)
    } catch (error) {
      setErrorMessage("An unexpected error occurred. Please try again.")
    }
  }

  return (
    <div className="fixed inset-0 bg-bookscape-bg text-bookscape-text font-serif overflow-hidden">
      <div className="w-full h-full md:w-1/2 flex flex-col justify-center items-center p-6">
        <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-serif font-bold mb-6 text-center text-bookscape-dark">Reset Your Password</h1>

          {errorMessage && <p className="text-red-500 mb-4 text-center">{errorMessage}</p>}
          {successMessage && <p className="text-green-500 mb-4 text-center">{successMessage}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1 font-medium text-gray-700">New Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                  <Lock size={18} />
                </span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="pl-10 w-full p-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bookscape-gold focus:border-transparent transition-all"
                  placeholder="Enter new password"
                />
              </div>
            </div>

            <div>
              <label className="block mb-1 font-medium text-gray-700">Confirm New Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                  <Lock size={18} />
                </span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="pl-10 w-full p-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bookscape-gold focus:border-transparent transition-all"
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-bookscape-dark text-white py-2 px-4 rounded-md hover:bg-bookscape-darker transition"
            >
              Reset Password
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
