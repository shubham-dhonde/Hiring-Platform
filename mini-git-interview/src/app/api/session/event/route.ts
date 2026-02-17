import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface EventPayload {
  type: string;
  data: string;
  timestamp?: string;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { sessionId, events } = body as {
    sessionId: string;
    events: EventPayload | EventPayload[];
  };

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const eventList = Array.isArray(events) ? events : [events];

  await prisma.event.createMany({
    data: eventList.map((e) => ({
      sessionId,
      type: e.type,
      data: typeof e.data === "string" ? e.data : JSON.stringify(e.data),
      timestamp: e.timestamp ? new Date(e.timestamp) : new Date(),
    })),
  });

  return NextResponse.json({ ok: true, count: eventList.length });
}
