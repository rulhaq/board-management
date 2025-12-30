# Firebase Hosting Deployment Instructions

## Quick Deploy

```bash
# 1. Build the application
npm run build

# 2. Deploy to Firebase Hosting
firebase deploy --only hosting

# Or use the combined command:
npm run deploy
```

## Prerequisites

1. **Firebase CLI installed:**
   ```bash
   npm install -g firebase-tools
   ```

2. **Logged into Firebase:**
   ```bash
   firebase login
   ```

3. **Project already configured:**
   - `.firebaserc` - Contains project ID: `board-member-app`
   - `firebase.json` - Hosting configuration ready

## Build Configuration

The project uses `@sveltejs/adapter-auto` which will automatically detect the deployment environment. For Firebase Hosting, it will use the appropriate adapter.

**Note:** If you encounter build issues, you may need to:
- Upgrade Node.js to version 20.19+ or 22.12+
- Or use `@sveltejs/adapter-static` for static builds

## Deployment Steps

### Step 1: Build
```bash
npm run build
```
This creates the `build` directory with production-ready files.

### Step 2: Deploy
```bash
firebase deploy --only hosting
```

### Step 3: Deploy Firestore Rules (Important!)
```bash
firebase deploy --only firestore:rules
```

### Step 4: Deploy Storage Rules
```bash
firebase deploy --only storage
```

## Complete Deployment Command

To deploy everything at once:
```bash
firebase deploy
```

This will deploy:
- Hosting
- Firestore rules
- Storage rules
- Functions (if any)

## Post-Deployment

1. Visit your site: `https://board-member-app.web.app` or `https://board-member-app.firebaseapp.com`
2. Test authentication
3. Test document uploads
4. Verify activity logs are working
5. Check admin console access

## Environment Variables

For production, set environment variables in Firebase Console:
1. Go to Firebase Console > Project Settings > Environment Variables
2. Add all variables from `.env` file
3. Or use Firebase Functions config: `firebase functions:config:set`

## Troubleshooting

**Build fails:**
- Check Node.js version: `node --version` (needs 20.19+)
- Clear cache: `rm -rf .svelte-kit node_modules/.vite`
- Reinstall: `rm -rf node_modules && npm install`

**Deployment fails:**
- Verify login: `firebase login`
- Check project: `firebase projects:list`
- Verify `.firebaserc` has correct project ID

**API routes not working:**
- SvelteKit API routes need SSR
- Consider deploying API routes as Cloud Functions
- Or use adapter-node for full SSR support

## Features Completed ✅

1. ✅ Activity logging system
2. ✅ Audit service
3. ✅ Admin can add members with roles
4. ✅ Document permissions updated (all board members can add)
5. ✅ Document upload API created
6. ✅ Firestore rules updated
7. ✅ Firebase Hosting configuration ready

## Remaining Features (Can be added post-deployment)

- Chat storage improvements
- OCR processing for documents
- RAG for AI Assistant
- Admin console UI
- Calendar export
- Dashboard Firebase integration

These can be added incrementally after initial deployment.

