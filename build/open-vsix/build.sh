#!/bin/bash

# Build script for Open VSIX version
# This applies Open VSIX-specific changes, builds the package, then reverts

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# Read version from package.json (no hardcoding!)
VERSION=$(node -p "require('${PROJECT_DIR}/package.json').version")
OUTPUT_NAME="vsix-claude-code-chat-${VERSION}.vsix"

echo "Building Open VSIX version ${VERSION}..."

# Backup original files to build folder
cp package.json "${SCRIPT_DIR}/package.json.backup"
cp src/extension.ts "${SCRIPT_DIR}/extension.ts.backup"

# Backup original icon.png if it exists
if [ -f "icon.png" ]; then
    mv icon.png "${SCRIPT_DIR}/icon.png.backup"
fi

# Copy Open VSIX icon
cp "${SCRIPT_DIR}/icon.png" icon.png
echo "Copied Open VSIX icon"

# Temporarily remove icon-bubble.png (not needed for Open VSIX)
if [ -f "icon-bubble.png" ]; then
    mv icon-bubble.png "${SCRIPT_DIR}/icon-bubble.png.backup"
fi

# Apply Open VSIX changes to package.json
sed -i.bak 's/"displayName": "Chat for Claude Code"/"displayName": "Claude Code Chat"/' package.json
sed -i.bak 's/"icon": "icon-bubble.png"/"icon": "icon.png"/g' package.json
rm -f package.json.bak

# Apply Open VSIX changes to extension.ts
sed -i.bak "s/icon-bubble.png/icon.png/g" src/extension.ts
rm -f src/extension.ts.bak

echo "Applied Open VSIX changes to package.json and extension.ts"

# Compile TypeScript
echo "Compiling TypeScript..."
npm run compile

# Build the VSIX
echo "Building VSIX package..."
vsce package --out "${OUTPUT_NAME}"

# Restore original files from build folder
mv "${SCRIPT_DIR}/package.json.backup" package.json
mv "${SCRIPT_DIR}/extension.ts.backup" src/extension.ts

# Restore original icon
rm -f icon.png
if [ -f "${SCRIPT_DIR}/icon.png.backup" ]; then
    mv "${SCRIPT_DIR}/icon.png.backup" icon.png
fi

# Restore icon-bubble.png
if [ -f "${SCRIPT_DIR}/icon-bubble.png.backup" ]; then
    mv "${SCRIPT_DIR}/icon-bubble.png.backup" icon-bubble.png
fi

# Recompile with original extension.ts
echo "Recompiling with original files..."
npm run compile

echo "Restored original files"
echo "Built: ${OUTPUT_NAME}"
