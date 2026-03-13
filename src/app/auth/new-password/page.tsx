```tsx
export default function NewPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Set New Password</h1>
        
        <form className="space-y-4">
          <div>
            <Label htmlFor="password">New Password</Label>
            <Input id="password" type="password" required minLength={8} />
          </div>
          
          <div>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input id="confirmPassword" type="password" required />
          </div>
          
          <Button type="submit" className="w-full">
            Update Password
          </Button>
        </form>
      </div>
    </div>
  );
}
```