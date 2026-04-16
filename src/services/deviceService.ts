import { supabase } from '../config/supabase';
import { DeviceRecord } from '../types/student';
import { getDeviceInfo } from './crypto';

export const registerDevice = async (studentId: string): Promise<{ isNew: boolean; needsApproval: boolean }> => {
  const device = getDeviceInfo();
  try {
    const { data: student } = await supabase.from('students').select('devices, primary_device_fingerprint').eq('id', studentId).single();
    if (!student) return { isNew: false, needsApproval: false };

    const devices: DeviceRecord[] = student.devices || [];
    const primaryFingerprint = student.primary_device_fingerprint;

    const existingDevice = devices.find(d => d.fingerprint === device.fingerprint);
    if (existingDevice) {
      const updatedDevices = devices.map(d => d.fingerprint === device.fingerprint ? { ...d, last_seen: Date.now() } : d);
      await supabase.from('students').update({ devices: updatedDevices }).eq('id', studentId);
      return { isNew: false, needsApproval: false };
    }

    const newDevice: DeviceRecord = { ...device, last_seen: Date.now(), approved: !primaryFingerprint };

    if (!primaryFingerprint) {
      await supabase.from('students').update({ devices: [...devices, newDevice], primary_device_fingerprint: device.fingerprint }).eq('id', studentId);
      return { isNew: true, needsApproval: false };
    }

    await supabase.from('students').update({ devices: [...devices, newDevice] }).eq('id', studentId);
    return { isNew: true, needsApproval: true };
  } catch (error) {
    return { isNew: false, needsApproval: false };
  }
};

export const isCurrentDeviceApproved = async (studentId: string): Promise<boolean> => {
  const device = getDeviceInfo();
  try {
    const { data: student } = await supabase.from('students').select('devices, primary_device_fingerprint').eq('id', studentId).single();
    if (!student) return false;
    
    if (student.primary_device_fingerprint === device.fingerprint) return true;
    const devices: DeviceRecord[] = student.devices || [];
    const found = devices.find(d => d.fingerprint === device.fingerprint);
    return found?.approved || false;
  } catch {
    return true; 
  }
};

export const listenForDeviceApprovals = (studentId: string, callback: any) => { callback([]); };
export const respondToDeviceApproval = async () => {};
