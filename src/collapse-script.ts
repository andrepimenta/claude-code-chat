import { normalizeCollapseThreshold, evaluateCodeBlockCollapse } from './collapse-rules';

// Webview-side glue for the fork-issue-48 collapsible-code-blocks feature (upstream #151), injected
// into script.ts's getScript() template the same way getMathScript()/getSkillsScript() are
// (see plugins-script.ts). Two different things happen below and they must not be confused:
//
// 1. normalizeCollapseThreshold.toString() / evaluateCodeBlockCollapse.toString() are REAL,
//    host-side template interpolations (like findMathSegments.toString() in math-script.ts):
//    they run in Node when getCollapseScript() is called, and splice each function's own
//    *compiled* source into the returned string. collapse-rules.ts must stay fully
//    self-contained for exactly this reason -- only its own text crosses into the browser,
//    not the rest of that module.
// 2. Everything else below (markCodeBlockToggled, applyCodeBlockCollapseDefaults,
//    toggleMessageCollapsed) is plain webview source written directly in this template
//    literal. None of it happens to need a client-side "${...}" or a backtick, so nothing
//    here needs the "\${"/"\`" escaping script.ts's own template literal requires elsewhere
//    -- but if you add code that does, escape it the same way (see script.ts's
//    parseSimpleMarkdown for examples).
const getCollapseScript = () => `
		// ─── Collapsible code blocks + per-message fold (fork-issue-48) ───
		${normalizeCollapseThreshold.toString()}
		${evaluateCodeBlockCollapse.toString()}

		// R2/R3: bound to the <summary>'s synchronous onclick, never the <details>'s
		// ontoggle -- toggle fires asynchronously and also for a programmatic .open
		// assignment, which would make applyCodeBlockCollapseDefaults() below unable to
		// tell a real user click from its own catch-up pass after the first run.
		function markCodeBlockToggled(summaryEl) {
			summaryEl.parentElement.setAttribute('data-user-toggled', '1');
		}

		// Catch-up pass (R1): settingsData arrives AFTER the history replay
		// (extension.ts _loadConversationHistory -> _sendReadyMessage -> _sendCurrentSettings),
		// so blocks rendered from history always start out using the webview's hardcoded
		// default. This re-applies the real collapseLongCodeBlocks setting to every block the
		// user hasn't touched yet; called once settingsData actually arrives (see script.ts).
		function applyCodeBlockCollapseDefaults() {
			var els = document.querySelectorAll('details.code-block-collapsible:not([data-user-toggled="1"])');
			for (var i = 0; i < els.length; i++) { els[i].open = !collapseLongCodeBlocks; }
		}

		// Phase 2: manual per-message collapse via the caret button in .message-header
		// (script.ts addMessage). Purely a CSS class toggle, no DOM removal -- see
		// ui-styles.ts's ".message.collapsed" rules.
		function toggleMessageCollapsed(messageDiv, btn) {
			var collapsed = messageDiv.classList.toggle('collapsed');
			btn.textContent = collapsed ? '▸' : '▾';
			btn.title = collapsed ? 'Expand message' : 'Collapse message';
			btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
		}
`;

export default getCollapseScript;
