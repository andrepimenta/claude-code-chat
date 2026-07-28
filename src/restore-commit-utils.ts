// Pure helpers for the fork-issue-50 checkpoint-restore fix: after a history load switches
// conversations, extension.ts's in-memory _commits list is cleared (see
// _loadConversationHistory) even though the replayed showRestoreOption messages still
// show a working Restore button for a checkpoint that still exists in the shadow
// backup repo. No vscode import, so these run under plain mocha -- extension.ts owns
// all the side effects (the git cat-file -e existence check, the actual restore).

export interface RestoreCommitInfo {
	id: string;
	sha: string;
	message: string;
	timestamp: string;
}

// Every commit sha this extension itself ever produces comes straight from `git
// rev-parse HEAD` (trimmed), always plain lowercase hex -- 40 chars for SHA-1, 64 for
// SHA-256. commitSha can now also arrive here rehydrated from a loaded conversation's
// showRestoreOption entry, i.e. from persisted JSON on disk rather than only that
// same-session git output, so this must be checked before commitSha reaches any git
// command. 7 is the shortest abbreviation git itself would ever treat as unambiguous.
export function isValidCommitSha(sha: string): boolean {
	return /^[0-9a-f]{7,64}$/i.test(sha);
}

// Recovers a commit's display info (message/timestamp for the restore toasts) from the
// matching showRestoreOption entry replayed into _currentConversation, for a sha that
// _commits no longer knows about (fork-issue-50: cleared by a history load that switched
// conversations). Only called once the caller has independently confirmed sha still
// exists in the backup repo -- this never claims a sha exists, only recovers its
// metadata, and falls back to a minimal placeholder built from the sha itself when no
// matching entry is found (e.g. an older saved conversation from before this field
// existed).
export function findRehydratedCommitInfo(
	messages: ReadonlyArray<{ messageType: string, data: any }>,
	sha: string
): RestoreCommitInfo {
	const entry = messages.find(m => m.messageType === 'showRestoreOption' && m.data?.sha === sha);
	if (entry && typeof entry.data?.message === 'string' && typeof entry.data?.timestamp === 'string') {
		return {
			id: typeof entry.data.id === 'string' ? entry.data.id : `commit-${sha}`,
			sha,
			message: entry.data.message,
			timestamp: entry.data.timestamp
		};
	}
	return { id: `commit-${sha}`, sha, message: sha, timestamp: new Date().toISOString() };
}
