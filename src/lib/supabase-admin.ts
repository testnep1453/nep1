import { supabase } from '../config/supabase';

export interface AuthResult {
  error?: string;
  user?: any;
}

export async function signInAdmin(email: string, password: string): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: error.message.includes('Invalid') ? 'Hatalı e-posta veya şifre.' : error.message };
  }
  return { user: data.user };
}

export async function requestOtp() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum bulunamadı." };
  
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const { error } = await supabase.functions.invoke('send-otp', { 
    body: { email: user.email, otp } 
  });
  
  if (error) return { error: 'Doğrulama kodu gönderilemedi.' };
  return { success: true };
}

export async function verifyOtp(code: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase.rpc('verify_admin_otp', { 
    p_user_id: user.id, 
    p_code: code 
  });

  if (error) {
    console.error("OTP Doğrulama Hatası:", error);
    return false;
  }
  
  return !!data;
}

export async function isTotpEnabled(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from('admin_users')
    .select('totp_enabled')
    .eq('user_id', user.id)
    .single();

  if (error) return false;
  return !!data?.totp_enabled;
}

export async function signOutAdmin() {
  await supabase.auth.signOut();
  window.location.href = '/';
}
