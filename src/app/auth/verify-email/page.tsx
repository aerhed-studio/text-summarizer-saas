"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      // No token — user arrived here after signup, not from the email link
      return;
    }

    // Token present — validate it
    setStatus("loading");
    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setStatus("error");
          setMessage(data.error);
        } else {
          setStatus("success");
          setMessage("Your email has been verified. You can now log in.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Verification failed. Please try again.");
      });
  }, [token]);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4">Verify Your Email</h1>
          <p className="text-gray-600 mb-6">
            Please check your email for a verification link. We&apos;ve sent an email to your inbox.
          </p>
          <p className="text-sm text-gray-500">
            Didn&apos;t receive the email? Check your spam folder.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4">Email Verification</h1>
        {status === "loading" && <p className="text-gray-600">Verifying your email...</p>}
        {status === "success" && (
          <>
            <p className="text-green-600 mb-6">{message}</p>
            <Link href="/auth/login" className="text-blue-600 hover:underline">
              Go to Login
            </Link>
          </>
        )}
        {status === "error" && (
          <p className="text-red-600">{message}</p>
        )}
      </div>
    </div>
  );
}
