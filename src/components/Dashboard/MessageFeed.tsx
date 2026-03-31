import { useState, useEffect } from 'react';
import { subscribeToMessages, AppMessage } from '../../services/dbFirebase';

export const MessageFeed = () => {
  const [messages, setMessages] = useState<AppMessage[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToMessages((fetchedMessages) => {
      setMessages(fetchedMessages);
    });
    return () => unsubscribe && unsubscribe();
  }, []);

  if (messages.length === 0) return null;

  return (
    <div className="mt-12">
      <h3 className="text-xl font-bold text-white/80 mb-4 uppercase tracking-wider border-b-2 border-[#ff9f43]/30 pb-2 flex items-center gap-2">
        <span className="text-[#ff9f43] animate-pulse">📡</span> SİBER İSTİHBARAT (DUYURULAR)
      </h3>
      <div className="grid grid-cols-1 gap-4">
        {messages.map((msg, idx) => (
          <div 
            key={msg.id} 
            className={`p-5 rounded-xl border-l-4 ${idx === 0 ? 'border-[#39FF14] bg-[#39FF14]/10' : 'border-[#00cfe8] bg-[#00cfe8]/5'} relative overflow-hidden group`}
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-bl-full transform origin-top-right group-hover:scale-150 transition-transform duration-500"></div>
            <div className="flex justify-between items-start mb-2">
              <span className={`text-xs font-black tracking-widest uppercase ${idx === 0 ? 'text-[#39FF14]' : 'text-[#00cfe8]'}`}>
                {idx === 0 ? 'EN YENİ İLETİ' : 'SİSTEM KAYDI'}
              </span>
              <span className="text-[10px] sm:text-xs text-white/40 font-mono">
                {new Date(msg.date).toLocaleString('tr-TR')}
              </span>
            </div>
            <p className="text-white/90 font-medium md:text-lg leading-relaxed">{msg.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
