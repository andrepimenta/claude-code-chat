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

// #61: escapeAttr() macht href=/src= ausbruchsicher, prueft aber kein Schema -- ein
// javascript:-Link aus Fremddaten (MCP-Registry-Eintrag) bleibt damit klickbar/wirksam.
// safeHttpUrl() laesst nur http:/https: durch, sonst leerer String (Aufrufer laesst das
// Attribut/den Link dann ganz weg statt ein totes Attribut zu rendern). Die Bereinigung vor
// dem Schema-Check spiegelt die ersten Schritte des WHATWG-URL-Parsers: Tab/Newline/CR werden
// ueberall im String entfernt (faengt "java\tscript:"), fuehrende/nachfolgende C0-Steuerzeichen
// und Leerzeichen werden abgeschnitten -- beides Tricks, mit denen Browser eine Schema-Pruefung
// per String-Vergleich sonst umgehen wuerden. Gleiche Selbstgenuegsamkeits-Regel wie escapeAttr:
// kein Modul-Level-Symbol, kein Import, keine Hilfsfunktion ausserhalb des Bodys.
// ACHTUNG (opus-Review): faellt bewusst fail-closed auch bei relativen ("/icons/x.png",
// "icon.png") und protokollrelativen ("//cdn.example/i.png") URLs auf '' -- ein Schema ist
// hier zwingend Voraussetzung, kein Sonderfall dafuer. Sollte eine Datenquelle kuenftig
// relative/protokollrelative Icon-URLs liefern, faellt das Icon still auf den Placeholder
// zurueck statt zu laden -- kein Bug, aber eine Verhaltensaenderung, die man sich merken sollte.
export function safeHttpUrl(value: unknown): string {
	let s = value === null || value === undefined ? '' : String(value);
	s = s.replace(/[\t\n\r]/g, '');
	s = s.replace(/^[\x00-\x20]+/, '').replace(/[\x00-\x20]+$/, '');
	const schemeMatch = /^([a-zA-Z][a-zA-Z0-9+\-.]*):/.exec(s);
	if (!schemeMatch) { return ''; }
	const scheme = schemeMatch[1].toLowerCase();
	if (scheme !== 'http' && scheme !== 'https') { return ''; }
	return s;
}
