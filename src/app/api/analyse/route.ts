```ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fleschKincaid } from "@/lib/readability";
import { analyseText } from "@/lib/openai";

export async function POST(req: NextRequest) {
  try {
    // 1. Parse body: { text: string }
    const { text } = await req.json();
    
    // 2. Validate: typeof text === "string", length 50–10000
    if (typeof text !== "string" || text.length < 50 || text.length > 10000) {
      return NextResponse.json(
        { error: "Text must be between 50 and 10000 characters" },
        { status: 400 }
      );
    }

    // 3. Get session (may be null for guests)
    const session = await auth();
    
    // 4. Start timer
    const start = Date.now();
    
    // 5. Compute readability
    const { score, label } = fleschKincaid(text);
    
    // 6. Call OpenAI
    const { summary, keywords } = await analyseText(text);
    
    // 7. processingMs = Date.now() - start
    const processingMs = Date.now() - start;
    
    // 8. If session?.user?.id: save to DB
    if (session?.user?.id) {
      await prisma.analysis.create({
        data: {
          userId: session.user.id,
          inputSnippet: text.slice(0, 200),
          inputLength: text.length,
          summary,
          keywords,
          readabilityScore: score,
          readabilityLabel: label,
          modelUsed: "gpt-4o-mini",
          processingMs,
        },
      });
    }
    
    // 9. Return JSON
    return NextResponse.json({
      summary,
      keywords,
      readabilityScore: score,
      readabilityLabel: label,
    });
  } catch (error) {
    console.error("Analysis failed:", error);
    return NextResponse.json(
      { error: "Analysis failed" },
      { status: 500 }
    );
  }
}
```