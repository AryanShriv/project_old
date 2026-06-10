# Deployment Guide - Gold Platform

## ✅ Current Deployment Status

### Backend (Render)
- **URL**: https://project-old.onrender.com
- **Database**: MongoDB Atlas
- **Status**: Configured and ready

### Frontend (React Native APK)
- **Platform**: Android via EAS Build
- **Status**: Needs rebuild with production environment variables

---

## 🔧 Configuration Summary

### Environment Variables Updated

#### Frontend `.env`
```env
EXPO_PUBLIC_API_BASE_URL=https://project-old.onrender.com/api/v1
MONGODB_URI=mongodb+srv://agilesppt_db_user:mUNiEI8r8CvK89OK@project-gold.hfhcwty.mongodb.net/gold-platform?retryWrites=true&w=majority&authSource=admin
```

#### Backend `.env` (in `backend/` folder)
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://agilesppt_db_user:mUNiEI8r8CvK89OK@project-gold.hfhcwty.mongodb.net/gold-platform?retryWrites=true&w=majority&authSource=admin
PORT=4000
JWT_ACCESS_SECRET="JWTTOKENS"
JWT_REFRESH_SECRET="JWTTOKENSSS"
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
ADMIN_EMAIL=admin@demo.com
ADMIN_PASSWORD=demo123
ADMIN_NAME=Platform Admin
```

---

## 🚀 Deployment Steps

### Step 1: Push Backend Changes to GitHub
```bash
cd backend
git add .
git commit -m "Update production environment variables with MongoDB Atlas"
git push origin main
```

### Step 2: Render Will Auto-Deploy
- Render is connected to your GitHub repository
- It will automatically detect the push and redeploy
- Monitor the deployment at: https://dashboard.render.com

### Step 3: Verify Backend Deployment
After Render deployment completes, test:
```bash
# Test basic API (should return "Route not found" - this is expected)
curl https://project-old.onrender.com/

# Test health endpoint (if you have one)
curl https://project-old.onrender.com/api/v1/health
```

### Step 4: Rebuild APK with Production Environment
```bash
# Make sure you're in the project root
cd c:\Users\Lenovo\OneDrive\Documents\Codes\project_old

# Build APK with production environment variables baked in
eas build --platform android --profile preview
```

**Important**: Environment variables are baked into the APK at build time, so you must rebuild after changing `.env`.

### Step 5: Test the APK
1. Download the APK from EAS Build dashboard
2. Install on an Android device
3. Test features:
   - Login/Signup
   - Real-time messaging (WebSocket)
   - Theme switching
   - All user flows

---

## ✅ What's Already Configured

### WebSocket Configuration
- **Frontend**: `src/context/ChatContext.tsx` automatically uses `EXPO_PUBLIC_API_BASE_URL`
- **Backend**: Socket.io CORS configured to accept all origins
- **Result**: Real-time chat will work in production ✅

### API Client
- **Frontend**: `src/services/apiClient.ts` uses `EXPO_PUBLIC_API_BASE_URL`
- **Backend**: Express CORS configured to accept all origins
- **Result**: All API calls will work in production ✅

### Database
- **MongoDB Atlas**: Cluster configured at `project-gold.hfhcwty.mongodb.net`
- **Authentication**: Added `authSource=admin` parameter for Render compatibility
- **Result**: Database connection will work on Render ✅

---

## 🔐 Security Recommendations

### Immediate (Before Production Launch)
1. **Rotate MongoDB Password**: The password `mUNiEI8r8CvK89OK` is now in version control
   - Go to MongoDB Atlas → Database Access → Edit User → Reset Password
   - Update both `.env` files with the new password
   - Update Render environment variables

2. **Change JWT Secrets**: Current secrets are weak
   ```bash
   # Generate strong secrets (run in terminal)
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```
   - Update `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` in backend `.env`
   - Add these to Render environment variables (don't commit to Git)

3. **Update Admin Credentials**: Change default admin password
   - Update `ADMIN_EMAIL` and `ADMIN_PASSWORD` in backend `.env`
   - Add to Render environment variables

### Before Production Launch
1. **Restrict CORS Origins**: Update backend to only allow your app
   ```javascript
   // In backend/src/app.js
   app.use(cors({
     origin: ['https://your-production-domain.com'],
     credentials: true
   }));
   
   // In backend/src/config/socketServer.js
   io = new Server(httpServer, {
     cors: {
       origin: ['https://your-production-domain.com'],
       credentials: true
     }
   });
   ```

2. **Add Rate Limiting**: Already implemented in `src/services/rateLimiter.ts` ✅

3. **Add Helmet Security Headers**: Already configured ✅

4. **Set Up SSL/TLS**: Render provides this automatically ✅

---

## 📝 Render Configuration

### Environment Variables to Set in Render Dashboard
Navigate to your service → Environment → Add Environment Variable:

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://agilesppt_db_user:NEW_PASSWORD@project-gold.hfhcwty.mongodb.net/gold-platform?retryWrites=true&w=majority&authSource=admin
JWT_ACCESS_SECRET=<generate-new-secret>
JWT_REFRESH_SECRET=<generate-new-secret>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=<strong-password>
ADMIN_NAME=Platform Admin
PORT=4000
```

**Important**: Render environment variables override `.env` file and are more secure (not in version control).

---

## 🐛 Troubleshooting

### "bad auth : authentication failed" Error
✅ **Fixed**: Added `authSource=admin` to MongoDB connection string

### Backend Returns "Route not found: GET /"
✅ **Expected**: This is normal. The API is at `/api/v1/*` routes, not root `/`

### Render Cold Starts (15-minute timeout)
⚠️ **Known Issue**: Free tier spins down after 15 minutes of inactivity
- First request after downtime will be slow (10-30 seconds)
- Consider upgrading to paid tier for production
- Or implement a keep-alive ping service

### WebSocket Connection Fails
Check:
1. APK was rebuilt after updating `EXPO_PUBLIC_API_BASE_URL`
2. Backend is running on Render
3. Check Render logs for errors: https://dashboard.render.com → Your Service → Logs

### MongoDB Connection Issues
Check:
1. MongoDB Atlas cluster is running
2. IP whitelist includes `0.0.0.0/0` (allow all) or Render's IPs
3. Database user has read/write permissions
4. Connection string has `authSource=admin` parameter

---

## 📱 APK Build Command Reference

```bash
# Preview build (for testing)
eas build --platform android --profile preview

# Production build (for app stores)
eas build --platform android --profile production

# Check build status
eas build:list

# Download latest build
eas build:download
```

---

## 🔄 Next Deployment (After First APK)

1. Make code changes
2. Push to GitHub (backend auto-deploys)
3. If `.env` changed: Rebuild APK
4. If only code changed: APK rebuild not needed unless you want latest features

---

## 📊 Monitoring

### Render Dashboard
- Monitor backend logs: https://dashboard.render.com → Logs
- Check resource usage: Dashboard → Metrics
- View deployment history: Dashboard → Events

### MongoDB Atlas
- Monitor database: https://cloud.mongodb.com
- Check connection count: Metrics tab
- View slow queries: Performance Advisor

### EAS Build
- Build history: https://expo.dev/accounts/[your-account]/projects/project-old/builds
- Download APKs: Same page

---

## 🎯 Success Checklist

Before considering deployment complete:

- [ ] Backend deployed to Render successfully
- [ ] MongoDB connection working (check Render logs)
- [ ] Secrets rotated (MongoDB password, JWT secrets)
- [ ] APK rebuilt with production environment variables
- [ ] Login/Signup tested on APK
- [ ] Real-time messaging tested on APK
- [ ] Theme switching works on APK
- [ ] All user role flows tested (Client, Freelancer, Admin)
- [ ] CORS restricted to production domain
- [ ] Render environment variables configured
- [ ] `.env` files removed from Git (added to `.gitignore`)

---

## 🔗 Useful Links

- **Backend URL**: https://project-old.onrender.com
- **Render Dashboard**: https://dashboard.render.com
- **MongoDB Atlas**: https://cloud.mongodb.com
- **EAS Build Dashboard**: https://expo.dev
- **GitHub Repository**: https://github.com/AryanShriv/project_old

---

## 💡 Tips

1. **Environment Variables**: Always use Render dashboard for secrets, not `.env` files in Git
2. **Cold Starts**: First request after 15 minutes will be slow on free tier
3. **APK Updates**: Only rebuild if `.env` changes or you want latest code features
4. **Database**: MongoDB Atlas free tier (M0) is sufficient for testing/MVP
5. **Logs**: Always check Render logs when troubleshooting backend issues

---

**Last Updated**: After successful backend deployment with MongoDB Atlas integration
**Status**: Ready for APK rebuild and testing
