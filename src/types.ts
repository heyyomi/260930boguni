export interface PrizeConfig {
  id: string;
  rank: number;
  name: string;
  quota: number;
  icon: string;
  badgeColor: string;
  tagline: string;
  description: string;
  isSpecialCombo?: boolean;
}

export type UserType = 'student' | 'staff';

export interface ClaimRecord {
  id: string;
  timestamp: string; // ISO 8601
  formattedTime: string; // YYYY. MM. DD HH:mm:ss
  userType: UserType;
  grade?: number; // 1, 2, 3
  classNum?: number; // 1 ~ 8
  name: string;
  role?: string; // 선생님 | 교직원
  prizeId: string;
  prizeName: string;
  prizeRank: number;
  deviceLabel: string; // 디벗 1호기, 디벗 2호기 등
  syncedToGoogleSheet?: boolean;
}

export interface PrizeStat {
  prize: PrizeConfig;
  claimedCount: number;
  remainingCount: number;
  percentage: number;
  isSoldOut: boolean;
}

export interface FilterState {
  userType: 'all' | 'student' | 'staff';
  grade: 'all' | 1 | 2 | 3;
  classNum: 'all' | number;
  prizeId: 'all' | string;
  searchQuery: string;
}

export interface GoogleSheetsConfig {
  webAppUrl: string;
  isConnected: boolean;
  lastSyncAt: string | null;
  autoSync: boolean;
  syncInterval: number; // in seconds
}
