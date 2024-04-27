import { initializeApp, cert, getApp } from 'firebase-admin/app';
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore"; 

const appName = `GMDI Discord Bot (Server-Side)`;

const app = () => {
  try {
    return getApp(appName);
  } catch {
    return initializeApp({
      databaseURL: `https://${process.env.FIREBASE_ADMIN_DB_ENDPOINT}`,
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      credential: cert({
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY,
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID
      })
    }, appName);
  };
};

const constitutedApp = app();

export const auth = getAuth(constitutedApp);

export const firestore = getFirestore(constitutedApp);