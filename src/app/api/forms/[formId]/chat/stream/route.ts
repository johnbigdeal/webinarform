import { chatEmitter } from "@/lib/chat-emitter";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ formId: string }> }
) {
  const { formId } = await params;
  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  // Load last 50 messages from DB to prepopulate chat
  const { prisma } = await import("@/lib/prisma");
  const pastMessages = await prisma.chatMessage.findMany({
    where: { formId },
    orderBy: { createdAt: "asc" },
    take: 50,
  });

  // Write past messages first
  for (const msg of pastMessages) {
    await writer.write(encoder.encode(`data: ${JSON.stringify(msg)}\n\n`));
  }

  // Handler for new messages
  const onMessage = (newMessage: any) => {
    writer.write(encoder.encode(`data: ${JSON.stringify(newMessage)}\n\n`)).catch(() => {});
  };

  // Subscribe to emitter
  chatEmitter.on(`message:${formId}`, onMessage);

  // Keep alive interval to prevent timeout (every 15s)
  const keepAlive = setInterval(() => {
    writer.write(encoder.encode(": keepalive\n\n")).catch(() => {});
  }, 15000);

  // Clean up when connection closes
  req.signal.addEventListener("abort", () => {
    chatEmitter.off(`message:${formId}`, onMessage);
    clearInterval(keepAlive);
    try {
      writer.close();
    } catch {}
  });

  return new Response(responseStream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    },
  });
}
