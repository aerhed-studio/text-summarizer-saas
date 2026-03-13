import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // 1. Get session → 401 if no session
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(req.url);
    let page = parseInt(searchParams.get("page") || "1", 10);
    let limit = parseInt(searchParams.get("limit") || "10", 10);

    // Validate pagination parameters
    if (page < 1) page = 1;
    if (limit < 1 || limit > 50) limit = 10;

    // 2. Get history entries
    const analyses = await prisma.analysis.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        inputSnippet: true,
        readabilityScore: true,
        readabilityLabel: true,
        keywords: true,
        createdAt: true,
      },
    });

    // 3. Get total count
    const total = await prisma.analysis.count({
      where: { userId: session.user.id },
    });

    return NextResponse.json({
      data: analyses,
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error("History fetch failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch history" },
      { status: 500 }
    );
  }
}
