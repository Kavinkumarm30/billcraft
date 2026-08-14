import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import firebaseConfig from '../../firebase-applet-config.json';

if (!getApps().length) {
  // Read the projectId directly from the firebase-applet-config.json or environment
  initializeApp({
    projectId: firebaseConfig.projectId || process.env.FIREBASE_PROJECT_ID || 'billcraft-8c8c2',
  });
}

export const adminAuth = getAuth();
