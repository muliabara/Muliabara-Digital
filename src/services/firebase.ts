import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';

export const firebaseConfig = {
  projectId: firebaseConfigData.projectId || "gen-lang-client-0632240749",
  appId: firebaseConfigData.appId || "1:470545468874:web:ae334a95c841fac1819333",
  apiKey: firebaseConfigData.apiKey || "AIzaSyCU8T7WwAXomf-VNXG8x92D0uw_rW01DJ4",
  authDomain: firebaseConfigData.authDomain || "gen-lang-client-0632240749.firebaseapp.com",
  firestoreDatabaseId: firebaseConfigData.firestoreDatabaseId || "ai-studio-smartp2hupdate-ffe5f723-e704-4398-9df0-5e456a91fe3d",
  storageBucket: firebaseConfigData.storageBucket || "gen-lang-client-0632240749.firebasestorage.app",
  messagingSenderId: firebaseConfigData.messagingSenderId || "470545468874"
};

// Initialize Firebase App singleton
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with custom database ID and ignoreUndefinedProperties
const targetDbId = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? firebaseConfig.firestoreDatabaseId
  : undefined;

let firestoreInstance;
try {
  firestoreInstance = initializeFirestore(app, {
    ignoreUndefinedProperties: true
  }, targetDbId);
} catch {
  firestoreInstance = targetDbId ? getFirestore(app, targetDbId) : getFirestore(app);
}

export const db = firestoreInstance;

// Test connection on boot
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'not-found') {
      return true;
    }
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firestore client is offline, check connection.");
      return false;
    }
    return true;
  }
}
