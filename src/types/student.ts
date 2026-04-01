export interface Student {
  id: string;
  name: string;
  nickname?: string;
  xp: number;
  level: number;
  badges: string[];
  avatar: string;
  lastSeen: number;
  attendanceHistory: AttendanceRecord[];
  streak: number;
}

export interface AttendanceRecord {
  date: string; // YYYY-MM-DD format
  xpEarned: number;
  videoWatched: boolean;
}

export interface Lesson {
  startTime: number;
  title: string;
  zoomLink: string;
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
