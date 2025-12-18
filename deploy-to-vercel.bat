@echo off
echo 🚀 Deploying NetFlow to Vercel...

echo.
echo 📦 Step 1: Installing Vercel CLI...
npm install -g vercel

echo.
echo 🔧 Step 2: Building frontend...
npm run build

echo.
echo 🌐 Step 3: Deploying frontend...
vercel --prod

echo.
echo 🔧 Step 4: Building backend...
cd backend
npm run vercel-build

echo.
echo 🌐 Step 5: Deploying backend...
vercel --prod

echo.
echo ✅ Deployment complete!
echo.
echo 📝 Next steps:
echo 1. Update environment variables in Vercel dashboard
echo 2. Test your live URLs
echo 3. Configure your WiFi router to redirect to your live system
echo.
pause