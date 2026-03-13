```ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PATCH(req: NextRequest) {
  try {
    // 1. Get session → 401 if no session
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const { type, value, currentPassword } = await req.json();
    
    // 2. Handle update based on type
    if (type === "email") {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return NextResponse.json(
          { error: "Invalid email format" },
          { status: 400 }
        );
      }
      
      // Check if email is already taken
      const existingUser = await prisma.user.findUnique({
        where: { email: value },
      });
      
      if (existingUser && existingUser.id !== session.user.id) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 409 }
        );
      }
      
      // Update email
      await prisma.user.update({
        where: { id: session.user.id },
        data: { email: value },
      });
    } 
    else if (type === "password") {
      // Validate current password is provided
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Current password is required" },
          { status: 400 }
        );
      }
      
      // Verify current password
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
      });
      
      if (!user || !user.passwordHash) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }
      
      const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
      
      if (!isValid) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 }
        );
      }
      
      // Validate new password length
      if (value.length < 8) {
        return NextResponse.json(
          { error: "New password must be at least 8 characters" },
          { status: 400 }
        );
      }
      
      // Hash and update password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(value, saltRounds);
      
      await prisma.user.update({
        where: { id: session.user.id },
        data: { passwordHash: hashedPassword },
      });
    } 
    else {
      return NextResponse.json(
        { error: "Invalid update type" },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ message: "Updated successfully" });
  } catch (error) {
    console.error("Account update failed:", error);
    return NextResponse.json(
      { error: "Failed to update account" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // 1. Get session → 401 if no session
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // 2. Parse body for confirmation
    const { confirm } = await req.json();
    
    if (confirm !== true) {
      return NextResponse.json(
        { error: "Confirmation required to delete account" },
        { status: 400 }
      );
    }
    
    // 3. Delete user (cascades to analyses and tokens)
    await prisma.user.delete({
      where: { id: session.user.id },
    });
    
    return NextResponse.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Account deletion failed:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
```