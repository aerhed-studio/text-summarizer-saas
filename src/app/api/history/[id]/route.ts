```ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 1. Get session → 401 if none
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // 2. Find analysis
    const analysis = await prisma.analysis.findUnique({
      where: { id: params.id },
    });
    
    if (!analysis) {
      return NextResponse.json(
        { error: "Analysis not found" },
        { status: 404 }
      );
    }
    
    // 3. Ownership check
    if (analysis.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }
    
    // 4. Delete analysis
    await prisma.analysis.delete({
      where: { id: params.id },
    });
    
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    console.error("History delete failed:", error);
    return NextResponse.json(
      { error: "Failed to delete analysis" },
      { status: 500 }
    );
  }
}
```