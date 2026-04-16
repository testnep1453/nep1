import seedData from '../student_list.json';
import { Student } from '../types/student';

/**
 * İstemci tarafı depolama ve oturum yönetimi servisi.
 */

let cachedSeedData: Student[] | null = null;

const getCachedSeedData = (): Student[] => {
  if (!cachedSeedData) {
    cachedSeedData = seedData as Student[];
  }
  return cachedSeedData;
};

/**
 * Statik öğrenci listesini döner.
 */
export const getStudents = (): Student[] => {
  return getCachedSeedData();
};

/**
 * Aktif oturum bilgisini (studentId) kaydeder.
 */
export const saveSession = (studentId: string) => {
  localStorage.setItem('studentId', studentId);
};

/**
 * Oturum bilgisini temizler.
 */
export const clearSession = () => {
  localStorage.removeItem('studentId');
};

/**
 * Kayıtlı studentId'yi döner.
 */
export const getSessionId = (): string | null => {
  return localStorage.getItem('studentId');
};

