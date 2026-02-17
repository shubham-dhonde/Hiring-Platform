import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeScore } from "@/lib/scoring";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const includeScore = request.nextUrl.searchParams.get("score") === "true";

  const session = await prisma.session.findUnique({
    where: { id },
    include: {
      events: { orderBy: { timestamp: "asc" } },
      chatMessages: { orderBy: { timestamp: "asc" } },
      testRuns: { orderBy: { timestamp: "asc" } },
    },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (includeScore) {
    const scoring = await computeScore(id);
    return NextResponse.json({ ...session, scoring });
  }

  return NextResponse.json(session);
}
