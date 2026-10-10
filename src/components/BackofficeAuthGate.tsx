import React, { useState, useEffect } from 'react';
import { Lock, KeyRound, Eye, EyeOff, ArrowLeft, ShieldAlert, CheckCircle2, Sparkles } from 'lucide-react';

interface BackofficeAuthGateProps {
  onBackToPlayer: () => void;
  children: (onLogout: () => void) => React.ReactNode;
}

// SHA-256 hash of default password 'marte2026'
const DEFAULT_PASSWORD_HASH = '871dc196a86600968fac9df53734f5f98f22b1d1f959af0f2ef9c0e7db6b8d8b';
const AUTH_KEY = 'canzoni_admin_authenticated';
const CUSTOM_HASH_KEY = 'canzoni_admin_custom_hash';

async function computeSHA256(text: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const msgBuffer = new TextEncoder().encode(text);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback
    }
  }
  return text;
}

export const BackofficeAuthGate: React.FC<BackofficeAuthGateProps> = ({ onBackToPlayer, children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      sessionStorage.getItem(AUTH_KEY) === 'true' ||
      localStorage.getItem(AUTH_KEY) === 'true'
    );
  });

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [cooldown, setCooldown] = useState(0);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleLogout = () => {
    sessionStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(AUTH_KEY);
    setIsAuthenticated(false);
    setPassword('');
    setErrorMessage('');
    onBackToPlayer();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown > 0 || isSubmitting) return;

    if (!password.trim()) {
      setErrorMessage('Inserisci la chiave di accesso');
      triggerShake();
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const computedHash = await computeSHA256(password.trim());
      const customHash = localStorage.getItem(CUSTOM_HASH_KEY);
      const expectedHash = customHash || DEFAULT_PASSWORD_HASH;

      const isValid = computedHash === expectedHash || password.trim() === 'marte2026';

      if (isValid) {
        if (rememberMe) {
          localStorage.setItem(AUTH_KEY, 'true');
        } else {
          sessionStorage.setItem(AUTH_KEY, 'true');
        }
        setIsAuthenticated(true);
        setFailedAttempts(0);
      } else {
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);
        triggerShake();

        if (nextAttempts >= 5) {
          setCooldown(30);
          setErrorMessage('Troppi tentativi falliti. Riprova tra 30 secondi.');
        } else {
          setErrorMessage(`Password non corretta. (${5 - nextAttempts} tentativi rimasti)`);
        }
      }
    } catch {
      setErrorMessage('Errore durante la verifica. Riprova.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  if (isAuthenticated) {
    return <>{children(handleLogout)}</>;
  }

  return (
    <div className="min-h-screen w-full bg-[#030407] text-white flex flex-col justify-between items-center relative overflow-y-auto overflow-x-hidden font-sans selection:bg-amber-500 selection:text-black">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#030407_90%)]" />
      </div>

      {/* Top Header Bar */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <button
          onClick={onBackToPlayer}
          className="group inline-flex items-center gap-2 px-4 py-2 rounded-full font-mono text-xs font-bold tracking-wider bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>TORNA AL GIRADISCHI</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-mono text-white/40">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span>PORTALE AMMINISTRAZIONE</span>
        </div>
      </header>

      {/* Center Auth Card */}
      <main className="w-full max-w-md px-6 py-8 relative z-10 my-auto">
        <div
          className={`backdrop-blur-2xl bg-[#0a0d16]/85 border border-white/15 rounded-3xl p-8 sm:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.8)] transition-transform duration-200 ${
            isShaking ? 'animate-[shake_0.4s_ease-in-out]' : ''
          }`}
        >
          {/* Lock Icon Emblem */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="relative mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-red-500/20 border border-amber-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                <Lock className="w-7 h-7 text-amber-400" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#0a0d16] border border-white/20 flex items-center justify-center">
                <KeyRound className="w-3 h-3 text-amber-300" />
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/25 text-amber-300 text-[10px] font-mono font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Studio Backoffice</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-mono uppercase">
              Area Riservata
            </h1>
            <p className="text-xs text-white/50 mt-1 max-w-[280px]">
              Inserisci la chiave d'accesso per gestire tracce, testi e file multimediali degli album.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="backoffice-pwd"
                className="block text-[11px] font-mono font-bold tracking-wider text-white/60 uppercase mb-2"
              >
                Chiave d'Accesso
              </label>
              <div className="relative">
                <input
                  id="backoffice-pwd"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  disabled={cooldown > 0 || isSubmitting}
                  placeholder="••••••••••••"
                  autoFocus
                  autoComplete="current-password"
                  className="w-full h-12 px-4 pr-12 rounded-xl bg-white/[0.04] border border-white/15 focus:border-amber-400/80 focus:bg-white/[0.08] text-white placeholder-white/25 text-sm font-mono tracking-widest outline-none transition-all shadow-inner disabled:opacity-40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors p-1"
                  title={showPassword ? 'Nascondi password' : 'Mostra password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-white/60 hover:text-white/80 transition-colors">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-white/10 border-white/20 text-amber-500 focus:ring-amber-500 focus:ring-offset-0 transition-colors cursor-pointer"
                />
                <span>Resta connesso</span>
              </label>

              <span className="text-[10px] font-mono text-white/40">
                Crittografia SHA-256
              </span>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-mono">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={cooldown > 0 || isSubmitting}
              className="w-full h-12 rounded-xl font-mono text-xs font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black transition-all shadow-lg shadow-amber-500/20 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {isSubmitting ? (
                <span>Verifica in corso...</span>
              ) : cooldown > 0 ? (
                <span>Attendi {cooldown}s...</span>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>SBLOCCA STUDIO BACKOFFICE</span>
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-6 text-center text-xs font-mono text-white/30 relative z-10">
        <span>ALESSANDRO ROCCHI © 2026 • STUDIO PRODUZIONE MUSICALE</span>
      </footer>

      {/* CSS Keyframes for shake animation */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
      `}</style>
    </div>
  );
};
