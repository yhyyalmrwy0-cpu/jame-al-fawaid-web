import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc, 
  doc, 
  setDoc, 
  orderBy, 
  limit,
  Timestamp 
} from "firebase/firestore";

// Firebase Configuration from firebase-applet-config.json
const firebaseConfig = {
  apiKey: "AIzaSyDlUkuAywTTWCPAZZ0xMcVEmD3wCQsMu_0",
  authDomain: "silken-being-x2t1j.firebaseapp.com",
  projectId: "silken-being-x2t1j",
  storageBucket: "silken-being-x2t1j.firebasestorage.app",
  messagingSenderId: "808282091165",
  appId: "1:808282091165:web:c7790bbdc985bb4c9fee74"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with the specific custom database ID
export const db = getFirestore(app, "ai-studio-remix-e036a879-8e87-4762-b7b9-e2b68e5e4e8c");

export interface FirebaseBackup {
  id: string;
  timestamp: number;
  trigger: string;
  benefitsCount: number;
  queriesCount: number;
  data: string; // JSON string
  code: string;  // Activation key
  email?: string;
  createdAt: any;
}

/**
 * Save backup data to Firebase Firestore
 */
export const saveBackupToFirebase = async (
  code: string,
  email: string,
  backupData: { trigger: string; benefitsCount: number; queriesCount: number; data: string }
): Promise<FirebaseBackup> => {
  const normalizedCode = code.trim().toUpperCase();
  const backupId = `firebase-${Date.now()}`;
  
  const backupDoc: Omit<FirebaseBackup, "createdAt"> & { createdAt: Timestamp } = {
    id: backupId,
    timestamp: Date.now(),
    trigger: backupData.trigger || "manual",
    benefitsCount: backupData.benefitsCount || 0,
    queriesCount: backupData.queriesCount || 0,
    data: backupData.data,
    code: normalizedCode,
    email: email ? email.trim().toLowerCase() : "",
    createdAt: Timestamp.now()
  };

  const docRef = doc(db, "backups", backupId);
  await setDoc(docRef, backupDoc);
  
  return {
    ...backupDoc,
    createdAt: backupDoc.createdAt.toMillis()
  };
};

/**
 * List backups from Firebase Firestore filtered by Code and optional Email
 */
export const listBackupsFromFirebase = async (
  code: string,
  email?: string
): Promise<any[]> => {
  const normalizedCode = code.trim().toUpperCase();
  const backupsColl = collection(db, "backups");
  
  let q = query(
    backupsColl, 
    where("code", "==", normalizedCode)
  );

  const querySnapshot = await getDocs(q);
  const backups: any[] = [];
  
  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    // Filter by email if provided
    if (email) {
      const emailMatch = (data.email || "").trim().toLowerCase() === email.trim().toLowerCase();
      if (!emailMatch) return;
    }
    backups.push({
      id: data.id || docSnap.id,
      timestamp: data.timestamp,
      trigger: data.trigger,
      benefitsCount: data.benefitsCount,
      queriesCount: data.queriesCount,
      data: data.data,
      isFirebase: true
    });
  });

  // Sort by timestamp descending in memory to avoid Firestore composite index requirement
  backups.sort((a, b) => b.timestamp - a.timestamp);

  return backups;
};

/**
 * Delete a backup from Firebase Firestore
 */
export const deleteBackupFromFirebase = async (backupId: string): Promise<void> => {
  const docRef = doc(db, "backups", backupId);
  await deleteDoc(docRef);
};
