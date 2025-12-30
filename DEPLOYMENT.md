# Deployment Guide - Board Governance AI

## Firebase Hosting Deployment

### Prerequisites
1. Firebase CLI installed: `npm install -g firebase-tools`
2. Logged into Firebase: `firebase login`
3. Project configured: `.firebaserc` and `firebase.json` already set up

### Build and Deploy Steps

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build the application:**
   ```bash
   npm run build
   ```

3. **Deploy to Firebase Hosting:**
   ```bash
   firebase deploy --only hosting
   ```

   Or use the npm script:
   ```bash
   npm run deploy
   ```

### Environment Variables

Make sure your `.env` file has all required variables:
- Firebase configuration (API keys, project ID, etc.)
- AI API keys (OpenAI, Groq)
- SMTP configuration for emails
- Firebase Admin SDK credentials

**Note:** For production, set these as environment variables in Firebase Functions or use Firebase Config.

### Firebase Hosting Configuration

The `firebase.json` is already configured with:
- Public directory: `build`
- SPA rewrites to `index.html`
- Security headers
- Cache control for static assets

### Post-Deployment Checklist

1. ✅ Verify Firestore rules are deployed: `firebase deploy --only firestore:rules`
2. ✅ Verify Storage rules are deployed: `firebase deploy --only storage`
3. ✅ Test authentication flow
4. ✅ Test document uploads
5. ✅ Verify API routes are working
6. ✅ Check activity logs are being created

### Troubleshooting

**Build fails:**
- Check Node.js version (requires Node 18+)
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check for TypeScript errors: `npm run check`

**Deployment fails:**
- Verify Firebase login: `firebase login`
- Check project ID matches: `firebase projects:list`
- Verify `.firebaserc` has correct project ID

**API routes not working:**
- SvelteKit API routes need SSR - consider using Cloud Functions for API endpoints
- Or use adapter-node and deploy to Cloud Run

### Alternative: Deploy with Cloud Functions

For full SSR support with API routes:

1. Install adapter-node: `npm install -D @sveltejs/adapter-node`
2. Update `svelte.config.js` to use adapter-node
3. Deploy functions: `firebase deploy --only functions`
4. Update `firebase.json` rewrites to point to Cloud Functions
