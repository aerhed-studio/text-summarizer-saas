```tsx
"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DeleteAccountDialog from "@/components/DeleteAccountDialog";

export default function SettingsPage() {
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "email", value: email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update email");
      }

      setSuccess("Email updated successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          type: "password", 
          value: newPassword,
          currentPassword
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update password");
      }

      setSuccess("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete account");
      }

      // Redirect to home page after deletion
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl font-bold mb-8">Account Settings</h1>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-md">
            {success}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Email Update */}
          <Card className="p-6">
            <CardHeader>
              <CardTitle>Update Email</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEmailUpdate} className="space-y-4">
                <div>
                  <Label htmlFor="email">New Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit">Update Email</Button>
              </form>
            </CardContent>
          </Card>
          
          {/* Password Update */}
          <Card className="p-6">
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>
                <Button type="submit">Update Password</Button>
              </form>
            </CardContent>
          </Card>
        </div>
        
        {/* Delete Account */}
        <Card className="mt-8 p-6">
          <CardHeader>
            <CardTitle>Delete Account</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Deleting your account will remove all your data permanently.
            </p>
            <DeleteAccountDialog
              onConfirm={handleDeleteAccount}
              isDeleting={isDeleting}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
```