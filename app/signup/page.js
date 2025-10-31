"use client"
import { useState } from "react"
import axios from "axios"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, User, Mail, Lock, ArrowRight } from "lucide-react"

export default function Signup() {
  const [name, setName] = useState("")
  const [surname, setSurname] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("client")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [passwordError, setPasswordError] = useState(null)
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)
    setPasswordError(null)

    // Validate password strength
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/
    if (!passwordRegex.test(password)) {
      setPasswordError("Password must be at least 8 characters long and include at least one letter and one number.")
      return // Prevent form submission if password is invalid
    }

    setIsLoading(true)
    try {
      const response = await axios.post("/api/auth/signup", {
        name,
        surname,
        email,
        password,
        role,
      })

      if (response.status === 201) {
        setSuccessMessage("Account created successfully! Please check your email to verify your account.")
        setTimeout(() => {
          router.push("/verify-notice") // Redirect to verify notice page
        }, 1000) // 1 seconds delay
      }
    } catch (error) {
      console.error("Error during signup:", error)

      if (error.response && error.response.status === 409) {
        setErrorMessage("This email is already registered. Please use a different email.")
      } else {
        setErrorMessage("Signup failed. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div className="fixed inset-0 bg-bookscape-bg text-bookscape-text font-serif overflow-hidden">
      <div className="w-full h-full md:w-1/2 flex flex-col justify-center items-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-4 text-center">
            <h1 className="text-3xl font-serif font-bold text-bookscape-dark">Join Bookscape</h1>
            <p className="text-gray-600 mt-1">Create an account to start your reading journey</p>
          </div>

          {/* Error and Success Messages */}
          {errorMessage && (
            <div className="bg-red-100 text-red-700 p-2 rounded-lg mb-3">
              <p>{errorMessage}</p>
            </div>
          )}
          {successMessage && (
            <div className="bg-green-100 text-green-700 p-2 rounded-lg mb-3">
              <p>{successMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Name and surname fields */}
              <div className="relative">
                <label className="text-sm font-medium text-gray-700 mb-1 block" htmlFor="name">
                  First Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                    <User size={18} />
                  </span>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    required
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10 w-full p-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bookscape-gold focus:border-transparent transition-all"
                    placeholder="John"
                  />
                </div>
              </div>

              <div className="relative">
                <label className="text-sm font-medium text-gray-700 mb-1 block" htmlFor="surname">
                  Last Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                    <User size={18} />
                  </span>
                  <input
                    type="text"
                    id="surname"
                    value={surname}
                    required
                    onChange={(e) => setSurname(e.target.value)}
                    className="pl-10 w-full p-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bookscape-gold focus:border-transparent transition-all"
                    placeholder="Doe"
                  />
                </div>
              </div>
            </div>

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
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 w-full p-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bookscape-gold focus:border-transparent transition-all"
                  placeholder="Create a strong password"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {passwordError && <p className="text-red-500 text-sm mt-1">{passwordError}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-bookscape-dark text-white font-medium p-3 rounded-lg hover:bg-bookscape-darker focus:outline-none focus:ring-2 focus:ring-bookscape-dark focus:ring-offset-2 transition-all flex items-center justify-center space-x-2"
            >
              <span>{isLoading ? "Creating Account..." : "Create Account"}</span>
              {!isLoading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-gray-600">
              Already have an account?{" "}
              <span
                onClick={() => router.push("/login")}
                className="text-bookscape-gold font-medium cursor-pointer hover:text-bookscape-dark transition-colors"
              >
                Sign in
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
