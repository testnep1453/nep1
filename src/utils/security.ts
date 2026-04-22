/**
 * Security Utilities
 * Input sanitization, validation, and security helpers
 */

/**
 * Sanitize user input to prevent XSS attacks
 * Removes all HTML tags and dangerous characters
 */
export const sanitizeInput = (input: string | null | undefined): string => {
  if (!input) return '';
  
  return input
    .replace(/[<>]/g, '')           // Remove < and >
    .replace(/&/g, '&amp;')         // Escape &
    .replace(/"/g, '&quot;')        // Escape quotes
    .replace(/'/g, '&#x27;')         // Escape single quotes
    .replace(/\//g, '&#x2F;')       // Escape forward slash
    .trim();
};

/**
 * Validate student ID format (3-4 digit number)
 */
export const isValidStudentId = (id: string): boolean => {
  return /^\d{3,4}$/.test(id);
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Rate limiting helper
 */
export class RateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }>;
  private maxAttempts: number;
  private windowMs: number;

  constructor(maxAttempts = 5, windowMs = 15 * 60 * 1000) {
    this.attempts = new Map();
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  canProceed(key: string): boolean {
    const now = Date.now();
    const record = this.attempts.get(key);

    if (!record) return true;

    // Reset if window has passed
    if (now > record.resetTime) {
      this.attempts.delete(key);
      return true;
    }

    return record.count < this.maxAttempts;
  }

  recordAttempt(key: string): void {
    const now = Date.now();
    const record = this.attempts.get(key);

    if (!record || now > record.resetTime) {
      this.attempts.set(key, {
        count: 1,
        resetTime: now + this.windowMs
      });
    } else {
      record.count++;
    }
  }

  getRemainingAttempts(key: string): number {
    const record = this.attempts.get(key);
    if (!record) return this.maxAttempts;
    return Math.max(0, this.maxAttempts - record.count);
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
}

// Global rate limiter instance for login attempts
export const loginRateLimiter = new RateLimiter(5, 15 * 60 * 1000);

/**
 * Generate a secure random ID
 */
export const generateSecureId = (): string => {
  return window.crypto.randomUUID();
};

/**
 * Hash sensitive data (one-way hash for logging/analytics)
 */
export const hashData = async (data: string): Promise<string> => {
  const encoder = new TextEncoder();
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', encoder.encode(data));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Security logging helper (logs to console in dev, to service in prod)
 */
export const securityLog = (event: string, details?: Record<string, unknown>): void => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    event,
    details,
    userAgent: navigator.userAgent,
    url: window.location.href
  };

  if (import.meta.env.DEV) {
    console.log('[SECURITY]', logEntry);
  } else {
    // In production, send to secure logging endpoint
    // fetch('/api/security-log', { method: 'POST', body: JSON.stringify(logEntry) });
  }
};

/**
 * Check if text contains potential SQL injection patterns
 */
export const containsSqlInjection = (input: string): boolean => {
  const sqlPatterns = [
    /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
    /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
    /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
    /((\%27)|(\'))union/i,
    /exec\s*\(/i,
    /select\s+.*\s+from/i,
    /delete\s+from/i,
    /insert\s+into/i,
    /drop\s+table/i
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
};

/**
 * Validate and sanitize YouTube URL
 */
export const sanitizeYoutubeUrl = (url: string): string | null => {
  if (!url) return null;
  
  // Only allow youtube.com and youtu.be domains
  const allowedDomains = ['youtube.com', 'youtu.be', 'www.youtube.com'];
  try {
    const urlObj = new URL(url);
    if (!allowedDomains.some(domain => urlObj.hostname.includes(domain))) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
};
