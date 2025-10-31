"use client"

import { getSession } from "next-auth/react"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { Eye, EyeOff, Mail, Lock } from "lucide-react"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("")
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const resetToken = searchParams.get("reset")

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    const response = await signIn("credentials", {
      redirect: false,
      email,
      password,
    })

    if (response?.error) {
      alert("Login failed. Please check your credentials.")
    } else if (response?.ok) {
      const session = await getSession()
      console.log("Client-side session after login:", session)
      const userRole = session?.user?.role
      console.log("User Role:", userRole)

      // Redirect based on role
      if (userRole === "admin") {
        router.push("/dashboard/admin")
      } else {
        // All other roles (including client) go to homepage
        router.push("/")
      }
    }

    setIsLoading(false)
  }

  const handleForgotPasswordSubmit = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotPasswordEmail }),
      })

      const data = await response.json()
      alert(data.message || "If your email exists, a reset link was sent.")
    } catch (error) {
      alert("Something went wrong. Try again.")
    }
    setIsLoading(false)
    setIsForgotPasswordOpen(false)
  }

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, newPassword }),
      })

      const data = await response.json()
      if (response.ok) {
        alert(data.message || "Password reset successfully.")
        router.push("/login")
      } else {
        alert(data.error || "Reset failed.")
      }
    } catch (err) {
      alert("Something went wrong.")
    }

    setIsLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-bookscape-bg text-bookscape-text font-serif overflow-hidden">
      <div className="w-full h-full md:w-1/2 flex flex-col justify-center items-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-4 text-center">
            <h1 className="text-3xl font-serif font-bold text-bookscape-dark">
              {resetToken ? "Reset Password" : "Welcome Back"}
            </h1>
            {!resetToken && <p className="text-gray-600 mt-1">Sign in to continue your journey</p>}
          </div>

          <form onSubmit={resetToken ? handleResetPasswordSubmit : handleLoginSubmit} className="space-y-3">
            <div className="relative">
              <label className="text-sm font-medium text-gray-700 mb-1 block" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                  <Mail size={18} />
                </span>
                <input
                  type="email"
                  id="email"
                  value={email}
                  required
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 w-full p-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bookscape-gold focus:border-transparent transition-all"
                  placeholder="john.doe@example.com"
                />
              </div>
            </div>

            {resetToken ? (
              <>
                <div className="relative">
                  <label className="text-sm font-medium text-gray-700 mb-1 block" htmlFor="new-password">
                    New Password
                  </label>
                  <input
                    type="password"
                    id="new-password"
                    value={newPassword}
                    required
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10 w-full p-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bookscape-gold focus:border-transparent transition-all"
                    placeholder="Enter new password"
                  />
                </div>

                <div className="relative">
                  <label className="text-sm font-medium text-gray-700 mb-1 block" htmlFor="confirm-password">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    id="confirm-password"
                    value={confirmPassword}
                    required
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 w-full p-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bookscape-gold focus:border-transparent transition-all"
                    placeholder="Confirm new password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-bookscape-dark text-white font-medium p-3 rounded-lg hover:bg-bookscape-darker transition"
                >
                  {isLoading ? "Resetting..." : "Update Password"}
                </button>
              </>
            ) : (
              <>
                <div className="relative">
                  <label className="text-sm font-medium text-gray-700 mb-1 block" htmlFor="password">
                    Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                      <Lock size={18} />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      value={password}
                      required
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 w-full p-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bookscape-gold focus:border-transparent transition-all"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-bookscape-dark text-white font-medium p-3 rounded-lg hover:bg-bookscape-darker transition"
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </button>
              </>
            )}
          </form>

          {!resetToken && (
            <div className="mt-4 text-center">
              <span
                onClick={() => setIsForgotPasswordOpen(true)}
                className="text-bookscape-gold font-medium cursor-pointer hover:text-bookscape-dark transition"
              >
                Forgot Password?
              </span>
              <p className="text-gray-600 mt-2">
                Don't have an account?{" "}
                <span
                  onClick={() => router.push("/signup")}
                  className="text-bookscape-gold font-medium cursor-pointer hover:text-bookscape-dark transition"
                >
                  Register here
                </span>
              </p>
            </div>
          )}
        </div>
      </div>

      {isForgotPasswordOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-bookscape-dark bg-opacity-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full shadow-xl">
            <h3 className="text-xl font-serif font-bold text-bookscape-dark mb-4">Enter your email</h3>
            <div className="relative mb-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  className="pl-10 w-full p-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bookscape-gold focus:border-transparent transition-all"
                  placeholder="Enter your email address"
                />
              </div>
            </div>
            <div className="flex justify-between">
              <button
                onClick={() => setIsForgotPasswordOpen(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleForgotPasswordSubmit}
                className="bg-bookscape-dark text-white px-4 py-2 rounded-lg hover:bg-bookscape-darker transition"
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Send Reset Link"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
