# Deployment Guide for Vercel

## Prerequisites
- GitHub account
- Vercel account (free tier available)
- Repository pushed to GitHub

## Recommended: Deploy Client & Server Separately

### Step 1: Deploy Client (Frontend)

1. Push code to GitHub:
   ```bash
   git add .
   git commit -m "Setup Vercel deployment"
   git push origin main
   ```

2. Go to [vercel.com](https://vercel.com/new)

3. Click **"New Project"** and **"Import Git Repository"**

4. Select your MVP repository

5. In the project settings:
   - **Root Directory**: Select `client`
   - **Framework Preset**: Vite (auto-detected)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

6. Click **"Deploy"**

**Client deployed to:** `your-project.vercel.app`

---

### Step 2: Deploy Server (Backend)

1. Go back to [vercel.com](https://vercel.com/new)

2. Click **"New Project"** and **"Import Git Repository"** (same repo)

3. Configure for backend:
   - **Root Directory**: Select `server`
   - **Framework Preset**: Node.js
   - **Build Command**: `npm install` (leave default)
   - **Install Command**: `npm install`

4. **Add Environment Variables:**
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `PORT`: Keep empty (Vercel assigns port 3000)

5. Click **"Deploy"**

**Server deployed to:** `your-server-mvp.vercel.app`

---

## Step 3: Connect Client to Server

Update your client API calls to use deployed server:

Edit `/client/src/` files that make API calls:

```typescript
// Before
const API_URL = 'http://localhost:5000';

// After
const API_URL = import.meta.env.VITE_API_URL || 'https://your-server-mvp.vercel.app';
```

Add `.env.local` to client:
```
VITE_API_URL=https://your-server-mvp.vercel.app
```

Or in Vercel Client Settings > Environment Variables:
```
VITE_API_URL=https://your-server-mvp.vercel.app
```

---

## What You Get

✅ **Client:** Static React + Vite site  
✅ **Server:** Node.js API with auto-scaling  
✅ **Auto-deployments:** Push to main = auto-deploy  
✅ **Preview URLs:** Test changes before production  
✅ **Monitoring:** Logs & analytics in Vercel dashboard  

---

## Troubleshooting

### 404 Error
- Verify `vercel.json` exists and is correct
- Check `dist/` folder is created after build
- Confirm environment variables are set

### Server Connection Issues
- Verify server URL in client environment variables
- Enable CORS on server (should be enabled)
- Check server logs in Vercel dashboard

### Database Connection Failed
- Verify `DATABASE_URL` in Vercel environment variables
- Ensure PostgreSQL is accessible from Vercel (IP whitelist if needed)

---

## Support
- Vercel Docs: https://vercel.com/docs
- React + Vite: https://vite.dev/guide/ssr.html
- Node.js on Vercel: https://vercel.com/docs/functions/nodejs

