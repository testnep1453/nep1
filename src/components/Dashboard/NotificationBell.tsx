import { Bell } from 'lucide-react';

interface NotificationBellProps {
  hasNotifications?: boolean;
}

export const NotificationBell = ({ hasNotifications = false }: NotificationBellProps) => {
  return (
    <button className="relative bg-[#2d3142] border-2 border-[#6358cc]/30 rounded-xl p-3 hover:scale-110 active:scale-95 transition-all shadow-lg hover:shadow-[#6358cc]/30">
      <Bell className="w-6 h-6 text-white" />
      {hasNotifications && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#d44d4e] rounded-full border-2 border-[#25293c] animate-pulse"></div>
      )}
    </button>
  );
};
