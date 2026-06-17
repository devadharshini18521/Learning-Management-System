# Deployment Guide for GitHub & Render

## ✅ Files Ready for GitHub Push

The following files have been modified and are ready to commit:

### Modified Files:
- `backend/.env.example` - Environment template (NEW)
- `backend/config/email.js` - Enhanced error logging
- `backend/controllers/auth.controller.js` - Debug logging
- `frontend/src/services/api.js` - Local backend in development

### New Files:
- `TODO_EMAIL_FIX.md` - Email fix documentation

---

## 🚀 Push to GitHub

```bash
cd /home/zerotrace/Lmsboilerplategeneration

# Stage all changes
git add .

# Create a descriptive commit
git commit -m "fix: Add Resend email logging and local backend support

- Enhanced email config with better error logging
- Added debug logs for forgot password flow
- Frontend now uses local backend in development
- Added .env.example template with Resend setup instructions"

# Push to GitHub
git push origin main
```

---

## ☁️ Deploy to Render (Backend)

### 1. Create a new Web Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New +** → **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `zoho-lms-backend`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: `Node`

### 2. Set Environment Variables

In Render's Environment Variables section, add:

```
NODE_ENV=production
PORT=10000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your-super-secret-jwt-key
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=your-verified-domain.com
FRONTEND_URL=https://your-frontend.onrender.com
```

> **Note**: Get MONGODB_URI from MongoDB Atlas (free tier)

### 3. Update CORS for Production

The `backend/server.js` already allows localhost. For production, update `corsOptions`:

```javascript
const allowedOrigins = [
  'http://localhost:5173',
  'https://your-frontend.onrender.com'  // Add your frontend URL
];
```

---

## 🌐 Deploy Frontend to Render (Optional)

Or deploy frontend to Render as a Static Site:

1. **New +** → **Web Service**
2. Connect GitHub repo
3. Configure:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npx serve dist`

### Set Environment Variable for Frontend:

```
VITE_API_URL=https://your-backend.onrender.com/api
```

---

## 📋 Render Deployment Checklist

- [ ] Push code to GitHub
- [ ] Create MongoDB Atlas account and database
- [ ] Get Resend API key from https://resend.com
- [ ] Deploy backend to Render with environment variables
- [ ] Update `frontend/src/services/api.js` production URL if needed
- [ ] Deploy frontend to Render (or use Firebase)
- [ ] Test forgot password email

---

## 🔧 Troubleshooting

### Email not sending in production?
- Check Render logs for error messages
- Verify `RESEND_API_KEY` is set correctly
- Ensure `EMAIL_FROM` is a verified domain in Resend

### CORS errors?
- Add your Render frontend URL to `allowedOrigins` in `server.js`

### Database connection failed?
- Ensure MongoDB Atlas IP whitelist includes `0.0.0.0/0` (all IPs)
- Check connection string format

