# Quick Deploy to Firebase Hosting

## One-Command Deploy

```bash
npm run deploy
```

This will:
1. Build the application (`npm run build`)
2. Deploy to Firebase Hosting (`firebase deploy --only hosting`)

## Manual Steps

If the script doesn't work, run these commands separately:

```bash
# Build
npm run build

# Deploy hosting
firebase deploy --only hosting

# Deploy Firestore rules (IMPORTANT!)
firebase deploy --only firestore:rules

# Deploy Storage rules
firebase deploy --only storage
```

## Your Site URL

After deployment, your app will be available at:
- https://board-member-app.web.app
- https://board-member-app.firebaseapp.com

## Login Credentials

**Super Admin:**
- Email: `cto@scalovate.com`
- Password: `iamgettingOldn0w`

**Admin:**
- Email: `admin@boardgovernance.ai`
- Password: `Admin2024!`

**Secretary:**
- Email: `secretary@boardgovernance.ai`
- Password: `Secretary2024!`

**Board Members:**
- Email: `board.member1@boardgovernance.ai` / `board.member2@boardgovernance.ai`
- Password: `Board2024!`

## Post-Deployment Checklist

- [ ] Test login with super admin
- [ ] Verify members page loads
- [ ] Test document upload
- [ ] Check activity logs are being created
- [ ] Verify Firestore rules are active
- [ ] Test voting functionality
- [ ] Test meetings creation

## Need Help?

See `DEPLOYMENT.md` for detailed instructions and troubleshooting.

