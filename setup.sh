#!/bin/bash

echo "🌤️  WeatherDrift — Setup Script"
echo "================================"

# Step 1: Install all dependencies
echo ""
echo "📦 Step 1: Installing dependencies..."
npm install

# Step 2: Install Tailwind CSS + PostCSS + Autoprefixer
echo ""
echo "🎨 Step 2: Installing Tailwind CSS..."
npm install -D tailwindcss postcss autoprefixer

# Step 3: Init Tailwind config (skip if already exists)
echo ""
echo "⚙️  Step 3: Initializing Tailwind config..."
if [ ! -f tailwind.config.js ]; then
  npx tailwindcss init -p
  echo "✅ tailwind.config.js created"
else
  echo "✅ tailwind.config.js already exists — skipping"
fi

echo ""
echo "✅ Setup complete! Now run:"
echo ""
echo "   npm run dev"
echo ""
echo "Then open: http://localhost:5173"
