Context                                                                                                                                                                                                                                   
​
 Build a browser-based coding interview platform (Cursor-like) where candidates solve a complex coding problem ("Mini Git" - an in-memory version control system) with access to a lightweight LLM chat assistant. The platform records
 all interactions and generates scores based on correctness, process quality, and AI usage intelligence. This is a greenfield POC to validate the concept.
​
 Confirmed Requirements
​
 - Frontend: Next.js 15 + TypeScript + Tailwind CSS
 - Editor: Monaco Editor (@monaco-editor/react)
 - Database: SQLite via Prisma
 - Code execution: isolated-vm (V8 isolate for sandboxed JS execution)
 - LLM: Azure OpenAI API (GPT-4.1-mini on Azure Foundry)
 - Language: JavaScript only (candidate writes JS)
 - Access: Open URL, no auth
 - Timer: None for POC
 - Scope: Candidate-facing view only (no admin panel)
 - Chat context: Hard limit of last 4-5 messages + current editor code, with visible context indicator
 - LLM sees editor code: Auto-included in every LLM call
 - Session recording: Every keystroke + chat messages + test events, batched every 2 seconds
​
 Architecture
​
 Browser (Next.js)
 ├── Monaco Editor component
 ├── Chat Panel component (with context indicator)
 ├── Test Results panel
 ├── Problem Description panel (collapsible)
 └── Session Recorder (captures keystrokes, batches to server)
​
 Next.js API Routes
 ├── POST /api/chat           → Proxy to Azure OpenAI, enforce context limits, SSE streaming
 ├── POST /api/run-tests      → Load code in isolated-vm, run test suite, return results
 ├── POST /api/session/start  → Create new session, return session ID
 ├── POST /api/session/event  → Record batched session events
 └── GET  /api/session/[id]   → Retrieve full session data
​
 SQLite Database (via Prisma)
 ├── sessions (id, startedAt, endedAt)
 ├── events (id, sessionId, type, data JSON, timestamp)
 ├── chatMessages (id, sessionId, role, content, tokensUsed, timestamp)
 └── testRuns (id, sessionId, resultsJson, score, tier1-5 scores, timestamp)
​
 Project Structure
​
 mini-git-interview/
 ├── package.json
 ├── next.config.js
 ├── tsconfig.json
 ├── .env.local
 ├── prisma/
 │   └── schema.prisma
 ├── src/
 │   ├── app/
 │   │   ├── layout.tsx
 │   │   ├── page.tsx                    (landing page with "Start Interview" button)
 │   │   ├── interview/
 │   │   │   └── page.tsx                (main interview page - editor + chat + tests)
 │   │   └── api/
 │   │       ├── chat/route.ts
 │   │       ├── run-tests/route.ts
 │   │       └── session/
 │   │           ├── start/route.ts
 │   │           ├── event/route.ts
 │   │           └── [id]/route.ts
 │   ├── components/
 │   │   ├── Editor.tsx
 │   │   ├── ChatPanel.tsx
 │   │   ├── TestResults.tsx
 │   │   ├── ProblemDescription.tsx
 │   │   └── ContextIndicator.tsx
 │   ├── lib/
 │   │   ├── db.ts                       (Prisma client singleton)
 │   │   ├── azure-openai.ts             (Azure OpenAI client)
 │   │   ├── test-runner.ts              (isolated-vm execution engine)
 │   │   ├── test-suite.ts               (28 test cases across 5 tiers)
 │   │   ├── context-manager.ts          (LLM context window management)
 │   │   ├── session-recorder.ts         (client-side event capture + batching)
 │   │   └── scoring.ts                  (correctness + process + AI adoption signals)
 │   └── types/
 │       └── index.ts
​
 Implementation Steps
​
 Phase 1: Foundation
​
 1. Initialize project - create-next-app with TypeScript, Tailwind, App Router, src dir. Install deps: @monaco-editor/react, openai, isolated-vm, uuid, @prisma/client, prisma.
 2. Configure Next.js - next.config.js must exclude isolated-vm from webpack bundling via serverExternalPackages: ['isolated-vm'].
 3. Set up env vars - .env.local with DATABASE_URL, AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, AZURE_OPENAI_API_VERSION, AZURE_OPENAI_DEPLOYMENT.
 4. Create Prisma schema - prisma/schema.prisma with 4 tables: Session, Event, ChatMessage, TestRun. Indexes on (sessionId, timestamp). Run npx prisma migrate dev --name init.
 5. Create type definitions - src/types/index.ts with all interfaces for events, chat, test results, scoring signals.
 6. Create Prisma client singleton - src/lib/db.ts using the standard Next.js pattern (global singleton to prevent multiple instances during hot reload).
 7. Build session API routes:
   - POST /api/session/start → creates session, returns { sessionId }
   - POST /api/session/event → accepts single or batched events, validates session exists
   - GET /api/session/[id] → returns full session with events, chat messages, test runs
​
 Verify: curl to create session, post events, retrieve session data.
​
 Phase 2: Editor + Test Runner
​
 8. Build Monaco Editor component - src/components/Editor.tsx. Wraps @monaco-editor/react with JS language, dark theme, onDidChangeModelContent listener for granular change tracking.
 9. Write the Mini Git test suite - src/lib/test-suite.ts. 28 test cases across 5 tiers:
   - Tier 1 (7 tests, 25pts, visible): init, add, commit, log basics
   - Tier 2 (6 tests, 25pts, visible): branch, checkout, branch isolation, error on bad checkout
   - Tier 3 (6 tests, 20pts, hidden): status(), diff() for added/modified/deleted files
   - Tier 4 (4 tests, 20pts, hidden): fast-forward merge, three-way merge, conflict detection, non-conflicting merge
   - Tier 5 (5 tests, 10pts, hidden): empty commit error, duplicate branch error, empty log, consistency under complex operations, add overwrite behavior
​
 Each test creates a fresh new MiniGit() instance, calls methods in sequence, asserts results. Uses assert() and assertEqual() helpers.
 10. Build test runner - src/lib/test-runner.ts. Uses isolated-vm:
   - Creates isolate with 128MB memory limit
   - Loads candidate code into a V8 context
   - Runs each test with 5s timeout per test
   - Serializes test functions via .toString() and re-declares assertion helpers inside the isolate
   - Returns array of { name, tier, passed, error, visible } results
   - Handles global errors (syntax errors, crashes) gracefully
 11. Build test runner API route - POST /api/run-tests. Receives { sessionId, code }, calls runTestsInIsolate(), calculates tier scores, saves TestRun to DB, records a session event, returns visible results (tiers 1-2 full detail) +
 hidden summary (tiers 3-5 pass count only).
 12. Build Test Results component - src/components/TestResults.tsx. Shows "Run Tests" button, score, per-test pass/fail for visible tiers, summary for hidden tiers, tier breakdown bar.
​
 Verify: Write a reference MiniGit implementation, run tests via curl, confirm correct pass/fail. Test with bad code, infinite loops, syntax errors.
​
 Phase 3: LLM Chat
​
 13. Build Azure OpenAI client - src/lib/azure-openai.ts. Singleton AzureOpenAI client from openai package with endpoint, API key, API version, deployment name from env vars.
 14. Build context manager - src/lib/context-manager.ts. Key parameters:
   - Max 5 messages (hard limit)
   - Max 8000 tokens total budget
   - Editor content capped at 3000 tokens (~12000 chars)
   - System prompt includes problem context + current editor code
   - Token estimation: Math.ceil(text.length / 4)
   - Returns { messages, contextInfo } where contextInfo shows messages included, percent used
 15. Build chat API route - POST /api/chat. Flow:
   - Save user message to DB
   - Retrieve last 10 messages from DB
   - Call buildChatMessages() to apply context limits
   - Create streaming response from Azure OpenAI
   - Stream SSE chunks to client with data: {content, contextInfo} format
   - On stream complete, save full assistant response to DB
   - Return text/event-stream response
 16. Build Context Indicator component - src/components/ContextIndicator.tsx. Shows X/5 msgs + progress bar + percentage. Color coded: green < 60%, yellow 60-85%, red > 85%.
 17. Build Chat Panel component - src/components/ChatPanel.tsx. Message list with auto-scroll, streaming display with cursor animation, textarea input with Shift+Enter for newline / Enter to send, disabled state during loading.
​
 Verify: Send messages via the UI, confirm streaming works, send 6+ messages and verify old messages get dropped from context.
​
 Phase 4: Assembly + Session Recording
​
 18. Build Problem Description component - src/components/ProblemDescription.tsx. Collapsible panel showing the MiniGit problem spec: all 9 methods with signatures and expected return types.
 19. Build session recorder - src/lib/session-recorder.ts (client-side). SessionRecorder class:
   - Buffers events, flushes every 2 seconds or at 50 events
   - Records: editor changes (with periodic full snapshots every 20 changes), keystrokes (excluding modifier-only), paste events (truncated to 1000 chars), focus/blur, chat sends, test runs
   - Retry on flush failure (re-prepend to buffer)
 20. Build main interview page - src/app/interview/page.tsx. CSS Grid layout:
 Left (60-65%): Problem Description (top, collapsible) | Editor (fill) | Test Results (bottom)
 Right (35-40%): Chat Panel (full height)
 20. State: sessionId, editorContent, chatMessages, testResults, isRunningTests, isChatLoading. On mount: create or resume session from URL params, start session recorder. Wire all component callbacks.
 21. Build landing page - src/app/page.tsx. Title, brief instructions, "Start Interview" button that POSTs to /api/session/start then navigates to /interview?session=<id>.
​
 Verify: Full manual walkthrough - start session, type code, send chats, run tests, check SQLite for all event types.
​
 Phase 5: Scoring + Polish
​
 22. Build scoring module - src/lib/scoring.ts. Computes:
   - Correctness (automated): Latest test run score (0-100)
   - Process signals (raw data for manual review): total editor changes, test run count, time to first test run, edit-test iteration cycles, paste events, avg time between test runs
   - AI adoption signals (raw data for manual review): total messages, avg prompt length, questions asked, code request count, total tokens used, messages before/after first test run
 23. Add score endpoint - Extend GET /api/session/[id] to optionally include computed scores, or add GET /api/session/[id]/score.
 24. UI polish:
   - Loading states on all async operations
   - Error boundaries for Monaco editor failures
   - Keyboard shortcut: Ctrl/Cmd+Enter to run tests
   - Responsive layout adjustments
   - Clear error messages for test failures (syntax error vs timeout vs runtime error)
​
 Key Technical Decisions
​
 ┌──────────────────┬──────────────────────────────────┬─────────────────────────────────────────────────────────────────────────────────────┐
 │     Decision     │              Choice              │                                      Rationale                                      │
 ├──────────────────┼──────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────┤
 │ Code execution   │ isolated-vm                      │ Real V8 isolate with memory/timeout limits, no Docker overhead, ~5ms startup        │
 ├──────────────────┼──────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────┤
 │ Context limit    │ 5 messages + 8000 tokens         │ Forces strategic LLM use; editor code always included so LLM is useful              │
 ├──────────────────┼──────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────┤
 │ Test visibility  │ Tiers 1-2 visible, 3-5 hidden    │ Candidates can validate basics but must anticipate edge cases                       │
 ├──────────────────┼──────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────┤
 │ Event batching   │ 2s interval / 50 event buffer    │ Prevents HTTP request flood from keystroke recording                                │
 ├──────────────────┼──────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────┤
 │ SSE streaming    │ Web Streams API in route handler │ Native Next.js 15 support, no extra dependencies                                    │
 ├──────────────────┼──────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────┤
 │ Token estimation │ text.length / 4                  │ Simple heuristic, sufficient for POC; slightly over-estimates which is conservative │
 └──────────────────┴──────────────────────────────────┴─────────────────────────────────────────────────────────────────────────────────────┘
​
 Risks and Mitigations
​
 1. isolated-vm native build issues - Requires C++ compilation. Ensure Xcode CLI tools on macOS. Fallback: vm2 package (less secure but pure JS).
 2. Monaco bundle size - @monaco-editor/react lazy-loads from CDN by default, acceptable for POC.
 3. SQLite write contention - Fine for single-user POC. For multi-user, add ?journal_mode=WAL to DB URL.
 4. SSE chunk parsing - reader.read() may return partial SSE frames. The client parser must handle split data: lines.
​
 Verification
​
 After completing all steps:
 1. Open http://localhost:3000, click "Start Interview"
 2. Write code in the editor, observe keystroke recording in DB
 3. Send chat messages, verify streaming + context indicator
 4. Implement partial MiniGit, run tests, see tier 1-2 pass/fail + tier 3-5 summary
 5. Complete implementation, run tests, verify score improves
 6. Submit code with syntax error / infinite loop, verify graceful error handling
 7. Query SQLite: check events table has keystroke/change/paste events, chat_messages has full conversation, test_runs shows score progression
 