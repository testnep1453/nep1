import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function forcePasswordChange(userId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('admin_users')
    .update({ must_change_password: true })
    .eq('id', userId);

  if (error) {
    throw new Error(`Failed to force password change: ${error.message}`);
  }
}

export async function clearPasswordChangeFlag(userId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('admin_users')
    .update({ must_change_password: false })
    .eq('id', userId);

  if (error) {
    throw new Error(`Failed to clear password change flag: ${error.message}`);
  }
}
