```tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-gray-600 mb-6">
          The page you're looking for doesn't exist.
        </p>
        <Link href="/" className="text-blue-600 hover:underline">
          Return to home
        </Link>
      </div>
    </div>
  );
}
```