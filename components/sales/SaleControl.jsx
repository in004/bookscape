// components/sales/SaleControl.jsx
"use client";

import { useState, useEffect } from "react";
import { Loader2, Send } from "lucide-react"; // Import icons for sending status

export default function SaleDialog({ open, onClose }) {
  const [salePercentage, setSalePercentage] = useState(0);
  const [isApplying, setIsApplying] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const presetPercentages = [5, 10, 15, 20, 25, 30, 40, 50];

  // Effect to clear messages and reset percentage when dialog opens or closes
  useEffect(() => {
    if (!open) {
      setError(null);
      setSuccessMessage(null);
      setSalePercentage(0); // Reset percentage when closed
    }
  }, [open]);

  const handleApplySale = async () => {
    if (salePercentage <= 0) {
      setError("Please enter a valid sale percentage greater than 0.");
      return;
    }

    try {
      setIsApplying(true);
      setError(null);
      setSuccessMessage(null); // Clear previous messages

      // --- Step 1: Apply Sale to Books ---
      const applySaleResponse = await fetch("/api/books/apply-sale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salePercentage }),
      });

      let applySaleData;
      try {
        const text = await applySaleResponse.text();
        applySaleData = text ? JSON.parse(text) : {};
      } catch {
        throw new Error("Server returned an invalid response format for applying sale.");
      }

      if (!applySaleResponse.ok) {
        throw new Error(applySaleData.message || "Failed to apply sale to books.");
      }

      // --- Step 2: Send Newsletter Email ---
      setIsSendingEmail(true); // Indicate email sending is starting

      // ✨ Automatically generate subject and HTML content here ✨
      const subject = `🔥 FLASH SALE: Get ${salePercentage}% OFF All Books at Bookscape!`;
      const htmlContent = `
        <p style="font-family: Arial, sans-serif; font-size: 16px; color: #333;">
          Hello Bookscape fan!
        </p>
        <p style="font-family: Arial, sans-serif; font-size: 16px; color: #333;">
          Exciting news! We're having a special **flash sale** just for you.
        </p>
        <p style="font-family: Arial, sans-serif; font-size: 24px; font-weight: bold; color: #E53E3E; text-align: center; margin: 20px 0;">
          Enjoy a massive ${salePercentage}% OFF across our entire store!
        </p>
        <p style="font-family: Arial, sans-serif; font-size: 16px; color: #555;">
          This is the perfect chance to discover your next favorite read or stock up on bestsellers. Don't miss out on these incredible savings, available for a limited time only.
        </p>
        <p style="text-align: center; margin-top: 30px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}" target="_blank" style="
            display: inline-block;
            padding: 12px 25px;
            background-color: #4CAF50; /* Green button */
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            font-size: 18px;
          ">Shop the Sale Now!</a>
        </p>
        <p style="font-family: Arial, sans-serif; font-size: 14px; color: #777; margin-top: 40px;">
          Happy reading!
        </p>
      `;

      const sendEmailResponse = await fetch("/api/newsletter/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, htmlContent }),
      });

      let sendEmailData;
      try {
        const text = await sendEmailResponse.text();
        sendEmailData = text ? JSON.parse(text) : {};
      } catch {
        throw new Error("Server returned an invalid response format for sending email.");
      }

      if (!sendEmailResponse.ok) {
        throw new Error(sendEmailData.error || "Failed to send newsletter.");
      }

      setSuccessMessage(
        `${applySaleData.message || `Sale applied to books successfully!`}. ${sendEmailData.message || `Newsletter sent to ${sendEmailData.emailsSent} subscribers.`}`
      );
      // Reset percentage only
      setSalePercentage(0);

      // Keep the dialog open for a few seconds to show success, then close
      setTimeout(() => {
        onClose();
        window.location.reload(); // Reload page to reflect changes
      }, 3000);

    } catch (err) {
      setError(err.message || "An error occurred during the sale process.");
    } finally {
      setIsApplying(false);
      setIsSendingEmail(false);
    }
  };

  const handleUndoSale = async () => {
    try {
      setIsApplying(true);
      setError(null);
      setSuccessMessage(null);

      const response = await fetch("/api/books/remove-sale", {
        method: "POST",
      });

      let data;
      try {
        const text = await response.text();
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error("Server returned an invalid response format for removing sale");
      }

      if (!response.ok) {
        throw new Error(data.message || "Failed to remove sale from books");
      }

      setSuccessMessage(data.message || "Sale removed successfully!");
      // Reset percentage when sale is undone
      setSalePercentage(0);
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 2000);

    } catch (err) {
      setError(err.message || "An error occurred while removing the sale");
    } finally {
      setIsApplying(false);
    }
  };

  const handlePresetSelection = (percentage) => {
    setSalePercentage(percentage);
    // No need to set name/description state as they are now generated dynamically
  };

  if (!open) return null;

  const isProcessing = isApplying || isSendingEmail;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 overflow-y-auto max-h-[90vh]">
        <h2 className="text-xl font-serif font-semibold text-bookscape-dark mb-4">
          Apply Global Sale & Send Newsletter
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-600">
            {successMessage}
          </div>
        )}

        <div className="space-y-4">
          {/* Sale Percentage Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Choose Sale Percentage (%)
            </label>
            <div className="flex flex-wrap gap-2 mb-4">
              {presetPercentages.map((percentage) => (
                <button
                  key={percentage}
                  type="button"
                  onClick={() => handlePresetSelection(percentage)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${salePercentage === percentage
                      ? "bg-bookscape-gold text-black"
                      : "bg-amber-50 text-gray-800 hover:bg-amber-100"
                    }`}
                  disabled={isProcessing}
                >
                  {percentage}%
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center mt-4 p-3 bg-amber-50 rounded-md text-sm">
            <div className="mr-3 text-amber-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <p className="text-amber-800">
              This will apply the discount to all books and send a pre-formatted email to your subscribers.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-amber-100">
          <button
            onClick={handleUndoSale}
            disabled={isProcessing}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors font-medium disabled:opacity-50"
          >
            Undo Sale
          </button>

          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            onClick={handleApplySale}
            disabled={isProcessing || salePercentage <= 0} // Now only checks salePercentage
            className="flex items-center gap-2 px-4 py-2 bg-bookscape-gold text-bookscape-dark rounded-md hover:bg-amber-400 transition-colors font-medium disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <Loader2 className="animate-spin h-4 w-4" />
                {isSendingEmail ? "Sending Emails..." : "Applying..."}
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Apply & Send Email
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}