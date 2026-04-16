import { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';

export interface CommandPayload {
  command: 'START_TRAILER' | 'START_LESSON' | 'RESET';
  payload?: {
    video_id?: string;
    video_url?: string;
    target_path?: string;
  };
  created_at: string;
}

export const useCommandListener = () => {
  const [lastCommand, setLastCommand] = useState<CommandPayload | null>(null);

  useEffect(() => {
    // 1. Initial fetch (optional, but good to know last command)
    const fetchLastCommand = async () => {
      const { data, error } = await supabase
        .from('system_commands')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (!error && data) {
        setLastCommand(data as CommandPayload);
      }
    };

    fetchLastCommand();

    // 2. Realtime listener
    const channel = supabase
      .channel('system_commands_global')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'system_commands' },
        (payload) => {
          console.log('🚨 Received Global Command:', payload.new);
          setLastCommand(payload.new as CommandPayload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { lastCommand, setLastCommand };
};
