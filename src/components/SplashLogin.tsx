import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { LogIn, KeyRound, Mail, Loader2, AlertTriangle, Settings } from "lucide-react";

export default function SplashLogin() {
  const [showLogin, setShowLogin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Lógica de inicio de sesión
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) throw authError;
      // Al ser exitoso, el AuthContext de tu app detectará el cambio automáticamente
    } catch (err: any) {
      setError(err.message === "Invalid login credentials" 
        ? "Credenciales incorrectas. Verifica email y contraseña." 
        : "Error de conexión con el taller.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center p-4 overflow-hidden">
      {/* Estilos para la barra de carga técnica */}
      <style>{`
        @keyframes custom-load {
          0% { width: 0%; opacity: 0.5; }
          30% { width: 40%; }
          60% { width: 45%; } /* Pequeña pausa simulando carga de datos */
          100% { width: 100%; opacity: 1; }
        }
        .animate-load {
          animation: custom-load 2.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
      `}</style>

      {!showLogin ? (
        /* VISTA 1: SPLASH SCREEN (Siempre se muestra al cargar) */
        <div className="flex flex-col items-center max-w-xs w-full animate-in fade-in duration-500">
          <div className="relative mb-12">
            <div className="absolute inset-0 bg-orange-600 blur-[60px] opacity-20 animate-pulse"></div>
            <div className="w-24 h-24 bg-slate-800 rounded-[2rem] border border-slate-700 flex items-center justify-center relative z-10 shadow-2xl rotate-3">
              <Settings size={44} className="text-orange-600 animate-[spin_4s_linear_infinite]" />
            </div>
          </div>
          
          <div className="text-center space-y-2 mb-8">
            <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase">
              Upton's <span className="text-orange-600">Garage</span>
            </h1>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em]">Precision Automotive</p>
          </div>
          
          <div className="w-full space-y-3">
            <div className="flex justify-between items-end px-1">
              <span className="text-[8px] text-orange-500 font-black uppercase tracking-widest animate-pulse">Sincronizando...</span>
              <span className="text-[8px] text-slate-600 font-mono">V2.0.26</span>
            </div>
            <div className="w-full h-1.5 bg-slate-900 rounded-full border border-slate-800 p-[2px] overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-orange-700 to-orange-500 rounded-full animate-load"
                onAnimationEnd={() => setShowLogin(true)}
              ></div>
            </div>
          </div>
        </div>
      ) : (
        /* VISTA 2: LOGIN (Solo aparece cuando la barra termina) */
        <div className="w-full max-w-md animate-in fade-in zoom-in duration-700">
          <div className="flex flex-col items-center mb-10 text-center">
             <div className="w-14 h-14 bg-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-900/40 transform -rotate-3 mb-4">
                <LogIn size={28} className="text-white" />
             </div>
             <h2 className="text-2xl font-black uppercase italic text-white tracking-tighter leading-none">
               Acceso al <span className="text-orange-600">Sistema</span>
             </h2>
             <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-2">Identifícate para gestionar el taller</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-xs font-bold uppercase animate-in slide-in-from-top-2">
              <AlertTriangle size={18} className="shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="bg-slate-800/30 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-700/50 shadow-2xl space-y-5">
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-slate-500 ml-4 tracking-widest">Email Corporativo</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                <input 
                  required
                  type="email" 
                  autoComplete="email"
                  className="w-full bg-slate-900/50 border border-slate-700 py-4 pl-12 pr-4 rounded-2xl outline-none focus:border-orange-500/50 text-white transition-all shadow-inner placeholder:text-slate-800"
                  placeholder="admin@uptons.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-slate-500 ml-4 tracking-widest">Clave de Acceso</label>
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                <input 
                  required
                  type="password" 
                  autoComplete="current-password"
                  className="w-full bg-slate-900/50 border border-slate-700 py-4 pl-12 pr-4 rounded-2xl outline-none focus:border-orange-500/50 text-white transition-all shadow-inner placeholder:text-slate-800"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-slate-800 disabled:text-slate-600 py-4 rounded-2xl text-white font-black uppercase italic tracking-[0.2em] transition-all transform active:scale-95 shadow-lg shadow-orange-900/20 mt-4 flex items-center justify-center gap-3"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>Conectar <LogIn size={18}/></>
              )}
            </button>
          </form>

          <p className="mt-10 text-center text-slate-600 text-[9px] font-black uppercase tracking-[0.2em] opacity-50">
            Precision Management System <span className="mx-2">|</span> Upton's Garage
          </p>
        </div>
      )}
    </div>
  );
}