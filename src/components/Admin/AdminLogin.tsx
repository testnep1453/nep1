import { useState, forwardRef } from "react";
import { Shield, Mail, Lock, RefreshCw } from "lucide-react";
import { signInAdmin, requestOtp, verifyOtp } from "../../lib/supabase-admin";
import { supabase } from "../../config/supabase";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  icon?: React.ReactNode;
}

const Field = forwardRef<HTMLInputElement, InputProps>(
  ({ label, id, name, icon, ...rest }, ref) => (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
        {label}
      </label>
      <div className="relative group">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
          {icon}
        </div>
        <input
          ref={ref}
          id={id}
          name={name}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white outline-none focus:border-red-500 transition-all"
          {...rest}
        />
      </div>
    </div>
  )
);

export default function AdminLogin() {
  const [step, setStep] = useState<"credentials" | "otp" | "forgot">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const res = await signInAdmin(email, password);
    if (res.error) {
      setErrorMsg(res.error);
      setLoading(false);
    } else {
      const otpRes = await requestOtp();
      if (otpRes.error) {
        setErrorMsg(otpRes.error);
      } else {
        setStep("otp");
      }
      setLoading(false);
    }
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const isValid = await verifyOtp(otp);
    if (isValid) {
      window.location.href = '/'; // Başarılı, ana sayfaya yönlendir
    } else {
      setErrorMsg("Girdiğiniz kod hatalı veya süresi dolmuş.");
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/?admin_reset=1`
    });

    if (error) {
      setErrorMsg(error.message);
    } else {
      alert("Şifre sıfırlama linki e-posta adresinize gönderildi.");
      setStep("credentials");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-mono">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <div className="flex justify-center mb-8">
          <Shield size={48} className="text-red-600" />
        </div>

        {errorMsg && (
          <div className="mb-4 bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-lg text-sm text-center">
            {errorMsg}
          </div>
        )}

        {step === "credentials" && (
          <form onSubmit={handleLogin} className="space-y-6">
            <Field 
              label="E-posta" id="adminEmail" name="email" type="email" 
              value={email} onChange={(e) => setEmail(e.target.value)} 
              icon={<Mail size={18} />} autoComplete="email" required 
            />
            <Field 
              label="Şifre" id="adminPassword" name="password" type="password" 
              value={password} onChange={(e) => setPassword(e.target.value)} 
              icon={<Lock size={18} />} autoComplete="current-password" required 
            />
            <button disabled={loading} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center">
              {loading ? <RefreshCw className="animate-spin" size={18} /> : "SİSTEME SIZ"}
            </button>
            <button type="button" onClick={() => { setStep("forgot"); setErrorMsg(""); }} className="w-full text-xs text-slate-500 hover:text-red-400 transition">
              Şifremi Unuttum
            </button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleOtpVerify} className="space-y-6">
            <Field 
              label="E-Posta Onay Kodu" id="adminOtp" name="otp" type="text" 
              value={otp} onChange={(e) => setOtp(e.target.value)} 
              icon={<Shield size={18} />} placeholder="6 haneli kod" required autoComplete="off" 
            />
            <button disabled={loading} className="w-full bg-red-600 text-white py-3 rounded-xl font-bold flex items-center justify-center">
              {loading ? <RefreshCw className="animate-spin" size={18} /> : "DOĞRULA"}
            </button>
          </form>
        )}

        {step === "forgot" && (
          <form onSubmit={handleForgot} className="space-y-6">
            <Field 
              label="Kayıtlı E-posta" id="forgotEmail" name="email" type="email" 
              value={email} onChange={(e) => setEmail(e.target.value)} 
              icon={<Mail size={18} />} required 
            />
            <button disabled={loading} className="w-full bg-red-600 text-white py-3 rounded-xl font-bold flex items-center justify-center">
              {loading ? <RefreshCw className="animate-spin" size={18} /> : "SIFIRLAMA LİNKİ GÖNDER"}
            </button>
            <button type="button" onClick={() => { setStep("credentials"); setErrorMsg(""); }} className="w-full text-xs text-slate-500 hover:text-slate-300">
              ← Geri Dön
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
