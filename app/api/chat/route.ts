import { chat, toServerSentEventsStream } from "@tanstack/ai";
import { createGemini } from "@tanstack/ai-gemini";
import { getSystemPrompt } from "@/lib/push-notification-guidelines";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY is not set" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create Gemini adapter
    const adapter = createGemini(process.env.GEMINI_API_KEY);

    // Get system prompt with guidelines
    const systemPrompt = getSystemPrompt();

    // Create chat stream
    const stream = await chat({
      adapter,
      model: "gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        ...messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
        })),
      ],
      temperature: 0.7,
      maxTokens: 500,
    });

    // Convert to SSE stream response
    return new Response(toServerSentEventsStream(stream), {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("Error in chat API:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

