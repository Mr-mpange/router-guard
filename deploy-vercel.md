# 🚀 Deploy to Vercel - Step by Step Guide

## Prerequisites
1. Install Vercel CLI: `npm install -g vercel`
2. Create Vercel account at https://vercel.com
3. Login to Vercel: `vercel login`

## Step 1: Deploy Backend (API)
```bash
cd backend
vercel --prod
```

**During deployment, configure these environment variables in Vercel dashboard:**
```
DATABASE_URL=file:./dev.db
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=production
ZENOPAY_API_KEY=zhSoTm5n-rtrKEPICtZbQjksN0yADCAoq76JO_9W8tOqI70fhaMY3-iqdbm0UP5z4a4qY-hOootZVt7_g4PHFA
ZENOPAY_SECRET_KEY=your-zenopay-secret-key-here
ZENOPAY_BASE_URL=https://api.zenopay.co.tz
```

**Your backend will be live at:** `https://your-backend-name.vercel.app`

## Step 2: Deploy Frontend
```bash
# Go back to root directory
cd ..

# Update environment variables
echo "VITE_API_URL=https://your-backend-name.vercel.app" > .env.production

# Deploy frontend
vercel --prod
```

**Your frontend will be live at:** `https://your-frontend-name.vercel.app`

## Step 3: Update Backend Environment
Update your backend environment variables in Vercel dashboard:
```
FRONTEND_URL=https://your-frontend-name.vercel.app
ZENOPAY_WEBHOOK_URL=https://your-backend-name.vercel.app/api/webhooks/zenopay
API_URL=https://your-backend-name.vercel.app
```

## Step 4: Test Your Live System
1. Visit your frontend URL
2. Test user registration
3. Test payment flow
4. Check admin dashboard

## Step 5: Connect WiFi
Once live, you can connect any WiFi router to redirect to your system:
- Router Admin → Captive Portal → Redirect URL: `https://your-frontend-name.vercel.app/portal`

## 🎉 Your WiFi Management System is Now Live!