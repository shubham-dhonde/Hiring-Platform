import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { runTestsInIsolate } from "@/lib/test-runner";

export async function POST(request: NextRequest) {
  const { sessionId, code } = await request.json();

  if (!sessionId || !code) {
    return NextResponse.json(
      { error: "sessionId and code are required" },
      { status: 400 }
    );
  }

  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const { results, score, tierScores } = await runTestsInIsolate(code);

  // Save test run to DB
  await prisma.testRun.create({
    data: {
      sessionId,
      resultsJson: JSON.stringify(results),
      score,
      tier1Score: tierScores.tier1 || 0,
      tier2Score: tierScores.tier2 || 0,
      tier3Score: tierScores.tier3 || 0,
      tier4Score: tierScores.tier4 || 0,
      tier5Score: tierScores.tier5 || 0,
    },
  });

  // Record a session event
  await prisma.event.create({
    data: {
      sessionId,
      type: "test_run",
      data: JSON.stringify({ score, tierScores }),
    },
  });

  // Visible results: tiers 1-2 with full detail
  const visibleResults = results.filter((r) => r.visible);
  // Hidden summary: tiers 3-5 pass count only
  const hiddenResults = results.filter((r) => !r.visible);
  const hiddenSummary = {
    total: hiddenResults.length,
    passed: hiddenResults.filter((r) => r.passed).length,
  };

  return NextResponse.json({
    results,
    score,
    tierScores,
    visibleResults,
    hiddenSummary,
  });
}
