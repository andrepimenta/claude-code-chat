// Platzhalter-Ruecksubstitution fuer Code-Bloecke in parseSimpleMarkdown (#55, Befund aus
// dem #47-Review). String.replace(placeholder, value) interpretiert im Ersatzstring
// "$&"/"$`"/"$'"/"$$" als Substitutionsmuster -- ein Code-Block, dessen (bereits escapetes)
// Inhalt zufaellig eine solche Sequenz enthaelt (z. B. Shell-Code mit "$'...'"), zerlegt
// dadurch das umgebende HTML statt unveraendert zu erscheinen. restoreMathSegments
// (math-script.ts) hat diesen Fix von Anfang an -- diese Funktion zieht die Codeblock-
// Restore-Schleife auf denselben Stand (Funktions-Ersatz statt String-Ersatz). script.ts
// spleisst per .toString() nur den kompilierten Funktionstext in die Seite (Muster
// html-escape.ts/collapse-rules.ts) -- deshalb muss diese Funktion self-contained bleiben:
// kein Modul-Level-Symbol, kein Import, keine Hilfsfunktion ausserhalb des Bodys.
export function restoreCodeBlockPlaceholders(html: string, codeBlockPlaceholders: string[]): string {
	for (let i = 0; i < codeBlockPlaceholders.length; i++) {
		const placeholder = '__CODEBLOCK_' + i + '__';
		const value = codeBlockPlaceholders[i];
		// Funktions-Ersatz, NIE ein String direkt als 2. Argument (siehe Kommentar oben).
		html = html.replace(placeholder, function () { return value; });
	}
	return html;
}
