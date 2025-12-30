import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Initialize Firebase Admin
const serviceAccount = {
  type: 'service_account',
  project_id: process.env.VITE_FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
};

try {
  initializeApp({
    credential: cert(serviceAccount),
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  });
} catch (error) {
  console.error('Firebase Admin initialization error:', error.message);
  process.exit(1);
}

const auth = getAuth();

const users = [
  { uid: 'admin-uid-001', email: 'admin@sidra.com', password: 'admin123' },
  { uid: 'secretary-uid-001', email: 'secretary@sidra.com', password: 'sec123' },
  { uid: 'khalil-uid-001', email: 'dr.khalil@sidra.com', password: 'board123' },
  { uid: 'sarah-uid-001', email: 'dr.sarah@sidra.com', password: 'board123' },
  { uid: 'omar-uid-001', email: 'prof.omar@sidra.com', password: 'board123' },
  { uid: 'maryam-uid-001', email: 'dr.maryam@sidra.com', password: 'board123' },
  { uid: 'hassan-uid-001', email: 'hassan@sidra.com', password: 'board123' },
  { uid: 'layla-uid-001', email: 'dr.layla@sidra.com', password: 'board123' }
];

async function setupUsers() {
  console.log('Setting up user passwords...');
  
  for (const userData of users) {
    try {
      await auth.updateUser(userData.uid, {
        password: userData.password,
        emailVerified: true
      });
      console.log(`✅ Set password for ${userData.email}`);
    } catch (error) {
      console.error(`❌ Error setting password for ${userData.email}:`, error.message);
    }
  }
  
  console.log('\n🎉 User setup complete!');
  console.log('\n📋 Demo Credentials:');
  console.log('👤 Admin: admin@sidra.com / admin123');
  console.log('📝 Secretary: secretary@sidra.com / sec123');
  console.log('🏥 Board Members: dr.khalil@sidra.com / board123');
  console.log('    (All board members use password: board123)');
}

setupUsers().catch(console.error); 