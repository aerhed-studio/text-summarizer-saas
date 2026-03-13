```tsx
"use client";

import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
        <h1 className="text-4xl font-bold mb-4">Something went wrong!</h1>
        <p className="text-gray-600 mb-6">
          {error.message}
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try again
          </button>
          <Link href="/" className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
            Return to home
          </Link>
        </div>
      </div>
    </div>
  );
}
```