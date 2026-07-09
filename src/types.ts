export interface Benefit {
  id: string;
  title: string;
  content: string;
  date: string;
  source: string;
  category: string;
  views: number;
  isFavorite: boolean;
  createdAt: number;
}

export interface ScientificQuery {
  id: string;
  title: string;
  content: string;
  date: string;
  source: string;
  isResolved: boolean;
  resolution?: string;
  createdAt: number;
}

export interface AppSettings {
  notificationInterval: '5m' | '30m' | '1h' | '6h' | '12h' | '24h' | 'off';
  theme: 'scholarly' | 'warm_desert' | 'dark_emerald';
  programmerName: string;
  programmerEmail: string;
  autoBackupInterval?: 'on_change' | 'daily' | 'on_exit' | 'off';
  lastBackupTimestamp?: number;
  backupType?: 'local' | 'cloud';
  appPasscode?: string; // 4-digit PIN stored securely (can be synced to Firebase)
  isPasscodeEnabled?: boolean; // Whether PIN lock is active on startup
}

export const CATEGORIES = [
  'العقيدة',
  'الفرق والردود',
  'علوم القرآن',
  'التفسير',
  'التجويد والقراءات',
  'الحديث',
  'العلل',
  'مصطلح الحديث',
  'علم الرجال',
  'الفقه',
  'أصول الفقه',
  'السيرة',
  'التاريخ',
  'التراجم',
  'الفتاوى',
  'الزهد والرقائق',
  'النحو والصرف',
  'الأدب والبلاغة',
  'الثقافة',
  'علوم أخرى'
] as const;

export type CategoryType = typeof CATEGORIES[number];
