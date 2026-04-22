export interface Student {
  id: string;
  name: string;
  nickname?: string;
  email: string;
  encryptedName?: string;
  encryptedEmail?: string;
  xp: number;
  level: number;
  badges: string[];
  avatar: string;
  lastSeen: number;
  attendanceHistory?: AttendanceRecord[];
  streak?: number;
  devices?: DeviceRecord[];
  primaryDeviceFingerprint?: string;
}

export interface DeviceRecord {
  fingerprint: string;
  userAgent: string;
  platform: string;
  language: string;
  screenResolution: string;
  deviceType: 'mobil' | 'tablet' | 'masaüstü';
  isTouchDevice: boolean;
  firstSeen: number;
  lastSeen: number;
  approved: boolean;
}

export interface AttendanceRecord {
  date: string; // YYYY-MM-DD format
  lessonDate: string; // hangi ders tarihi
  xpEarned: number;
  joinedAt: number; // timestamp
  autoJoined: boolean; // zero-click ile mi katıldı
}

export interface Lesson {
  startTime: number;
  endTime: number;
  title: string;
  zoomLink: string;
  date: string; // YYYY-MM-DD
}

export interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

export type Theme = 'dark' | 'light';

export interface EmojiReaction {
  id: string;
  emoji: string;
  x: number;
  timestamp: number;
}

export interface Trailer {
  youtubeId: string;
  showDate: string; // YYYY-MM-DD
  showTime: string; // HH:MM (24h format)
  isActive: boolean;
}

export interface FeedbackEntry {
  id: string;
  studentId: string;
  lessonDate: string; // YYYY-MM-DD
  lessonNo?: number;  // Ders numarası
  rating: number; // 1-5
  comment: string;
  createdAt: number;
  anonymous: boolean;
}

export interface AutoMessage {
  id: string;
  text: string;
  date: number;
  type: 'reminder' | 'lesson_start' | 'admin' | 'system';
  lessonDate?: string;
}

