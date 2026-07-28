# Vendored KaTeX 0.18.1

**Version:** 0.18.1
**Source:** npm registry tarball (`npm pack katex@0.18.1`), NOT wired in as an npm dependency -- there is no committed package-lock, and a floating version could silently change the rendering otherwise.
**License:** MIT (Khan Academy and contributors) -- see `LICENSE` in this folder, taken unmodified from the tarball.

## Vendored files
The runtime artifacts from the tarball's `dist/` plus `LICENSE`, 23 files in total:
- `katex.min.js` (KaTeX bundle, UMD, sets `window.katex`)
- `katex.min.css` (references `fonts/*.woff2` relatively; woff/ttf are not shipped -- every `@font-face` lists `woff2` first, modern VS Code webviews need no fallback)
- `fonts/*.woff2` (20 files, one per font variant)
- `LICENSE` (MIT, taken unmodified from the tarball)

`build/copy-assets.js` removes `out/katex/` first (no leftovers across version updates) and then copies exactly these 23 files there (part of `npm run compile`), so the MIT attribution ships with every deploy. Only this `VERSION.md` (update notes for developers) stays exclusively here in `assets/`.

## Update instructions
Run `npm pack katex@<new-version>` in a temp folder, unpack the tarball, and copy `dist/katex.min.js`, `dist/katex.min.css`, `dist/fonts/*.woff2` as well as `LICENSE` 1:1 over the files in this folder. Then run `npm run compile` and the `test:webview-syntax` + `test:math-segments` gates, and update the version number at the top of this file.
