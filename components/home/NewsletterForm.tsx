"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";

export default function NewsletterForm() {
  const [emailInput, setEmailInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(""); 

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: emailInput }),
      });

      let data;
      try {
        data = await res.json();
      } catch (jsonError) {
        console.warn("Failed to parse JSON response (may be empty or plain text):", jsonError);
        data = { error: res.statusText || "An unexpected error occurred." };
      }

      if (!res.ok) {
        setMessage(data.error || "Subscription failed. Please try again.");
        return; 
      }

      
      setMessage(`Thank you for subscribing with ${emailInput}!`);
      setEmailInput("");

    } catch (error: any) {
      console.error("Network or unexpected subscription error:", error); 
      setMessage("Subscription failed due to a network issue or server problem. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-16 bg-bookscape-dark text-white">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-3xl font-serif font-bold mb-4">Stay Updated</h2>
        <p className="text-gray-300 mb-8 max-w-xl mx-auto">
          Subscribe to our newsletter for the latest book arrivals, offers, and events.
        </p>
        <form onSubmit={handleSubmit} className="max-w-lg mx-auto">
          <div className="flex">
            <input
              type="email"
              placeholder="Enter your email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              required
              disabled={isSubmitting}
              className="flex-grow px-4 py-3 rounded-l-md text-bookscape-dark focus:outline-none focus:ring-2 focus:ring-bookscape-gold disabled:opacity-70"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-bookscape-gold text-bookscape-dark px-6 py-3 rounded-r-md font-medium hover:bg-bookscape-gold-hover transition flex items-center disabled:opacity-70"
            >
              {isSubmitting ? "Subscribing..." : "Subscribe"}
              {!isSubmitting && <ArrowRight size={16} className="ml-2" />}
            </button>
          </div>
          {message && <p className="mt-4 text-sm text-gray-300">{message}</p>}
        </form>
      </div>
    </section>
  );
}