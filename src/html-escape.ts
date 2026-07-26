// Attribut-Escaping fuer die Webview (#49). script.ts' escapeHtml() serialisiert ueber
// textContent->innerHTML und laesst " und ' deshalb STEHEN -- fuer title="..."/data-*="..."
// reicht das nicht (Attribut-Ausbruch). Diese Funktion wird NICHT hier aufgerufen: script.ts
// spleisst per .toString() nur ihren eigenen kompilierten Text in die Seite (Muster
// math-segments.ts/collapse-rules.ts). Deshalb MUSS sie self-contained bleiben -- kein
// Modul-Level-Symbol, kein Import, keine Hilfsfunktion ausserhalb des Bodys.
export function escapeAttr(value: unknown): string {
	const s = value === null || value === undefined ? '' : String(value);
	// '&' zwingend zuerst, sonst werden die eigenen Entities nachtraeglich zerlegt.
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}
