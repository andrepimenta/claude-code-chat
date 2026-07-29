// fork-issue-59: permissions.yoloMode's workspace-then-global fallback, pulled into its own pure
// function so both _enableYoloMode (the inline "Enable Yolo Mode" chat button / menu
// item, fork-issue-52) and _updateSettings's existing per-key handling of the same setting key
// can share one implementation instead of keeping two copies of the same try/catch in
// extension.ts. No vscode import here, so this runs under plain mocha. Run with
// `npm run test:settings-batch`.
//
// Note: upstream (fork) also has an applySettingsBatch helper in this module for a
// separate, unrelated fix (fork-issue-56, whole-settings-batch loop resilience) that is not part
// of this security-hardening branch and is intentionally not included here.

// Turns whatever a rejected update callback threw into a plain string, the same way the
// pre-fork-issue-59 code's 'err=' + (error?.message || error) string-concatenation did (Error
// instances and message-bearing objects use .message; anything else -- a thrown string,
// undefined, a plain object -- coerces the same way String() / template-literal
// interpolation would), so a caller in extension.ts never has to guard against
// a missing .message itself.
export function toErrorMessage(error: unknown): string {
	if (typeof error === 'object' && error !== null && 'message' in error) {
		const message = (error as { message: unknown }).message;
		if (typeof message === 'string' && message) {
			return message;
		}
	}
	if (typeof error === 'string') {
		return error;
	}
	return String(error);
}

export interface WorkspaceThenGlobalFallbackResult {
	succeeded: boolean;
	// Which scope actually ended up holding the value on success, or which scope's
	// error is the relevant "final" one when both attempts failed.
	scope: 'workspace' | 'global';
	// Set whenever the workspace attempt was made and threw -- present both when the
	// global fallback then succeeded (diagnostic-only) and when it also failed.
	workspaceError?: string;
	// Set only when the global fallback attempt itself threw.
	globalError?: string;
}

// fork-issue-59: permissions.yoloMode's workspace-then-global fallback, pulled into its own pure
// function so both _enableYoloMode (the inline "Enable Yolo Mode" chat button / menu
// item, fork-issue-52) and _updateSettings's existing per-key handling of the same setting key
// can share one implementation instead of keeping two copies of the same try/catch in
// extension.ts. extension.ts still owns the actual vscode.workspace config.update()
// calls via the injected callbacks.
//
// Before fork-issue-59, _enableYoloMode had no global fallback at all and its bare catch only
// logged to the extension host's console -- in a window with no workspace folder open,
// config.update(..., Workspace) throws, _sendCurrentSettings() (and therefore the
// webview) never found out, and the setting was silently never persisted. The chat
// already said "YOLO Mode enabled!" regardless, because that confirmation was fired
// client-side the moment the button was clicked, not gated on any response from the
// extension host. This function's `succeeded` flag exists specifically so a caller can
// tell "both attempts threw" apart from "it worked" and refuse to report success in
// that case.
export async function updateWithWorkspaceThenGlobalFallback(
	updateWorkspace: () => Promise<void>,
	updateGlobal: () => Promise<void>
): Promise<WorkspaceThenGlobalFallbackResult> {
	try {
		await updateWorkspace();
		return { succeeded: true, scope: 'workspace' };
	} catch (workspaceError) {
		const workspaceMessage = toErrorMessage(workspaceError);
		try {
			await updateGlobal();
			return { succeeded: true, scope: 'global', workspaceError: workspaceMessage };
		} catch (globalError) {
			return {
				succeeded: false,
				scope: 'global',
				workspaceError: workspaceMessage,
				globalError: toErrorMessage(globalError)
			};
		}
	}
}
