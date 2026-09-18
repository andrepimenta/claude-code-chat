#!/usr/bin/env bash
# Snapshot / verify every piece of persistent state an extension test pass can
# mutate. Run `snapshot` before testing and `verify` after; verify exits non-zero
# and prints a diff if anything drifted.
#
#   scripts/test-state.sh snapshot
#   scripts/test-state.sh verify
#
# Snapshots land in $SNAP (outside the repo). Nothing here writes to the repo.
set -uo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SNAP="${SNAP:-${TMPDIR:-/tmp}/ccc-test-baseline}"
VSCODE_USER="$HOME/Library/Application Support/Code/User"
GLOBAL_STORAGE="$VSCODE_USER/globalStorage/andrepimenta.claude-code-chat"

# Hash a directory tree's structure + contents, or print a sentinel if absent.
hash_tree() {
	local d="$1"
	[ -e "$d" ] || { echo "ABSENT"; return; }
	find "$d" -type f -print0 2>/dev/null | sort -z \
		| xargs -0 shasum -a 256 2>/dev/null \
		| sed "s|$d||" | shasum -a 256 | cut -d' ' -f1
}

# Same as hash_tree, but skips one top-level subdirectory by name.
hash_tree_excluding() {
	local d="$1" skip="$2"
	[ -e "$d" ] || { echo "ABSENT"; return; }
	find "$d" -type f -not -path "$d/$skip/*" -print0 2>/dev/null | sort -z \
		| xargs -0 shasum -a 256 2>/dev/null \
		| sed "s|$d||" | shasum -a 256 | cut -d" " -f1
}

# Structural fingerprint of ~/.claude.json: size plus top-level key counts.
# Detects "replaced with a 200-byte stub" without tripping on ordinary rewrites.
claude_json_shape() {
	local f="$HOME/.claude.json"
	[ -f "$f" ] || { echo "ABSENT"; return; }
	python3 - "$f" <<'PYEOF'
import json, os, sys
f = sys.argv[1]
size = os.path.getsize(f)
try:
	d = json.load(open(f))
except Exception as e:
	print(f"{size} bytes, UNPARSEABLE ({type(e).__name__})")
	sys.exit()
print(f"{size} bytes, {len(d)} top-level keys, "
      f"{len(d.get('mcpServers') or {})} mcpServers, "
      f"{len(d.get('projects') or {})} projects")
PYEOF
}

hash_file() {
	[ -f "$1" ] && shasum -a 256 "$1" | cut -d' ' -f1 || echo "ABSENT"
}

capture() {
	local out="$1"
	mkdir -p "$out"

	# --- repo: tracked modifications + untracked inventory ---
	git -C "$REPO" diff HEAD                       > "$out/repo-tracked.patch"
	git -C "$REPO" status --porcelain --untracked-files=all | sort > "$out/repo-status.txt"
	git -C "$REPO" rev-parse HEAD                  > "$out/repo-head.txt"

	# --- repo-local Claude config (real files, tracked or not) ---
	{
		echo "settings.json        $(hash_file "$REPO/.claude/settings.json")"
		echo "settings.local.json  $(hash_file "$REPO/.claude/settings.local.json")"
		echo "skills/              $(hash_tree "$REPO/.claude/skills")"
		echo "images/              $(hash_tree "$REPO/.claude/claude-code-chat-images")"
		echo "mcp .mcp.json        $(hash_file "$REPO/.mcp.json")"
	} > "$out/repo-claude.txt"

	# --- the user's REAL home config ---
	# `synced/` is Claude Code's own account-level skill and plugin sync bucket.
	# It changes on its own schedule, has nothing to do with this extension, and
	# tracking it makes the guard cry wolf. The user's OWN skills are what matter,
	# so they get their own line and are listed by name for a readable diff.
	{
		# ~/.claude.json is the big one: Claude Code's global config, ~177 KB, and
		# the exact file _saveMCPServer could replace with a stub.
		#
		# We deliberately do NOT hash it. Claude Code rewrites this file constantly
		# during normal use, so the hash drifts every single run and a guard that
		# always fires is a guard nobody reads. What actually matters is that it
		# did not get REPLACED by a stub, so we record its shape instead: size and
		# the counts that truncation would destroy.
		echo "~/.claude.json       $(claude_json_shape)"
		echo "skills(personal)/    $(hash_tree_excluding "$HOME/.claude/skills" synced)"
		echo "plugins(own)/        $(hash_tree_excluding "$HOME/.claude/plugins" synced)"
		echo "settings.json        $(hash_file "$HOME/.claude/settings.json")"
		echo "commands/            $(hash_tree "$HOME/.claude/commands")"
		echo "hooks/               $(hash_tree "$HOME/.claude/hooks")"
		# NOT tracked, because normal Claude Code use rewrites them constantly and
		# a guard that always fires is a guard nobody reads:
		#   projects/ sessions/ history.jsonl shell-snapshots/ debug/ telemetry/
		#   cache/ downloads/ paste-cache/ file-history/ stats-cache.json tasks/
		# Note: chatting in the sandbox DOES add a projects/ entry for it. That is
		# the CLI's own bookkeeping, not the extension, and it is expected residue.
		echo "--- personal skills ---"
		ls -1 "$HOME/.claude/skills" 2>/dev/null | grep -v "^synced$" || true
	} > "$out/home-claude.txt"

	# --- the user's REAL VS Code profile ---
	{
		echo "user settings.json   $(hash_file "$VSCODE_USER/settings.json")"
		echo "globalStorage/       $(hash_tree "$GLOBAL_STORAGE")"
	} > "$out/vscode-profile.txt"

	# The extension's own settings block, extracted so drift is readable rather
	# than just a changed hash. Secrets are redacted: this file is printed.
	python3 - "$VSCODE_USER/settings.json" > "$out/ccc-settings.json" <<'PY'
import json, re, sys
try:
	raw = open(sys.argv[1]).read()
except OSError:
	print("{}"); sys.exit()
raw = re.sub(r'^\s*//.*$', '', raw, flags=re.M)          # strip line comments
raw = re.sub(r',(\s*[}\]])', r'\1', raw)                  # strip trailing commas
try:
	cfg = json.loads(raw)
except Exception as e:
	print(json.dumps({"__unparsed__": str(e)})); sys.exit()
SENSITIVE = re.compile(r'KEY|TOKEN|SECRET|PASS|CREDENTIAL|AUTH', re.I)
SECRETISH = re.compile(r'^(sk-|oc_sk_|oc_pk_|ghp_|xox|[0-9a-f]{8}-[0-9a-f]{4})', re.I)

def scrub(k, v):
	"""Redact by key name OR by value shape, at any depth. Fail closed."""
	if isinstance(v, dict):
		return {kk: scrub(kk, vv) for kk, vv in v.items()}
	if isinstance(v, list):
		return [scrub(k, x) for x in v]
	if isinstance(v, str) and (SENSITIVE.search(k or '') or SECRETISH.match(v)):
		return "<REDACTED len=%d>" % len(v)
	return v

out = {k: scrub(k, v) for k, v in cfg.items() if k.startswith("claudeCodeChat.")}
print(json.dumps(out, indent=2, sort_keys=True))
PY
}

case "${1:-}" in
snapshot)
	rm -rf "$SNAP"; capture "$SNAP/before"
	echo "baseline captured -> $SNAP/before"
	echo
	cat "$SNAP/before/repo-status.txt"
	echo
	echo "--- extension settings in your real VS Code profile ---"
	cat "$SNAP/before/ccc-settings.json"
	;;
verify)
	[ -d "$SNAP/before" ] || { echo "no baseline at $SNAP/before — run snapshot first"; exit 2; }
	rm -rf "$SNAP/after"; capture "$SNAP/after"
	drift=0
	for f in repo-tracked.patch repo-status.txt repo-head.txt repo-claude.txt \
	         home-claude.txt vscode-profile.txt ccc-settings.json; do
		if ! diff -q "$SNAP/before/$f" "$SNAP/after/$f" >/dev/null 2>&1; then
			echo "### DRIFT: $f"
			diff -u "$SNAP/before/$f" "$SNAP/after/$f" | sed -n '1,60p'
			echo
			drift=1
		fi
	done
	[ "$drift" -eq 0 ] && echo "CLEAN — every tracked surface is byte-identical to the baseline."
	exit "$drift"
	;;
*)
	echo "usage: $0 {snapshot|verify}"; exit 2 ;;
esac
