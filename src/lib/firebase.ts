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
  Timestamp,
  onSnapshot,
  updateDoc,
  getDoc
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

export interface P2PPeer {
  id: string;
  name: string;
  lastSeen: number;
  latitude?: number | null;
  longitude?: number | null;
}

export interface P2PTransfer {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  benefitData: {
    title: string;
    content: string;
    category: string;
    source: string;
  };
  status: 'pending' | 'accepted' | 'declined';
  createdAt: number;
}

/**
 * Calculates the Haversine distance between two sets of GPS coordinates in meters
 */
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth's radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // returns distance in meters
};

/**
 * Register or update peer status with optional geolocation coordinates
 */
export const registerP2PPeer = async (
  peerId: string, 
  name: string, 
  latitude?: number | null, 
  longitude?: number | null
): Promise<void> => {
  try {
    const peerDoc = doc(db, "p2p_peers", peerId);
    await setDoc(peerDoc, {
      id: peerId,
      name: name,
      lastSeen: Date.now(),
      latitude: latitude !== undefined ? latitude : null,
      longitude: longitude !== undefined ? longitude : null
    }, { merge: true });
  } catch (error) {
    console.error("Failed to register P2P Peer:", error);
  }
};

/**
 * Unregister peer status (cleanup on disabling)
 */
export const unregisterP2PPeer = async (peerId: string): Promise<void> => {
  try {
    const peerDoc = doc(db, "p2p_peers", peerId);
    await deleteDoc(peerDoc);
  } catch (error) {
    console.error("Failed to unregister P2P Peer:", error);
  }
};

/**
 * Fetch all active peers except current peer
 */
export const fetchActiveP2PPeers = async (myPeerId: string): Promise<P2PPeer[]> => {
  try {
    const peersColl = collection(db, "p2p_peers");
    const snap = await getDocs(peersColl);
    const peers: P2PPeer[] = [];
    const now = Date.now();
    snap.forEach((docSnap) => {
      const data = docSnap.data() as P2PPeer;
      // Filter out self, and filter out peers that haven't been seen in the last 15 minutes (900,000 ms)
      // This is extremely robust against clock skews or minor delays.
      if (data.id && data.id !== myPeerId && (now - (data.lastSeen || 0)) < 900000) {
        peers.push(data);
      }
    });
    return peers;
  } catch (error) {
    console.error("Failed to fetch active peers:", error);
    return [];
  }
};

/**
 * Send a benefit to a receiver
 */
export const initiateP2PTransfer = async (
  senderId: string,
  senderName: string,
  receiverId: string,
  benefit: { title: string; content: string; category: string; source: string }
): Promise<string> => {
  const transferId = `transfer-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const transferDoc: P2PTransfer = {
    id: transferId,
    senderId,
    senderName,
    receiverId,
    benefitData: {
      title: benefit.title,
      content: benefit.content,
      category: benefit.category,
      source: benefit.source || ""
    },
    status: 'pending',
    createdAt: Date.now()
  };
  await setDoc(doc(db, "p2p_transfers", transferId), transferDoc);
  return transferId;
};

/**
 * Accept a transfer
 */
export const acceptP2PTransfer = async (transferId: string): Promise<void> => {
  const transferDoc = doc(db, "p2p_transfers", transferId);
  await updateDoc(transferDoc, { status: 'accepted' });
};

/**
 * Decline a transfer
 */
export const declineP2PTransfer = async (transferId: string): Promise<void> => {
  const transferDoc = doc(db, "p2p_transfers", transferId);
  await updateDoc(transferDoc, { status: 'declined' });
};

/**
 * Listen to incoming transfers targeting current peer
 * Querying by receiverId only avoids needing complex multi-field composite indexes.
 */
export const listenToIncomingTransfers = (
  myPeerId: string,
  onNewTransfer: (transfer: P2PTransfer) => void
): (() => void) => {
  const transfersColl = collection(db, "p2p_transfers");
  const q = query(
    transfersColl,
    where("receiverId", "==", myPeerId)
  );
  return onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added" || change.type === "modified") {
        const data = change.doc.data() as P2PTransfer;
        if (data.status === 'pending') {
          onNewTransfer(data);
        }
      }
    });
  });
};

/**
 * Listen to a specific transfer's status updates (for the sender to monitor)
 */
export const listenToTransferStatus = (
  transferId: string,
  onStatusChange: (status: 'pending' | 'accepted' | 'declined') => void
): (() => void) => {
  const transferDoc = doc(db, "p2p_transfers", transferId);
  return onSnapshot(transferDoc, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data() as P2PTransfer;
      onStatusChange(data.status);
    }
  });
};

/**
 * Delete a transfer record (cleanup)
 */
export const deleteTransferRecord = async (transferId: string): Promise<void> => {
  try {
    const docRef = doc(db, "p2p_transfers", transferId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Failed to delete transfer record:", error);
  }
};
