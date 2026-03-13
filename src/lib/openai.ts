import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function analyseText(text: string): Promise<{
  summary: string;
  keywords: string[];
}> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a text analysis assistant. Given a passage of text, return a JSON object with exactly two keys:
- "summary": a 3-5 sentence summary of the text (abstractive, in your own words, capturing the main idea)
- "keywords": an array of 8-12 significant terms or short phrases from the text (nouns, proper nouns, technical terms; no stop words)

Return only valid JSON. No markdown. No explanation.`,
      },
      { role: "user", content: text },
    ],
  });

  const raw = response.choices[0].message.content ?? "{}";
  const parsed = JSON.parse(raw);

  return {
    summary: String(parsed.summary ?? ""),
    keywords: Array.isArray(parsed.keywords) ? parsed.keywords.map(String) : [],
  };
}
