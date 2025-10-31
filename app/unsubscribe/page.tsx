"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, XCircle, Loader2 } from "lucide-react"; 

export default function UnsubscribePage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Processing your unsubscribe request...");

  useEffect(() => {
    async function unsubscribe() {
      if (!token) {
        setStatus("error");
        setMessage("Oops! It looks like the unsubscribe link is missing information. Please try again or contact support if the issue persists.");
        return;
      }

      try {
        const res = await fetch(`/api/newsletter/unsubscribe?token=${token}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        let data;
        try {
          data = await res.json();
        } catch (jsonError) {
          console.warn("Failed to parse JSON response for unsubscribe (may be empty or plain text):", jsonError);
          data = { message: res.statusText || "Something went wrong on our end." };
        }

        if (!res.ok) {
          setStatus("error");
          setMessage(data?.error || "We couldn't process your unsubscribe request. The link might be invalid or expired.");
          return;
        }

        setStatus("success");
        setMessage(data?.message || "You've successfully unsubscribed from Bookscape updates. We'll miss you!");

        // Redirect to home after a short delay
        setTimeout(() => {
          router.push("/");
        }, 2500);
      } catch (error) {
        setStatus("error");
        setMessage("A network error occurred. Please check your internet connection and try again.");
        console.error("Unsubscribe fetch error:", error);
      }
    }

    unsubscribe();
  }, [token, router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full text-center border border-gray-200">
        <div className="mb-6">
          {status === "loading" && (
            <Loader2 className="animate-spin text-blue-500 mx-auto h-12 w-12" />
          )}
          {status === "success" && (
            <CheckCircle className="text-green-500 mx-auto h-12 w-12" />
          )}
          {status === "error" && (
            <XCircle className="text-red-500 mx-auto h-12 w-12" />
          )}
        </div>

        <h1 className="text-3xl font-extrabold text-gray-900 mb-3">
          {status === "loading" && "Unsubscribing..."}
          {status === "success" && "Successfully Unsubscribed!"}
          {status === "error" && "Unsubscribe Failed"}
        </h1>

        <p className={`text-lg mb-6 ${status === "success" ? "text-gray-700" : "text-gray-600"}`}>
          {message}
        </p>

        {status === "success" && (
          <p className="text-sm text-gray-500 mt-4">
            You'll be redirected to the homepage shortly.
          </p>
        )}

        {status === "error" && (
          <a
            href="/"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            Go to Homepage
          </a>
        )}
      </div>
    </main>
  );
}