# Vendored KaTeX 0.18.1

**Version:** 0.18.1
**Quelle:** npm-Registry-Tarball (`npm pack katex@0.18.1`), NICHT als npm-Dependency eingebunden — es gibt kein committetes package-lock, eine schwebende Version könnte das Rendering sonst still verändern (Gitea-#47).
**Lizenz:** MIT (Khan Academy und Mitwirkende) — siehe `LICENSE` in diesem Ordner, unverändert aus dem Tarball übernommen.

## Übernommene Dateien
Die Laufzeit-Artefakte aus `dist/` des Tarballs plus `LICENSE`, 23 Dateien insgesamt:
- `katex.min.js` (KaTeX-Bundle, UMD, setzt `window.katex`)
- `katex.min.css` (referenziert `fonts/*.woff2` relativ, woff/ttf werden nicht mitgeliefert — jedes `@font-face` listet `woff2` zuerst, moderne VS-Code-Webviews brauchen kein Fallback)
- `fonts/*.woff2` (20 Dateien, eine je Schriftschnitt)
- `LICENSE` (MIT, unverändert aus dem Tarball)

`build/copy-assets.js` löscht `out/katex/` zuerst (keine Leichen bei Versions-Updates) und kopiert dann genau diese 23 Dateien dorthin (Teil von `npm run compile`), damit die MIT-Namensnennung mit jedem Deploy mitgeht. Nur diese `VERSION.md` (Update-Notizen für Entwickler) bleibt ausschließlich hier in `assets/`.

## Update-Anleitung
`npm pack katex@<neue-version>` in einem Temp-Ordner ausführen, Tarball entpacken und `dist/katex.min.js`, `dist/katex.min.css`, `dist/fonts/*.woff2` sowie `LICENSE` 1:1 über die Dateien in diesem Ordner kopieren. Anschließend `npm run compile` und die Gates `test:webview-syntax` + `test:math-segments` laufen lassen und die Versionsnummer oben in dieser Datei aktualisieren.
