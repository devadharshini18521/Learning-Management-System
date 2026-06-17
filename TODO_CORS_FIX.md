# TODO: CORS Fix for Render Deployment

## Goal
Fix "Not allowed by CORS" error when frontend on Render tries to access backend.

## Steps Completed
✅ 1. Analyzed the CORS configuration in `backend/server.js`
✅ 2. Identified that the Render frontend origin is not in the allowedOrigins array
✅ 3. Updated `backend/server.js` CORS configuration to:
    - Add support for all Render URLs (`https://*.onrender.com`)
    - Add environment variable `FRONTEND_URL` for additional flexibility
    - Keep existing localhost and Firebase URLs
    - Allow requests with no origin (mobile apps, curl, etc.)

## Steps Pending
🔄 4. Update Render Environment Variables:
    - Add `FRONTEND_URL=https://your-frontend.onrender.com`

## Implementation Notes
The CORS origin check now allows:
- `http://localhost:5173` (Vite dev server)
- `http://localhost:3000` (Alternative dev server)
- `https://zoho-learning-lms.web.app` (Firebase hosting)
- `https://*.onrender.com` (All Render deployments - NEW!)
- `process.env.FRONTEND_URL` (Environment variable for custom URLs)
- Any `http://localhost*` origin (development flexibility)

