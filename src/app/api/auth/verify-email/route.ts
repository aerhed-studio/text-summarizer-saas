import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/tokens";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    const hashedToken = hashToken(token);

    // Find the verification token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token: hashedToken },
    });

    if (!verificationToken) {
      return NextResponse.json(
        { error: "Invalid or expired verification link" },
        { status: 400 }
      );
    }

    if (verificationToken.type !== "email_verification") {
      return NextResponse.json(
        { error: "Invalid token type" },
        { status: 400 }
      );
    }

    if (verificationToken.expiresAt < new Date()) {
      await prisma.verificationToken.delete({ where: { token: hashedToken } });
      return NextResponse.json(
        { error: "Verification link has expired. Please sign up again." },
        { status: 400 }
      );
    }

    // Mark user as verified and delete the token
    await prisma.user.update({
      where: { id: verificationToken.userId },
      data: { emailVerified: true },
    });

    await prisma.verificationToken.delete({ where: { token: hashedToken } });

    return NextResponse.json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("Email verification failed:", error);
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}
