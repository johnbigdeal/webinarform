import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { chatEmitter } from "@/lib/chat-emitter";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await params;
    const body = await req.json().catch(() => ({}));
    const { senderName, message, isAdmin } = body;

    const trimmedName = senderName?.trim();
    const trimmedMessage = message?.trim();

    if (!trimmedName || !trimmedMessage) {
      return NextResponse.json(
        { error: "Name and message are required" },
        { status: 400 }
      );
    }

    // Verify if sender is allowed to send an admin message
    let actualAdmin = false;
    if (isAdmin) {
      const session = await auth();
      if (session?.user?.id) {
        if (session.user.role === "ADMIN") {
          actualAdmin = true;
        } else {
          const form = await prisma.form.findUnique({ where: { id: formId } });
          if (form && form.ownerId === session.user.id) {
            actualAdmin = true;
          }
        }
      }
    }

    const newMessage = await prisma.chatMessage.create({
      data: {
        formId,
        senderName: trimmedName,
        message: trimmedMessage,
        isAdmin: actualAdmin,
      },
    });

    // Broadcast to the event emitter for active streams
    chatEmitter.emit(`message:${formId}`, newMessage);

    return NextResponse.json(newMessage);
  } catch (error) {
    console.error("Chat POST error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
