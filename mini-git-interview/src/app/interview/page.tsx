"use client";

import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import ChatPanel from "@/components/ChatPanel";
import TestResults from "@/components/TestResults";
import ProblemDescription from "@/components/ProblemDescription";
import { SessionRecorder } from "@/lib/session-recorder";
import { TestResult } from "@/types";

// Dynamic import for Monaco Editor to avoid SSR issues
const Editor = dynamic(() => import("@/components/Editor"), { ssr: false });

const DEFAULT_CODE = `// Implement the MiniGit class
class MiniGit {
  constructor() {
    // Your implementation here
  }

  init() {
    // Initialize a new repository
  }

  add(filename, content) {
    // Stage a file
  }

  commit(message) {
    // Create a commit, return a hash
  }

  log() {
    // Return commits in reverse chronological order
    // [{hash, message}]
  }

  branch(name) {
    // Create a new branch at current HEAD
  }

  checkout(branchName) {
    // Switch to an existing branch
  }

  status() {
    // Return {staged: [filenames]}
  }

  diff() {
    // Return [{file, status, oldContent?, newContent?}]
  }

  merge(branchName) {
    // Merge branch into current
    // Return {conflicts: [filenames]}
  }
}
`;

function InterviewContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");

  const [editorCode, setEditorCode] = useState(DEFAULT_CODE);
  const [testResults, setTestResults] = useState<TestResult[] | null>(null);
  const [testScore, setTestScore] = useState(0);
  const [tierScores, setTierScores] = useState<Record<string, number> | null>(null);
  const [hiddenSummary, setHiddenSummary] = useState<{
    total: number;
    passed: number;
  } | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const recorderRef = useRef<SessionRecorder | null>(null);

  // Initialize session recorder
  useEffect(() => {
    if (!sessionId) return;

    const recorder = new SessionRecorder(sessionId);
    recorder.start();
    recorderRef.current = recorder;

    return () => {
      recorder.stop();
    };
  }, [sessionId]);

  const handleEditorChange = useCallback(
    (value: string) => {
      setEditorCode(value);
    },
    []
  );

  const handleEditorChanges = useCallback(
    (changes: unknown[]) => {
      recorderRef.current?.recordChange(changes, editorCode);
    },
    [editorCode]
  );

  const handleRunTests = useCallback(async () => {
    if (!sessionId || isRunningTests) return;

    setIsRunningTests(true);
    try {
      const res = await fetch("/api/run-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, code: editorCode }),
      });

      const data = await res.json();
      setTestResults(data.results);
      setTestScore(data.score);
      setTierScores(data.tierScores);
      setHiddenSummary(data.hiddenSummary);
      recorderRef.current?.recordTestRun(data.score);
    } catch {
      // Error handling - keep previous results
    } finally {
      setIsRunningTests(false);
    }
  }, [sessionId, editorCode, isRunningTests]);

  // Keyboard shortcut: Ctrl/Cmd+Enter to run tests
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleRunTests();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleRunTests]);

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
        <p>No session ID found. Please start from the landing page.</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-zinc-950 text-zinc-200 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900 shrink-0">
        <h1 className="text-sm font-semibold">Mini Git Interview</h1>
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span>Session: {sessionId.slice(0, 8)}...</span>
          <span className="text-zinc-600">Ctrl+Enter to run tests</span>
        </div>
      </header>

      {/* Main grid */}
      <div className="flex-1 grid grid-cols-[1fr_380px] gap-2 p-2 overflow-hidden">
        {/* Left panel: Problem + Editor + Tests */}
        <div className="flex flex-col gap-2 overflow-hidden">
          <ProblemDescription />

          <div className="flex-1 min-h-0">
            <Editor
              value={editorCode}
              onChange={handleEditorChange}
              onEditorChange={handleEditorChanges}
            />
          </div>

          <div className="h-[220px] shrink-0">
            <TestResults
              results={testResults}
              score={testScore}
              tierScores={tierScores}
              hiddenSummary={hiddenSummary}
              isRunning={isRunningTests}
              onRunTests={handleRunTests}
            />
          </div>
        </div>

        {/* Right panel: Chat */}
        <div className="overflow-hidden">
          <ChatPanel
            sessionId={sessionId}
            editorCode={editorCode}
            onChatSend={() => {
              recorderRef.current?.recordChatSend(0);
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default function InterviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
          Loading...
        </div>
      }
    >
      <InterviewContent />
    </Suspense>
  );
}
