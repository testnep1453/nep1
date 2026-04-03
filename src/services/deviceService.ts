/**
 * Cihaz Kayıt ve Takip Servisi
 * Firebase'e cihaz bilgilerini yazar, birincil cihaz onayı yapar
 */

import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { ref, set, onValue, remove } from 'firebase/database';
import { db, rtdb } from '../config/firebase';
import { DeviceRecord } from '../types/student';
import { getDeviceInfo } from './crypto';

/**
 * Cihaz bilgisini Firebase'e kaydet
 * İlk girişte cihaz otomatik onaylanır (primaryDevice olur)
 * Sonraki farklı cihazlardan girişte RTDB bildirimi gönderilir
 */
export const registerDevice = async (studentId: string): Promise<{ isNew: boolean; needsApproval: boolean }> => {
  const device = getDeviceInfo();
  const studentRef = doc(db, 'students', studentId);
  
  try {
    const studentDoc = await getDoc(studentRef);
    
    if (!studentDoc.exists()) {
      return { isNew: false, needsApproval: false };
    }

    const data = studentDoc.data();
    const devices: DeviceRecord[] = data.devices || [];
    const primaryFingerprint = data.primaryDeviceFingerprint || null;

    // Bu cihaz daha önce kaydedilmiş mi?
    const existingDevice = devices.find(d => d.fingerprint === device.fingerprint);

    if (existingDevice) {
      // Bilinen cihaz — lastSeen güncelle
      const updatedDevices = devices.map(d =>
        d.fingerprint === device.fingerprint
          ? { ...d, lastSeen: Date.now() }
          : d
      );
      await updateDoc(studentRef, { devices: updatedDevices });
      return { isNew: false, needsApproval: false };
    }

    // Yeni cihaz algılandı
    const newDevice: DeviceRecord = {
      ...device,
      lastSeen: Date.now(),
      approved: !primaryFingerprint, // İlk cihaz otomatik onaylanır
    };

    if (!primaryFingerprint) {
      // İlk giriş — bu cihaz birincil olur
      await updateDoc(studentRef, {
        devices: arrayUnion(newDevice),
        primaryDeviceFingerprint: device.fingerprint,
      });
      return { isNew: true, needsApproval: false };
    }

    // Farklı cihazdan giriş — onay gerekli
    await updateDoc(studentRef, {
      devices: arrayUnion(newDevice),
    });

    // RTDB'ye onay isteği gönder
    await sendDeviceApprovalRequest(studentId, device.fingerprint, device.deviceType);

    return { isNew: true, needsApproval: true };
  } catch (error) {
    console.error('Cihaz kaydı hatası:', error);
    return { isNew: false, needsApproval: false };
  }
};

/**
 * RTDB'ye cihaz onay isteği gönder
 */
const sendDeviceApprovalRequest = async (
  studentId: string,
  fingerprint: string,
  deviceType: string
) => {
  const approvalRef = ref(rtdb, `deviceApprovals/${studentId}/${fingerprint}`);
  await set(approvalRef, {
    fingerprint,
    deviceType,
    requestedAt: Date.now(),
    status: 'pending', // pending | approved | denied
  });
};

/**
 * Cihaz onay isteklerini dinle (birincil cihazda)
 */
export const listenForDeviceApprovals = (
  studentId: string,
  callback: (requests: Array<{ fingerprint: string; deviceType: string; requestedAt: number }>) => void
) => {
  const approvalRef = ref(rtdb, `deviceApprovals/${studentId}`);
  return onValue(approvalRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    const requests: Array<{ fingerprint: string; deviceType: string; requestedAt: number }> = [];
    snapshot.forEach((child) => {
      const data = child.val();
      if (data.status === 'pending') {
        requests.push({
          fingerprint: data.fingerprint,
          deviceType: data.deviceType,
          requestedAt: data.requestedAt,
        });
      }
    });
    callback(requests);
  });
};

/**
 * Cihaz onayını işle (kabul/red)
 */
export const respondToDeviceApproval = async (
  studentId: string,
  fingerprint: string,
  approved: boolean
) => {
  // RTDB'deki isteği güncelle
  const approvalRef = ref(rtdb, `deviceApprovals/${studentId}/${fingerprint}`);
  if (approved) {
    await set(approvalRef, null); // Temizle
  } else {
    await remove(approvalRef);
  }

  // Firestore'daki cihaz kaydını güncelle
  const studentRef = doc(db, 'students', studentId);
  const studentDoc = await getDoc(studentRef);
  
  if (studentDoc.exists()) {
    const data = studentDoc.data();
    const devices: DeviceRecord[] = data.devices || [];
    const updatedDevices = devices.map(d =>
      d.fingerprint === fingerprint
        ? { ...d, approved }
        : d
    );
    
    if (!approved) {
      // Reddedilen cihazı listeden kaldır
      const filtered = updatedDevices.filter(d => d.fingerprint !== fingerprint);
      await updateDoc(studentRef, { devices: filtered });
    } else {
      await updateDoc(studentRef, { devices: updatedDevices });
    }
  }
};

/**
 * Mevcut cihazın onaylı olup olmadığını kontrol et
 */
export const isCurrentDeviceApproved = async (studentId: string): Promise<boolean> => {
  const device = getDeviceInfo();
  
  try {
    const studentRef = doc(db, 'students', studentId);
    const studentDoc = await getDoc(studentRef);
    
    if (!studentDoc.exists()) return false;
    
    const data = studentDoc.data();
    const devices: DeviceRecord[] = data.devices || [];
    
    // Birincil cihaz her zaman onaylıdır
    if (data.primaryDeviceFingerprint === device.fingerprint) return true;
    
    // Diğerleri approved flag'ine bak
    const found = devices.find(d => d.fingerprint === device.fingerprint);
    return found?.approved || false;
  } catch {
    return true; // Hata durumunda girişe izin ver
  }
};
