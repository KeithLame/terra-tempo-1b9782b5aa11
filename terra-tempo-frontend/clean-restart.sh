#!/bin/bash
echo "🧹 Cleaning Next.js cache..."
rm -rf .next
rm -rf node_modules/.cache
echo "✅ Cache cleaned"
echo ""
echo "🚀 Starting dev server..."
echo "⚠️  Remember to hard refresh your browser: Cmd+Shift+R (macOS) or Ctrl+Shift+R (Windows)"
echo ""
npm run dev
