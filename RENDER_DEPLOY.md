# Render Deployment Guide

This e-commerce store has been prepared for deployment on Render.com as two separate services:

1. **Backend API** (Node.js/Express) — https://github.com/uwaizeben-commits/sommys_store-backend
2. **Frontend** (React/Vite static site) — https://github.com/uwaizeben-commits/sommys_store-frontend

## Deployment Steps

### Step 1: Sign up on Render (if not done)
- Visit https://render.com and create a free account
- Link your GitHub account to Render

### Step 2: Deploy Backend API

1. Go to **Render Dashboard** → **New +** → **Web Service**
2. Select repository: `sommys_store-backend`
3. Configure:
   - **Name**: `sommys-store-backend`
   - **Region**: (default is fine)
   - **Branch**: `master`
   - **Language/Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. **Environment Variables** (click "Add From File" or add manually):
   - Key: `MONGO_URI` | Value: `mongodb+srv://[user]:[pass]@cluster.mongodb.net/dbname?appName=appname` (get from your MongoDB Atlas connection string)
   - Key: `NODE_ENV` | Value: `production`
   - Key: `PORT` | Value: `5001` (optional; Render assigns port automatically)
5. Click **Create Web Service** and wait for deployment
6. Note the **Backend URL** (e.g., `https://sommys-store-backend.onrender.com`)

### Step 3: Update Frontend API URL

Before deploying frontend, we need to update the frontend code to point to the deployed backend:

1. In the frontend repo, update files that reference the API:
   - `src/pages/AdminLogin.jsx` — change `ADMIN_LOGIN_URL` and `ADMIN_REGISTER_URL` from `http://localhost:5001` to your Render backend URL
   - `src/pages/AdminDashboard.jsx` — change `API_URL` from `http://localhost:5001` to your Render backend URL
   - `src/pages/SignIn.jsx`, `SignUp.jsx` — update `AUTH_SIGNIN_URL`, `AUTH_SIGNUP_URL` similarly
   - `src/pages/Products.jsx` — change fetch URL from `/api/products` to `https://your-backend-url/api/products` (or set env var)

   Or: Use environment variables (recommended):
   - Create `.env` in frontend root: `VITE_API_URL=https://sommys-store-backend.onrender.com`
   - Update code to use `import.meta.env.VITE_API_URL` instead of hardcoded URLs

2. Commit and push to `main` branch

### Step 4: Deploy Frontend

1. Go to **Render Dashboard** → **New +** → **Static Site**
2. Select repository: `sommys_store-frontend`
3. Configure:
   - **Name**: `sommys-store-frontend`
   - **Branch**: `main`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Click **Create Static Site** and wait for build/deployment
5. Your frontend will be live at a URL like `https://sommys-store-frontend.onrender.com`

## Important Notes

- **Environment Variables**: Do NOT commit `.env` or any secrets. Always set them in Render's dashboard.
- **CORS**: The backend CORS might need to allow your frontend domain. Update `src/index.js` if needed:
  ```javascript
  const cors = require('cors')
  app.use(cors({
    origin: ['https://sommys-store-frontend.onrender.com']
  }))
  ```
- **MongoDB Connection**: Make sure your MongoDB Atlas IP whitelist includes Render's IPs, or set it to allow all (`0.0.0.0/0`)
- **Free Tier**: Free services on Render spin down after 15 minutes of inactivity. Paid plans run continuously.

## Troubleshooting

- **Build fails**: Check build logs in Render dashboard. Ensure all dependencies are in `package.json`.
- **Server won't start**: Check that the start command matches your `src/index.js` entry point.
- **Frontend can't reach backend**: Verify CORS is enabled and the backend URL in frontend code is correct.
- **MongoDB connection error**: Check `MONGO_URI` environment variable and make sure it's valid.

## Custom Domain (Optional)

1. In Render dashboard, go to your service → **Settings** → **Custom Domain**
2. Add your domain and follow DNS setup instructions provided by Render

That's it! Your store is now live on Render. 🚀
