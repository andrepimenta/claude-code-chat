// Pure batch-update helper for the #56 fix: extension.ts's _updateSettings used to run
// the whole settings batch from the webview through a single loop wrapped in one
// try/catch -- if config.update() threw for one key (e.g. a setting not yet registered
// right after a version bump), the loop broke and every subsequent key in the same
// batch silently never got saved. Real-world hit on 2026-07-26: ui.renderMath wasn't
// registered yet, and six settings that came after it in the same batch (font family,
// font size, completion popup/sound, send-on-enter, diff.autoOpen) were dropped without
// any indication in the UI. This module owns only the per-key try/catch + result
// collection; extension.ts still owns every side effect (the actual
// vscode.workspace config.update() call, permissions.yoloMode's workspace-then-global
// fallback, _permLog, the summary error message) via the injected updateSetting
// callback -- no vscode import here, so this runs under plain mocha, same pattern as
// shell-utils/restore-commit-utils/perm-log-redact. Run with `npm run test:settings-batch`.
//
// Review follow-up: a first cut of this module logged all "update ok" lines
// after the whole batch settled, then all "update FAILED" lines -- that lost the perm
// log's per-key chronology extension.ts's own onDidChangeConfiguration listener depends
// on (config.update() fires refreshSettingsOnConfigChange -> _sendCurrentSettings,
// which writes its own settingsData perm-log line right after the key that triggered
// it -- the #23 colorblind-roundtrip diagnosis relied on that interleaving), and meant
// a batch that hangs or throws mid-loop left zero "ok" lines behind, i.e. no progress
// evidence in exactly the case that needs it most. onSettled below is called
// synchronously inside the same per-key try/catch as updateSetting, so a caller that
// logs from it gets one line per key, in the exact order keys were attempted -- same
// guarantee applied/failures already have, just not batched up first.

export interface SettingUpdateFailure {
	key: string;
	message: string;
}

export interface SettingsBatchResult {
	applied: string[];
	failures: SettingUpdateFailure[];
}

// Turns whatever a rejected updateSetting() call threw into a plain string, the same way
// the pre-#56 code's 'err=' + (error?.message || error) string-concatenation did (Error
// instances and message-bearing objects use .message; anything else -- a thrown string,
// undefined, a plain object -- coerces the same way String() / template-literal
// interpolation would), so a caller like extension.ts's _permLog never has to guard
// against a missing .message itself.
function toErrorMessage(error: unknown): string {
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

// Applies every [key, value] pair in settings via updateSetting, one at a time, each in
// its own try/catch -- unlike the pre-#56 single try/catch around the whole loop, a
// rejection for one key never stops the remaining keys from being attempted. Keys are
// attempted in the same order Object.entries(settings) always yields (insertion order
// for string keys), so applied/failures each preserve that order internally. onSettled
// (optional) is invoked synchronously right after each key's own try/catch resolves --
// with no error argument on success, with the same normalized string toErrorMessage
// already put into failures[].message on failure -- so a caller can log/react per key
// without waiting for the whole batch and without re-deriving the error text itself.
export async function applySettingsBatch(
	settings: { [key: string]: any },
	updateSetting: (key: string, value: any) => Promise<void>,
	onSettled?: (key: string, value: unknown, error?: unknown) => void
): Promise<SettingsBatchResult> {
	const applied: string[] = [];
	const failures: SettingUpdateFailure[] = [];
	for (const [key, value] of Object.entries(settings)) {
		try {
			await updateSetting(key, value);
			applied.push(key);
			onSettled?.(key, value);
		} catch (error) {
			const message = toErrorMessage(error);
			failures.push({ key, message });
			onSettled?.(key, value, message);
		}
	}
	return { applied, failures };
}
