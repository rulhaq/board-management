# 🔐 Authentication Setup Guide

## Current Status

✅ **Mock Authentication Enabled for Development**

The application is currently using mock authentication for localhost development, which allows you to test all features without Firebase Auth complications.

## 📋 Available Demo Credentials

### For Testing (Mock Authentication - localhost only):

- **👤 Admin**: `admin@sidra.com` / `admin123`
- **📝 Secretary**: `secretary@sidra.com` / `sec123`  
- **🏥 Board Member**: `dr.khalil@sidra.com` / `board123`

## 🚀 How to Test

1. **Open the application**: http://localhost:5173
2. **Use any of the demo credentials above**
3. **Test different roles** to see the permission differences:
   - **Admin**: Full access, can add/remove board members
   - **Secretary**: Can manage meetings/documents, cannot manage board members
   - **Board Member**: Can view profiles, update own profile, use AI/chat

## 🔧 Firebase Auth Setup (Production)

The users have been imported into Firebase Auth but need passwords set. Here are the options:

### Option 1: Firebase Console (Recommended)
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to Authentication > Users
4. For each user, click the menu (⋮) and select "Reset Password"
5. Send password reset emails to set up passwords

### Option 2: Manual Password Setup
Users can be sent password reset links:
```bash
# For each user email
firebase auth:send-password-reset-email admin@sidra.com
firebase auth:send-password-reset-email secretary@sidra.com
firebase auth:send-password-reset-email dr.khalil@sidra.com
# ... etc for all board members
```

### Option 3: Admin SDK (Advanced)
If you have Firebase Admin SDK credentials, you can programmatically set passwords.

## 🌍 Production Deployment

When deploying to production:
1. Set up proper Firebase Auth passwords
2. Remove or disable mock authentication
3. Ensure all environment variables are configured
4. Test authentication flow in production environment

## 🔍 Current User List

The following users exist in Firebase Auth:
- admin@sidra.com (Administrator)
- secretary@sidra.com (Secretary)
- dr.khalil@sidra.com (Chief Medical Officer)
- dr.sarah@sidra.com (Director of Research)
- prof.omar@sidra.com (Head of Cardiology)
- dr.maryam@sidra.com (Chief Nursing Officer)
- hassan@sidra.com (Chief Financial Officer)
- dr.layla@sidra.com (Director of Quality)

## 🆘 Troubleshooting

**If you see "Invalid Credentials" error:**
1. Make sure you're testing on localhost (mock auth only works locally)
2. Use the exact demo credentials listed above
3. Check browser console for any errors
4. Try refreshing the page

**For production authentication issues:**
1. Verify Firebase configuration in `.env`
2. Check Firebase Console for user status
3. Ensure passwords are properly set for users
4. Verify Firebase Security Rules are deployed

---

**Note**: The mock authentication automatically activates on localhost for development convenience. In production, it will use proper Firebase Authentication. 