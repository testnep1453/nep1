import { useState } from "react";
import { Lock, Shield, RefreshCw } from "lucide-react";
import { supabase } from "../../config/supabase";

export default function AdminResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    if (password.length < 6) {
      setErrorMsg("Şifre en az 6 karakter olmalıdır.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Şifreler eşleşmiyor.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });
    
    if (error) {
      setErrorMsg(error.message);
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('admin_users').update({ must_change_password: false }).eq('user_id', user.id);
      }
      alert("Şifreniz başarıyla güncellendi! Sisteme yönlendiriliyorsunuz.");
      window.location.href = '/';
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-mono">
      <form onSubmit={handleUpdate} className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-6">
        <div className="text-center mb-6">
          <Shield className="text-red-600 mx-auto mb-4" size={48} />
          <h2 className="text-2xl font-bold text-white">YENİ ŞİFRE BELİRLE</h2>
        </div>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-lg text-sm text-center">
            {errorMsg}
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="newPw" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Yeni Şifre</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              id="newPw" name="newPassword" type="password" required 
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 text-white outline-none focus:border-red-600" 
              value={password} onChange={(e) => setPassword(e.target.value)} 
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="confirmPw" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Yeni Şifre (Tekrar)</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              id="confirmPw" name="confirmPassword" type="password" required 
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 text-white outline-none focus:border-red-600" 
              value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} 
            />
          </div>
        </div>

        <button disabled={loading} className="w-full bg-red-600 py-3 rounded-xl text-white font-bold hover:bg-red-500 transition-all flex justify-center items-center gap-2">
          {loading ? <RefreshCw className="animate-spin" size={18} /> : "KAYDET VE GİRİŞ YAP"}
        </button>
      </form>
    </div>
  );
}
