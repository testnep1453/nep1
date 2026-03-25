import { Users } from 'lucide-react';

interface PresenceCounterProps {
  count: number;
}

export const PresenceCounter = ({ count }: PresenceCounterProps) => {
  return (
    <div className="bg-gradient-to-r from-[#2b9956] to-[#3dd56d] rounded-2xl p-6 shadow-xl border-2 border-[#3dd56d]/50">
      <div className="flex items-center gap-4">
        <div className="bg-white/20 rounded-xl p-3">
          <Users className="w-8 h-8 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <div className="text-4xl font-bold text-white mb-1">
            {count}
          </div>
          <div className="text-white/90 text-sm font-semibold uppercase tracking-wide">
            OYUNCU ONLİNE
          </div>
        </div>
        <div className="ml-auto">
          <div className="w-3 h-3 bg-white rounded-full animate-pulse shadow-lg"></div>
        </div>
      </div>
    </div>
  );
};
