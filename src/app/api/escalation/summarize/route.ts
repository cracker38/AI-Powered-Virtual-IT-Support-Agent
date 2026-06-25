import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "",
});

export async function POST(req: Request) {
  try {
    const { history } = await req.json();

    if (!history || history.length === 0) {
      return NextResponse.json({ summary: "New IT support request." });
    }

    // Format history for Groq
    const conversation = history.map((msg: any) => `${msg.role}: ${msg.content}`).join("\n");

    const prompt = `Summarize the following IT support chat conversation in one short, descriptive sentence (max 20 words). focus on the technical problem being reported:
    
    ${conversation}`;

    let summary = "Technical issue reported via chat.";

    if (process.env.GROQ_API_KEY) {
      const response = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.3-70b-versatile",
        temperature: 0.3,
        max_tokens: 100,
      });

      summary = response.choices[0]?.message?.content?.trim() || summary;
    } else {
      // Fallback for demo mode
      const lastUserMsg = [...history].reverse().find(m => m.role === "user");
      summary = lastUserMsg ? `Issue with: ${lastUserMsg.content.substring(0, 50)}...` : summary;
    }

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Summarization error:", error);
    return NextResponse.json({ error: "Failed to summarize chat" }, { status: 500 });
  }
}
