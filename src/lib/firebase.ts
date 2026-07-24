// Clean Local & Offline Storage Engine (Firebase Free)

export const getDb = () => null;
export const db = null;

export interface FirebaseBackup {
  id: string;
  timestamp: number;
  trigger: string;
  benefitsCount: number;
  queriesCount: number;
  data: string; // JSON string
  code: string;  // Activation key
  email?: string;
  createdAt: number;
}

/**
 * Save backup data locally
 */
export const saveBackupToFirebase = async (
  code: string,
  email: string,
  backupData: { trigger: string; benefitsCount: number; queriesCount: number; data: string }
): Promise<FirebaseBackup> => {
  const normalizedCode = code.trim().toUpperCase();
  const backupId = `local-${Date.now()}`;
  
  const backupDoc: FirebaseBackup = {
    id: backupId,
    timestamp: Date.now(),
    trigger: backupData.trigger || "manual",
    benefitsCount: backupData.benefitsCount || 0,
    queriesCount: backupData.queriesCount || 0,
    data: backupData.data,
    code: normalizedCode,
    email: email ? email.trim().toLowerCase() : "",
    createdAt: Date.now()
  };

  try {
    const existing = localStorage.getItem('abuosid_backups_history');
    const list = existing ? JSON.parse(existing) : [];
    list.unshift(backupDoc);
    localStorage.setItem('abuosid_backups_history', JSON.stringify(list.slice(0, 20)));
  } catch (e) {
    console.warn("Local storage write error:", e);
  }

  return backupDoc;
};

/**
 * List backups from local storage
 */
export const listBackupsFromFirebase = async (
  code: string,
  email?: string
): Promise<any[]> => {
  try {
    const existing = localStorage.getItem('abuosid_backups_history');
    if (!existing) return [];
    const list = JSON.parse(existing);
    const normalizedCode = code.trim().toUpperCase();
    return list.filter((b: any) => {
      if (b.code && b.code !== normalizedCode) return false;
      if (email && b.email && b.email.trim().toLowerCase() !== email.trim().toLowerCase()) return false;
      return true;
    });
  } catch (e) {
    console.warn("Failed to fetch backups:", e);
    return [];
  }
};

/**
 * Delete a backup from local storage
 */
export const deleteBackupFromFirebase = async (backupId: string): Promise<void> => {
  try {
    const existing = localStorage.getItem('abuosid_backups_history');
    if (!existing) return;
    const list = JSON.parse(existing);
    const updated = list.filter((b: any) => b.id !== backupId);
    localStorage.setItem('abuosid_backups_history', JSON.stringify(updated));
  } catch (e) {
    console.warn("Failed to delete backup:", e);
  }
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

export const registerP2PPeer = async (
  _peerId: string, 
  _name: string, 
  _latitude?: number | null, 
  _longitude?: number | null
): Promise<void> => {};

export const unregisterP2PPeer = async (_peerId: string): Promise<void> => {};

export const fetchActiveP2PPeers = async (_myPeerId: string): Promise<P2PPeer[]> => {
  return [];
};

export const initiateP2PTransfer = async (
  _senderId: string,
  _senderName: string,
  _receiverId: string,
  _benefit: { title: string; content: string; category: string; source: string }
): Promise<string> => {
  const transferId = `transfer-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  return transferId;
};

export const acceptP2PTransfer = async (_transferId: string): Promise<void> => {};

export const declineP2PTransfer = async (_transferId: string): Promise<void> => {};

export const listenToIncomingTransfers = (
  _myPeerId: string,
  _onNewTransfer: (transfer: P2PTransfer) => void
): (() => void) => {
  return () => {};
};

export const listenToTransferStatus = (
  _transferId: string,
  _onStatusChange: (status: 'pending' | 'accepted' | 'declined') => void
): (() => void) => {
  return () => {};
};

export const deleteTransferRecord = async (_transferId: string): Promise<void> => {};
