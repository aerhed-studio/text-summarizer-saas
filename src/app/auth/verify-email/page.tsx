```tsx
export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4">Verify Your Email</h1>
        <p className="text-gray-600 mb-6">
          Please check your email for a verification link. We've sent an email to your inbox.
        </p>
        <p className="text-sm text-gray-500">
          Didn't receive the email? Check your spam folder or request another one.
        </p>
      </div>
    </div>
  );
}
```