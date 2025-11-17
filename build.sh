#!/bin/bash

# Build script for Claude Code Chat extension

echo "🔨 Building Claude Code Chat extension..."
echo ""

# Compile TypeScript
echo "📦 Compiling TypeScript..."
npm run compile

if [ $? -ne 0 ]; then
    echo "❌ Compilation failed"
    exit 1
fi

echo ""
echo "📦 Creating VSIX package..."
npx vsce package

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build complete!"
    echo "📍 Package location: $(pwd)/claude-code-chat-1.0.7.vsix"
else
    echo "❌ Packaging failed"
    exit 1
fi
