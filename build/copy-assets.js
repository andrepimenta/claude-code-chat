#!/usr/bin/env node
'use strict';

// Second half of the "compile" npm script: tsc only handles src/**/*.ts, so
// anything the webview loads via asWebviewUri (the vendored KaTeX assets, see
// assets/katex/VERSION.md) needs an explicit copy into out/ -- tsc's outDir never sees
// non-.ts files. Node builtins only, no new dependency for a two-file build step.
//
// Copies katex.min.js + katex.min.css + LICENSE + 20 fonts/*.woff2 (23 files total) --
// LICENSE travels into out/ too so the MIT attribution ships with whatever gets deployed
// from there; only VERSION.md (dev-facing update notes) stays source-tree-only.
//
// out/katex/ is removed first (recursive, force) so a future KaTeX version that drops a
// file (e.g. a retired font) can't leave a stale leftover behind in the build output.

const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'assets', 'katex');
const outDir = path.join(__dirname, '..', 'out', 'katex');

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
fs.cpSync(path.join(assetsDir, 'katex.min.js'), path.join(outDir, 'katex.min.js'));
fs.cpSync(path.join(assetsDir, 'katex.min.css'), path.join(outDir, 'katex.min.css'));
fs.cpSync(path.join(assetsDir, 'LICENSE'), path.join(outDir, 'LICENSE'));
fs.cpSync(path.join(assetsDir, 'fonts'), path.join(outDir, 'fonts'), { recursive: true });

const fontCount = fs.readdirSync(path.join(outDir, 'fonts')).length;
console.log('copy-assets: out/katex/ <- katex.min.js, katex.min.css, LICENSE, fonts/ (' + fontCount + ' font files)');
