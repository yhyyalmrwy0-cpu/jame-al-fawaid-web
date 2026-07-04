import { getApiUrl } from './api';

/**
 * Helper to refresh Google OAuth token
 */
export const refreshGoogleAccessToken = async (): Promise<string | null> => {
  const refreshToken = localStorage.getItem('abuosid_google_refresh_token');
  if (!refreshToken) return null;

  try {
    const res = await fetch(getApiUrl('/api/auth/google/refresh'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.accessToken) {
        localStorage.setItem('abuosid_google_access_token', data.accessToken);
        if (data.refreshToken) {
          localStorage.setItem('abuosid_google_refresh_token', data.refreshToken);
        }
        return data.accessToken;
      }
    }
  } catch (e) {
    console.error('Error refreshing Google token:', e);
  }
  return null;
};

/**
 * Upload a backup file to Google Drive
 */
export const uploadToGoogleDrive = async (
  token: string, 
  backupDataStr: string, 
  trigger: string, 
  bCount: number, 
  qCount: number
): Promise<any> => {
  const timestamp = Date.now();
  const filename = `abuosid_backup_${timestamp}_${trigger}_${bCount}_${qCount}.json`;

  const fileMetadata = {
    name: filename,
    mimeType: 'application/json',
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(fileMetadata)], { type: 'application/json' }));
  form.append('file', new Blob([backupDataStr], { type: 'application/json' }));

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });

  if (!res.ok) {
    if (res.status === 401) {
      const newToken = await refreshGoogleAccessToken();
      if (newToken) {
        return uploadToGoogleDrive(newToken, backupDataStr, trigger, bCount, qCount);
      }
    }
    throw new Error('Failed to upload file to Google Drive');
  }

  return await res.json();
};

/**
 * List backup files from Google Drive
 */
export const listGoogleDriveBackups = async (token: string): Promise<any[]> => {
  const query = encodeURIComponent("name contains 'abuosid_backup_' and mimeType = 'application/json' and trashed = false");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,createdTime,size)&orderBy=createdTime desc`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    if (res.status === 401) {
      const newToken = await refreshGoogleAccessToken();
      if (newToken) {
        return listGoogleDriveBackups(newToken);
      }
    }
    throw new Error('Failed to list files from Google Drive');
  }

  const data = await res.json();
  const files = data.files || [];

  // Map Google Drive files to historical backups
  return files.map((file: any) => {
    // Parse name: abuosid_backup_<timestamp>_<trigger>_<benefitsCount>_<queriesCount>.json
    const parts = file.name.replace('abuosid_backup_', '').replace('.json', '').split('_');
    const timestamp = parseInt(parts[0], 10) || new Date(file.createdTime).getTime();
    const trigger = parts[1] || 'manual';
    const benefitsCount = parseInt(parts[2], 10) || 0;
    const queriesCount = parseInt(parts[3], 10) || 0;

    return {
      id: file.id, // Google drive file ID
      timestamp,
      trigger,
      benefitsCount,
      queriesCount,
      data: '', // Will fetch data dynamically only when restoring
      isGoogleDrive: true
    };
  });
};

/**
 * Download file content from Google Drive
 */
export const downloadFromGoogleDrive = async (token: string, fileId: string): Promise<string> => {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    if (res.status === 401) {
      const newToken = await refreshGoogleAccessToken();
      if (newToken) {
        return downloadFromGoogleDrive(newToken, fileId);
      }
    }
    throw new Error('Failed to download file from Google Drive');
  }

  return await res.text();
};

/**
 * Delete a file from Google Drive
 */
export const deleteFromGoogleDrive = async (token: string, fileId: string): Promise<void> => {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    if (res.status === 401) {
      const newToken = await refreshGoogleAccessToken();
      if (newToken) {
        return deleteFromGoogleDrive(newToken, fileId);
      }
    }
    throw new Error('Failed to delete file from Google Drive');
  }
};
