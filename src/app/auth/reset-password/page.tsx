```tsx
export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Reset Password</h1>
        <p className="text-gray-600 mb-6">
          Enter your email address and we'll send you a link to reset your password.
        </p>
        
        <form className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required />
          </div>
          
          <Button type="submit" className="w-full">
            Send Reset Link
          </Button>
        </form>
      </div>
    </div>
  );
}
```