import { useState, useEffect } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export const useDeviceType = (): DeviceType => {
  const [device, setDevice] = useState<DeviceType>('desktop');

  useEffect(() => {
    const check = () => {
      if (window.innerWidth < 768) setDevice('mobile');
      else if (window.innerWidth < 1024) setDevice('tablet');
      else setDevice('desktop');
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return device;
};

