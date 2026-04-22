import { supabase } from '../config/supabase';

export type SystemCommand = 'START_TRAILER' | 'START_LESSON' | 'RESET';

export interface CommandPayload {
  command: SystemCommand;
  payload?: any;
  created_at?: string;
}

export const sendSystemCommand = async (command: SystemCommand, payload: any = {}) => {
  const { error } = await supabase.from('system_commands').insert([
    {
      command,
      payload,
      created_at: new Date().toISOString()
    }
  ]);
  
  if (error) {
    console.error('Error sending system command:', error);
    throw error;
  }
};

export const resetSystemCommands = async () => {
  await sendSystemCommand('RESET');
};

