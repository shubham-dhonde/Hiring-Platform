import { TestCase, TestTier } from "@/types";

function makeTest(name: string, tier: TestTier, fn: string): TestCase {
  return {
    name,
    tier,
    visible: tier <= 2,
    fn,
  };
}

export const testSuite: TestCase[] = [
  // ── Tier 1 (7 tests, 25pts, visible): init, add, commit, log basics ──
  makeTest(
    "init() creates a repository",
    1,
    `
    const git = new MiniGit();
    git.init();
    assertEqual(typeof git, "object");
    `
  ),
  makeTest(
    "add() stages a file",
    1,
    `
    const git = new MiniGit();
    git.init();
    git.add("file1.txt", "hello world");
    `
  ),
  makeTest(
    "commit() creates a commit and returns hash",
    1,
    `
    const git = new MiniGit();
    git.init();
    git.add("file1.txt", "hello world");
    const hash = git.commit("initial commit");
    assert(typeof hash === "string" && hash.length > 0, "commit should return a non-empty string hash");
    `
  ),
  makeTest(
    "log() returns empty array when no commits",
    1,
    `
    const git = new MiniGit();
    git.init();
    const logs = git.log();
    assert(Array.isArray(logs), "log() should return an array");
    assertEqual(logs.length, 0);
    `
  ),
  makeTest(
    "log() returns commits in reverse chronological order",
    1,
    `
    const git = new MiniGit();
    git.init();
    git.add("file1.txt", "v1");
    const h1 = git.commit("first");
    git.add("file1.txt", "v2");
    const h2 = git.commit("second");
    const logs = git.log();
    assertEqual(logs.length, 2);
    assertEqual(logs[0].message, "second");
    assertEqual(logs[1].message, "first");
    `
  ),
  makeTest(
    "log() entries have hash and message fields",
    1,
    `
    const git = new MiniGit();
    git.init();
    git.add("file1.txt", "content");
    git.commit("test message");
    const logs = git.log();
    assert(logs[0].hash !== undefined, "log entry should have hash");
    assert(logs[0].message !== undefined, "log entry should have message");
    assertEqual(logs[0].message, "test message");
    `
  ),
  makeTest(
    "commit() with multiple files",
    1,
    `
    const git = new MiniGit();
    git.init();
    git.add("a.txt", "aaa");
    git.add("b.txt", "bbb");
    const hash = git.commit("two files");
    assert(typeof hash === "string" && hash.length > 0, "commit should return hash");
    const logs = git.log();
    assertEqual(logs.length, 1);
    `
  ),

  // ── Tier 2 (6 tests, 25pts, visible): branch, checkout, isolation ──
  makeTest(
    "branch() creates a new branch",
    2,
    `
    const git = new MiniGit();
    git.init();
    git.add("file.txt", "content");
    git.commit("initial");
    git.branch("feature");
    `
  ),
  makeTest(
    "checkout() switches to an existing branch",
    2,
    `
    const git = new MiniGit();
    git.init();
    git.add("file.txt", "content");
    git.commit("initial");
    git.branch("feature");
    git.checkout("feature");
    `
  ),
  makeTest(
    "branches are isolated - commits on one branch don't appear on another",
    2,
    `
    const git = new MiniGit();
    git.init();
    git.add("file.txt", "v1");
    git.commit("initial");
    git.branch("feature");
    git.checkout("feature");
    git.add("file.txt", "v2");
    git.commit("feature commit");
    git.checkout("main");
    const mainLog = git.log();
    assertEqual(mainLog.length, 1);
    assertEqual(mainLog[0].message, "initial");
    git.checkout("feature");
    const featureLog = git.log();
    assertEqual(featureLog.length, 2);
    `
  ),
  makeTest(
    "checkout() throws on non-existent branch",
    2,
    `
    const git = new MiniGit();
    git.init();
    let threw = false;
    try {
      git.checkout("nonexistent");
    } catch (e) {
      threw = true;
    }
    assert(threw, "checkout should throw for non-existent branch");
    `
  ),
  makeTest(
    "branch() creates branch at current HEAD",
    2,
    `
    const git = new MiniGit();
    git.init();
    git.add("a.txt", "a");
    git.commit("first");
    git.add("b.txt", "b");
    git.commit("second");
    git.branch("from-second");
    git.checkout("from-second");
    const logs = git.log();
    assertEqual(logs.length, 2);
    assertEqual(logs[0].message, "second");
    `
  ),
  makeTest(
    "checkout() back and forth preserves state",
    2,
    `
    const git = new MiniGit();
    git.init();
    git.add("file.txt", "original");
    git.commit("initial");
    git.branch("feature");
    git.checkout("feature");
    git.add("new.txt", "new content");
    git.commit("add new file");
    git.checkout("main");
    git.checkout("feature");
    const logs = git.log();
    assertEqual(logs.length, 2);
    assertEqual(logs[0].message, "add new file");
    `
  ),

  // ── Tier 3 (6 tests, 20pts, hidden): status(), diff() ──
  makeTest(
    "status() shows staged files",
    3,
    `
    const git = new MiniGit();
    git.init();
    git.add("file.txt", "content");
    const st = git.status();
    assert(st.staged && st.staged.length > 0, "status should show staged files");
    assert(st.staged.includes("file.txt"), "staged should include file.txt");
    `
  ),
  makeTest(
    "status() shows no staged files after commit",
    3,
    `
    const git = new MiniGit();
    git.init();
    git.add("file.txt", "content");
    git.commit("first");
    const st = git.status();
    assertEqual(st.staged.length, 0);
    `
  ),
  makeTest(
    "status() shows modified files",
    3,
    `
    const git = new MiniGit();
    git.init();
    git.add("file.txt", "v1");
    git.commit("first");
    git.add("file.txt", "v2");
    const st = git.status();
    assert(st.staged.includes("file.txt"), "modified file should appear in staged");
    `
  ),
  makeTest(
    "diff() shows added files",
    3,
    `
    const git = new MiniGit();
    git.init();
    git.add("file.txt", "hello");
    const d = git.diff();
    assert(Array.isArray(d), "diff should return an array");
    assert(d.length > 0, "diff should show changes for added file");
    const entry = d.find(e => e.file === "file.txt");
    assert(entry !== undefined, "diff should contain entry for file.txt");
    assertEqual(entry.status, "added");
    `
  ),
  makeTest(
    "diff() shows modified files",
    3,
    `
    const git = new MiniGit();
    git.init();
    git.add("file.txt", "v1");
    git.commit("first");
    git.add("file.txt", "v2");
    const d = git.diff();
    const entry = d.find(e => e.file === "file.txt");
    assert(entry !== undefined, "diff should contain entry for file.txt");
    assertEqual(entry.status, "modified");
    assertEqual(entry.oldContent, "v1");
    assertEqual(entry.newContent, "v2");
    `
  ),
  makeTest(
    "diff() returns empty array when no changes",
    3,
    `
    const git = new MiniGit();
    git.init();
    git.add("file.txt", "content");
    git.commit("first");
    const d = git.diff();
    assertEqual(d.length, 0);
    `
  ),

  // ── Tier 4 (4 tests, 20pts, hidden): merge ──
  makeTest(
    "merge() fast-forward merge",
    4,
    `
    const git = new MiniGit();
    git.init();
    git.add("file.txt", "v1");
    git.commit("initial");
    git.branch("feature");
    git.checkout("feature");
    git.add("file.txt", "v2");
    git.commit("feature update");
    git.checkout("main");
    const result = git.merge("feature");
    assert(!result.conflicts || result.conflicts.length === 0, "fast-forward merge should have no conflicts");
    const logs = git.log();
    assertEqual(logs[0].message, "feature update");
    `
  ),
  makeTest(
    "merge() three-way merge creates merge commit",
    4,
    `
    const git = new MiniGit();
    git.init();
    git.add("file.txt", "base");
    git.commit("initial");
    git.branch("feature");
    git.checkout("feature");
    git.add("feature.txt", "feature content");
    git.commit("add feature file");
    git.checkout("main");
    git.add("main.txt", "main content");
    git.commit("add main file");
    const result = git.merge("feature");
    assert(!result.conflicts || result.conflicts.length === 0, "non-conflicting merge should have no conflicts");
    const logs = git.log();
    assert(logs.length >= 4, "should have merge commit plus all prior commits");
    `
  ),
  makeTest(
    "merge() detects conflicts",
    4,
    `
    const git = new MiniGit();
    git.init();
    git.add("file.txt", "base");
    git.commit("initial");
    git.branch("feature");
    git.checkout("feature");
    git.add("file.txt", "feature version");
    git.commit("feature change");
    git.checkout("main");
    git.add("file.txt", "main version");
    git.commit("main change");
    const result = git.merge("feature");
    assert(result.conflicts && result.conflicts.length > 0, "should detect conflict");
    assert(result.conflicts.includes("file.txt"), "conflict should be on file.txt");
    `
  ),
  makeTest(
    "merge() non-conflicting changes to different files",
    4,
    `
    const git = new MiniGit();
    git.init();
    git.add("shared.txt", "base");
    git.commit("initial");
    git.branch("feature");
    git.checkout("feature");
    git.add("only-feature.txt", "feature stuff");
    git.commit("feature file");
    git.checkout("main");
    git.add("only-main.txt", "main stuff");
    git.commit("main file");
    const result = git.merge("feature");
    assert(!result.conflicts || result.conflicts.length === 0, "different files should not conflict");
    `
  ),

  // ── Tier 5 (5 tests, 10pts, hidden): edge cases ──
  makeTest(
    "commit() throws when nothing staged",
    5,
    `
    const git = new MiniGit();
    git.init();
    let threw = false;
    try {
      git.commit("empty");
    } catch (e) {
      threw = true;
    }
    assert(threw, "commit with nothing staged should throw");
    `
  ),
  makeTest(
    "branch() throws for duplicate branch name",
    5,
    `
    const git = new MiniGit();
    git.init();
    git.add("f.txt", "c");
    git.commit("init");
    git.branch("feature");
    let threw = false;
    try {
      git.branch("feature");
    } catch (e) {
      threw = true;
    }
    assert(threw, "creating duplicate branch should throw");
    `
  ),
  makeTest(
    "log() on new branch with no extra commits shows parent commits",
    5,
    `
    const git = new MiniGit();
    git.init();
    git.add("f.txt", "c");
    git.commit("first");
    git.branch("feature");
    git.checkout("feature");
    const logs = git.log();
    assertEqual(logs.length, 1);
    assertEqual(logs[0].message, "first");
    `
  ),
  makeTest(
    "complex operations maintain consistency",
    5,
    `
    const git = new MiniGit();
    git.init();
    git.add("a.txt", "a1");
    git.add("b.txt", "b1");
    git.commit("c1");
    git.branch("dev");
    git.checkout("dev");
    git.add("a.txt", "a2");
    git.commit("c2");
    git.branch("hotfix");
    git.checkout("hotfix");
    git.add("c.txt", "c1");
    git.commit("c3");
    git.checkout("dev");
    const devLogs = git.log();
    assertEqual(devLogs.length, 2);
    git.checkout("hotfix");
    const hotfixLogs = git.log();
    assertEqual(hotfixLogs.length, 3);
    git.checkout("main");
    const mainLogs = git.log();
    assertEqual(mainLogs.length, 1);
    `
  ),
  makeTest(
    "add() overwrites previously staged content",
    5,
    `
    const git = new MiniGit();
    git.init();
    git.add("file.txt", "first");
    git.add("file.txt", "second");
    git.commit("overwrite test");
    const logs = git.log();
    assertEqual(logs.length, 1);
    `
  ),
];

// Points per tier
export const tierPoints: Record<number, number> = {
  1: 25,
  2: 25,
  3: 20,
  4: 20,
  5: 10,
};

// Count tests per tier
export const tierTestCounts: Record<number, number> = {};
for (const t of testSuite) {
  tierTestCounts[t.tier] = (tierTestCounts[t.tier] || 0) + 1;
}
