@echo off
REM Vercel deployment build script for Windows
REM This script builds both frontend and backend for Vercel deployment

echo 🚀 Starting Vercel build process...

REM Build frontend
echo 📦 Building frontend...
call npm run build

REM Build backend
echo 🔧 Building backend...
call npm run build:server

REM Copy server files to dist for deployment
echo 📁 Copying server files...
if not exist dist\api mkdir dist\api
xcopy /E /I /Y api\* dist\api\

echo ✅ Build completed successfully!