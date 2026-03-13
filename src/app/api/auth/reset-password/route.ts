import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateToken, hashToken } from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Look up user — respond with the same message regardless of whether
    // the account exists to prevent email enumeration
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      // Delete any existing password_reset tokens for this user
      await prisma.verificationToken.deleteMany({
        where: { userId: user.id, type: "password_reset" },
      });

      const rawToken = generateToken();
      const hashedToken = hashToken(rawToken);

      await prisma.verificationToken.create({
        data: {
          userId: user.id,
          token: hashedToken,
          type: "password_reset",
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        },
      });

      await sendPasswordResetEmail(email, rawToken);
    }

    // Always return 200 to prevent email enumeration
    return NextResponse.json({
      message: "If an account exists for that email, a reset link has been sent.",
    });
  } catch (error) {
    console.error("Password reset request failed:", error);
    return NextResponse.json(
      { error: "Failed to process reset request" },
      { status: 500 }
    );
  }
}
