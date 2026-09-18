#!/usr/bin/env bash
# Build a pristine throwaway workspace for the E2E runs.
#
# The extension writes into whatever folder it has open: .claude/settings.json
# for permissions, .claude/claude-code-chat-images/ for pastes, .claude/skills/
# for project skills, and it runs `git add -A` over the tree for every backup
# commit. Pointing that at the repo (as wdio.conf.ts used to) means a live model
# with yolo mode on can edit this source tree. So it gets its own sandbox.
set -euo pipefail

WS="${E2E_WORKSPACE:-${TMPDIR:-/tmp}/ccc-e2e-ws}"

rm -rf "$WS"
mkdir -p "$WS/src" "$WS/.claude"

cat > "$WS/README.md" <<'EOF'
# Sandbox

Throwaway workspace for claude-code-chat E2E runs. Recreated on every run.
EOF

cat > "$WS/src/greet.js" <<'EOF'
// A small file for tests that ask the model to read or edit something.
function greet(name) {
	return `Hello, ${name}!`;
}

module.exports = { greet };
EOF

cat > "$WS/src/math.js" <<'EOF'
function add(a, b) { return a + b; }
function mul(a, b) { return a * b; }

module.exports = { add, mul };
EOF

git -C "$WS" init -q
git -C "$WS" config user.name  "E2E Sandbox"
git -C "$WS" config user.email "e2e@localhost"
git -C "$WS" add -A
git -C "$WS" commit -qm "sandbox baseline"

echo "$WS"
