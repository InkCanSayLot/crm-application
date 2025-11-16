#!/bin/bash

# Vercel deployment build script
# This script builds both frontend and backend for Vercel deployment

echo "🚀 Starting Vercel build process..."

# Build frontend
echo "📦 Building frontend..."
npm run build

# Build backend
echo "🔧 Building backend..."
npm run build:server

# Copy server files to dist for deployment
echo "📁 Copying server files..."
mkdir -p dist/api
cp -r api/* dist/api/

echo "✅ Build completed successfully!"