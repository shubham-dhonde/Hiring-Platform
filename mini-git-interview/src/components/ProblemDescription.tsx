"use client";

import { useState } from "react";

export default function ProblemDescription() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-md overflow-hidden">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-3 py-2 bg-zinc-800 hover:bg-zinc-750 transition-colors"
      >
        <h3 className="text-sm font-semibold text-zinc-200">
          Problem: Mini Git
        </h3>
        <span className="text-zinc-400 text-xs">
          {collapsed ? "▶ Show" : "▼ Hide"}
        </span>
      </button>

      {!collapsed && (
        <div className="p-3 text-sm text-zinc-300 space-y-3 max-h-[40vh] overflow-y-auto">
          <p>
            Implement a <code className="text-blue-400 bg-zinc-800 px-1 rounded">MiniGit</code> class
            that simulates an in-memory version control system.
          </p>

          <div>
            <h4 className="font-semibold text-zinc-200 mb-1">Methods to implement:</h4>
            <div className="space-y-2 text-xs font-mono">
              <div>
                <code className="text-green-400">init()</code>
                <span className="text-zinc-400 ml-2">Initialize a new repository. Default branch is &quot;main&quot;.</span>
              </div>
              <div>
                <code className="text-green-400">add(filename, content)</code>
                <span className="text-zinc-400 ml-2">Stage a file with its content. Overwrites if already staged.</span>
              </div>
              <div>
                <code className="text-green-400">commit(message)</code>
                <span className="text-zinc-400 ml-2">
                  Create a commit with staged files. Returns a string hash. Throws if nothing staged.
                </span>
              </div>
              <div>
                <code className="text-green-400">log()</code>
                <span className="text-zinc-400 ml-2">
                  Return array of commits in reverse chronological order: <code className="text-yellow-400">[&#123;hash, message&#125;]</code>
                </span>
              </div>
              <div>
                <code className="text-green-400">branch(name)</code>
                <span className="text-zinc-400 ml-2">
                  Create a new branch at current HEAD. Throws if name already exists.
                </span>
              </div>
              <div>
                <code className="text-green-400">checkout(branchName)</code>
                <span className="text-zinc-400 ml-2">
                  Switch to an existing branch. Throws if branch doesn&apos;t exist.
                </span>
              </div>
              <div>
                <code className="text-green-400">status()</code>
                <span className="text-zinc-400 ml-2">
                  Return <code className="text-yellow-400">&#123;staged: [filenames]&#125;</code>
                </span>
              </div>
              <div>
                <code className="text-green-400">diff()</code>
                <span className="text-zinc-400 ml-2">
                  Return array of changes: <code className="text-yellow-400">[&#123;file, status, oldContent?, newContent?&#125;]</code>
                </span>
                <div className="text-zinc-500 ml-2 mt-0.5">
                  status: &quot;added&quot; | &quot;modified&quot; | &quot;deleted&quot;
                </div>
              </div>
              <div>
                <code className="text-green-400">merge(branchName)</code>
                <span className="text-zinc-400 ml-2">
                  Merge branch into current. Return <code className="text-yellow-400">&#123;conflicts: [filenames]&#125;</code>
                </span>
                <div className="text-zinc-500 ml-2 mt-0.5">
                  Fast-forward if possible. Detect conflicts when same file modified differently.
                </div>
              </div>
            </div>
          </div>

          <div className="text-xs text-zinc-500 border-t border-zinc-700 pt-2">
            <strong>Testing:</strong> Tiers 1-2 (visible) cover basic operations. Tiers 3-5 (hidden) test advanced features.
          </div>
        </div>
      )}
    </div>
  );
}
