import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { azureOpenAI } from "@/lib/azure-openai";
import { buildChatMessages } from "@/lib/context-manager";

export async function POST(request: NextRequest) {
  const { sessionId, message, editorCode } = await request.json();

  if (!sessionId || !message) {
    return new Response(JSON.stringify({ error: "sessionId and message are required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Save user message to DB
  const userTokens = Math.ceil(message.length / 4);
  await prisma.chatMessage.create({
    data: {
      sessionId,
      role: "user",
      content: message,
      tokensUsed: userTokens,
    },
  });

  // Record chat event
  await prisma.event.create({
    data: {
      sessionId,
      type: "chat_send",
      data: JSON.stringify({ role: "user", length: message.length }),
    },
  });

  // Retrieve recent messages from DB
  const dbMessages = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { timestamp: "asc" },
    take: 10,
  });

  const recentMessages = dbMessages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  // Build context-limited messages
  const { messages, contextInfo } = buildChatMessages(
    recentMessages,
    editorCode || ""
  );

  // Create SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let fullResponse = "";

      try {
        const completion = await azureOpenAI.chat.completions.create({
          model: process.env.AZURE_OPENAI_DEPLOYMENT!,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          stream: true,
          max_tokens: 1024,
          temperature: 0.7,
        });

        // Send context info as first event
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ contextInfo })}\n\n`)
        );

        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            fullResponse += content;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
            );
          }
        }

        // Save assistant response to DB
        const assistantTokens = Math.ceil(fullResponse.length / 4);
        await prisma.chatMessage.create({
          data: {
            sessionId,
            role: "assistant",
            content: fullResponse,
            tokensUsed: assistantTokens,
          },
        });

        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
      } catch (err: unknown) {
        const error = err as Error;
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ error: error.message || "LLM request failed" })}\n\n`
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
