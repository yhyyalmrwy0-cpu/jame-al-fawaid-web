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
  apiKey: "AIzaSyDPCFId6_QL3jnwiL8_6MrHvCJSC0wwdik",
  authDomain: "jame-al-fawaid.firebaseapp.com",
  databaseURL: "https://jame-al-fawaid-default-rtdb.firebaseio.com",
  projectId: "jame-al-fawaid",
  storageBucket: "jame-al-fawaid.firebasestorage.app",
  messagingSenderId: "259362855839",
  appId: "1:259362855839:web:a475f4edade78b9707fbaa"
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
    where("code", "==", normalizedCode),
    orderBy("timestamp", "desc")
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

  return backups;
};

/**
 * Delete a backup from Firebase Firestore
 */
export const deleteBackupFromFirebase = async (backupId: string): Promise<void> => {
  const docRef = doc(db, "backups", backupId);
  await deleteDoc(docRef);
};
