#!/bin/bash
# Deploy TheLazyCPA to Vercel
# Run this script tomorrow with your API keys

echo "🚀 Deploying TheLazyCPA..."

# Check if vercel is installed
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

# Navigate to project
cd /home/openclaw/.openclaw/workspace/thelazycpa

# Deploy to Vercel
echo "Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Set up custom domain (thelazycpa.com) in Vercel dashboard"
echo "2. Connect ConvertKit for email capture"
echo "3. Post on LinkedIn"
