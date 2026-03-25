export interface Student {
  id: string;
  name: string;
  xp: number;
  level: number;
  badges: string[];
  avatar: string;
  lastSeen: number;
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
