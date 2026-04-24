import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { 
  ShieldAlert, 
  Terminal, 
  Copy, 
  Check, 
  RefreshCw, 
  AlertCircle,
  Clock,
  User,
  ExternalLink
} from 'lucide-react';

interface ErrorLog {
  id: string;
  message: string;
  stack_trace: string;
  user_id: string;
  user_type: string;
  created_at: string;
}

export const SecurityLogs: React.FC = () => {
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [copyingId, setCopyingId] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('error_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error('Logs fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    
    // Real-time subscription for new logs
    const channel = supabase
      .channel('error_logs_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'error_logs' }, (payload) => {
        setLogs(prev => [payload.new as ErrorLog, ...prev].slice(0, 50));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleCopy = (log: ErrorLog) => {
    const text = `ERROR: ${log.message}\nUSER: ${log.user_id} (${log.user_type})\nTIME: ${log.created_at}\n\nSTACK TRACE:\n${log.stack_trace}`;
    navigator.clipboard.writeText(text);
    setCopyingId(log.id);
    setTimeout(() => setCopyingId(null), 2000);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-red-500/20 pb-6">
        <div>
          <h3 className="text-2xl font-bold text-red-500 flex items-center gap-3">
            <Terminal className="w-8 h-8" /> GÜVENLİK VE ERİŞİM LOGLARI
          </h3>
          <p className="text-slate-500 mt-1 font-mono text-xs uppercase tracking-wider">
            [ RADAR ACTIVE ] - GLOBAL ANOMALI TESPİT SİSTEMİ
          </p>
        </div>
        
        <button 
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-all font-bold text-xs group"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
          VERİLERİ TAZELA
        </button>
      </div>

      {loading && logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-black/40 border border-white/5 rounded-3xl">
          <RefreshCw className="w-12 h-12 text-red-500/50 animate-spin mb-4" />
          <p className="text-slate-500 font-mono text-sm animate-pulse">SİSTEM TARANIYOR...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-black/40 border border-white/5 rounded-3xl text-center">
          <Check className="w-16 h-16 text-[#39FF14]/20 mb-4" />
          <h4 className="text-xl font-bold text-white mb-2">ANOMALİ TESPİT EDİLMEDİ</h4>
          <p className="text-slate-400 max-w-md mx-auto font-mono text-xs">
            Sistem kararlı durumda. Herhangi bir front-end hatası veya servis kesintisi loglanmadı.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto custom-scrollbar overscroll-contain" style={{WebkitOverflowScrolling: 'touch' as any}}>
        <div className="grid grid-cols-1 gap-4">
          {logs.map((log) => (
            <div 
              key={log.id} 
              className="bg-black/60 border border-red-500/20 rounded-2xl overflow-hidden hover:border-red-500/40 transition-all group"
            >
              {/* Log Header */}
              <div className="px-6 py-4 flex items-center justify-between bg-red-500/5 border-b border-red-500/10">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center border border-red-500/30">
                    <AlertCircle className="text-red-400 w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-red-400/60 uppercase tracking-widest block">Error Message</span>
                    <h4 className="text-white font-bold text-sm truncate max-w-[200px] md:max-w-md">{log.message}</h4>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleCopy(log)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-[10px] font-black uppercase tracking-tighter ${
                      copyingId === log.id 
                        ? 'bg-[#39FF14]/20 border-[#39FF14]/40 text-[#39FF14]' 
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {copyingId === log.id ? <Check size={12} /> : <Copy size={12} />}
                    {copyingId === log.id ? 'KOPYALANDI!' : 'KOPYALA'}
                  </button>
                </div>
              </div>

              {/* Log Metadata */}
              <div className="px-6 py-3 grid grid-cols-2 md:grid-cols-4 gap-4 bg-black/20 text-[11px] font-mono border-b border-white/5">
                <div className="flex items-center gap-2 text-slate-400">
                  <Clock size={14} className="text-red-500/50" />
                  <span>{formatDate(log.created_at)}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <User size={14} className="text-red-500/50" />
                  <span className="truncate">{log.user_id} <span className="text-[9px] opacity-40">({log.user_type})</span></span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <ShieldAlert size={14} className="text-red-500/50" />
                  <span className="text-red-400/70">CRITICAL_EXCEPTION</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400 justify-end">
                  <span className="text-[9px] px-1.5 py-0.5 rounded border border-red-500/20 text-red-500/50">TAG: FRONTEND_CRASH</span>
                </div>
              </div>

              {/* Stack Trace Area */}
              <div className="p-4 bg-black/40 relative">
                <div className="absolute top-2 right-4 text-[10px] font-mono text-slate-600 pointer-events-none uppercase">Stack Trace Output</div>
                <pre className="text-[10px] font-mono text-red-400/70 overflow-x-auto p-4 rounded-xl bg-black border border-white/5 whitespace-pre-wrap max-h-40 terminal-scroll">
                  {log.stack_trace}
                </pre>
              </div>
            </div>
          ))}
        </div>
        </div>
      )}

      {/* Footer System Status */}
      <div className="p-4 border border-white/5 rounded-2xl bg-white/[0.02] flex items-center justify-between text-[10px] font-mono text-slate-500 uppercase tracking-widest">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#39FF14] animate-pulse"></span>
            RADAR_STATUS: ONLINE
          </div>
          <div>LOG_COUNT: {logs.length} / 50</div>
        </div>
        <div className="hidden md:block">SYSTEM_TIME: {new Date().toLocaleTimeString()}</div>
      </div>
    </div>
  );
};



