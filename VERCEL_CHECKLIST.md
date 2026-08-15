# Pre-Deployment Checklist for Vercel

## Current public deployment

- Client: `https://client-opal-five-77.vercel.app`
- API: `https://unitex-server.vercel.app`
- API health: `https://unitex-server.vercel.app/api/health`
- Production branch: `agent/optimize-mobile-media`

## ✅ Before Deploying

### Client Setup
- [ ] `/client/vercel.json` exists with correct config
- [ ] `/client/.vercelignore` exists
- [ ] Build succeeds: `npm run build` in `/client`
- [ ] `dist/` folder is created with `index.html`
- [ ] ESLint passes: `npm run lint` returns no errors
- [ ] Anonymous browser can open `/u/DEMO01` and copy/share the public link
- [ ] Anonymous browser is not given access to `/messages`, `/settings`, or media upload actions
- [ ] Vercel has the seven `VITE_FIREBASE_*` values, `VITE_API_URL`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_PUBLISHABLE_KEY`

### Server Setup
- [ ] `/server/vercel.json` has correct routes
- [ ] `/server/.vercelignore` exists
- [ ] `/server/package.json` has `start` script
- [ ] `src/index.js` listens on `process.env.PORT`
- [ ] All dependencies in `package.json` are listed
- [ ] Vercel has `FIREBASE_SERVICE_ACCOUNT`, `CORS_ALLOWED_ORIGINS`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, and `SUPABASE_STORAGE_BUCKET`
- [ ] Firebase rules are deployed: `firebase deploy --only firestore:rules`

### Git & Repository
- [ ] Code is committed to git
- [ ] `.gitignore` excludes `node_modules/` and `.env`
- [ ] No sensitive data in committed files
- [ ] README.md is present

---

## 🚀 Deployment Steps

### Client Deployment (Do This First)
```bash
# 1. From repo root
cd /workspaces/MVP
git add .
git commit -m "Vercel deployment setup"
git push origin agent/optimize-mobile-media

# 2. Go to https://vercel.com/new
# 3. Import GitHub repository
# 4. Set name: "mvp-client"
# 5. Set Root Directory: client
# 6. Click Deploy
```

**Expected Result:** A Vercel client deployment such as `https://client-opal-five-77.vercel.app` ✓

---

### Server Deployment (Do This Second)
```bash
# On vercel.com
# 1. Click New Project
# 2. Import same GitHub repository
# 3. Set name: "mvp-server"
# 4. Set Root Directory: server
# 5. Set Environment Variables:
#    - DATABASE_URL: [your PostgreSQL URL]
# 6. Click Deploy
```

**Expected Result:** A Vercel API deployment such as `https://unitex-server.vercel.app` ✓

---

## 🔧 Post-Deployment

### Update Client to Use Deployed Server
In client Vercel dashboard:
- Go to Settings > Environment Variables
- Add: `VITE_API_URL=https://unitex-server.vercel.app`
- Re-deploy

### Test Endpoints
```bash
# Test server health
curl https://unitex-server.vercel.app/api/health

# Should return:
# {"status":"ok","timestamp":"2026-03-25T..."}
```

---

## ❌ If You Get 404 Error

### Issue 1: Client 404
- [ ] Check `/client/dist/index.html` exists locally
- [ ] Run `npm run build` in client to verify
- [ ] Check Vercel logs for build errors
- [ ] Verify `vercel.json` outputDirectory is `dist`

### Issue 2: Server 404
- [ ] Check server listens on correct port
- [ ] Verify `vercel.json` routes are correct
- [ ] Check Vercel logs for startup errors
- [ ] Ensure `src/index.js` exists and is valid

### Issue 3: Connection Issues
- [ ] Verify server URL in client environment variables
- [ ] Check CORS is enabled in server
- [ ] Check Database_URL is correct (server only)

---

## 📝 Configuration Files Summary

| File | Purpose |
|------|---------|
| `/client/vercel.json` | Client build config |
| `/client/.vercelignore` | Files to exclude from client build |
| `/server/vercel.json` | Server routing & config |
| `/server/.vercelignore` | Files to exclude from server build |
| `/server/package.json` | Server dependencies & scripts |
| `/VERCEL_DEPLOYMENT.md` | Full deployment guide |

---

## 🎯 Success Indicators

✅ Client loads without 404  
✅ Server health check responds  
✅ Client can reach server API  
✅ Database queries work (if applicable)  

For help, check: `VERCEL_DEPLOYMENT.md`
