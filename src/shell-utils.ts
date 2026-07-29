// Windows shell-quoting helper for the Claude process spawn (fork-issue-39).
// With shell:true, Node joins the args array into a single command line WITHOUT
// quoting, so cmd.exe splits any argument containing a space (e.g. an mcp-config
// path under a user profile like "Vincent K. Bae") at that space. Quote args that
// contain a space and aren't already quoted; a no-op when useShell is false
// (custom executable, spawned without a shell). Kept in its own vscode-free module
// so it can be unit-tested under plain mocha like model-updater/claudeDownloader.
export function quoteWinShellArgs(args: string[], useShell: boolean): string[] {
	if (!useShell) { return args; }
	return args.map(a => (a.includes(' ') && !/^".*"$/.test(a)) ? `"${a}"` : a);
}
