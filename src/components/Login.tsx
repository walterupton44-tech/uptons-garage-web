import { useState } from "react";
import { supabase } from "../supabase";
import { LogIn, Mail, Lock, AlertCircle, UserPlus, User, CheckCircle2, Phone, Car, Loader2 } from "lucide-react";

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState(""); // Nuevo campo
  const [plate, setPlate] = useState(""); // Nuevo campo
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);

    try {
      if (isRegistering) {
        // 1. Crear usuario en Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });

        if (authError) throw authError;
        const user = authData.user;

        if (user) {
          // 2. Crear registro en tabla CLIENTS
          const { data: clientData, error: clientError } = await supabase
            .from('clients')
            .insert([{ 
              name: fullName, 
              email: email, 
              phone: phone,
              user_id: user.id,
              role: 'CLIENT'
            }])
            .select().single();

          if (clientError) throw clientError;

          // 3. Crear registro en tabla PROFILES (vinculado al cliente)
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([{
              id: user.id,
              email: email,
              full_name: fullName,
              role: 'cliente' as any,
              client_id: clientData.id
            }]);

          if (profileError) throw profileError;

          // 4. Crear vehículo si puso matrícula
          if (plate) {
            await supabase.from('vehicles').insert([{
              client_id: clientData.id,
              plate: plate.toUpperCase(),
              autos: "Vehículo Registrado"
            }]);
          }

          setMessage("¡Registro exitoso! Ya puedes iniciar sesión.");
          setIsRegistering(false);
        }
      } else {
        // LOGIN NORMAL
        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
        if (loginError) throw new Error("Email o contraseña incorrectos.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden font-sans">
      {/* BACKGROUND */}
      <div className="absolute inset-0 z-0" style={{ backgroundImage: "url('/Turbo.png')", backgroundSize: "cover", backgroundPosition: "center" }}>
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm"></div>
      </div>

      <div className="relative z-10 w-full max-w-md px-6 my-10">
        <div className="bg-slate-900/40 backdrop-blur-2xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl">
          
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-900/40 transform -rotate-6 transition-transform hover:rotate-0">
              {isRegistering ? <UserPlus className="text-white" size={32} /> : <LogIn className="text-white" size={32} />}
            </div>
            <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">
              Upton's <span className="text-orange-500">Garage</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-2">
              {isRegistering ? "Configura tu cuenta de cliente" : "Sistema de Gestión Profesional"}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {isRegistering && (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">Nombre Completo</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input required type="text" className="w-full bg-slate-950/50 border border-white/10 p-4 pl-12 rounded-2xl text-white outline-none focus:border-orange-500 transition-all" placeholder="Juan Pérez" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">Teléfono</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                      <input type="tel" className="w-full bg-slate-950/50 border border-white/10 p-4 pl-11 rounded-2xl text-sm text-white outline-none focus:border-orange-500 transition-all" placeholder="123..." value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">Matrícula</label>
                    <div className="relative">
                      <Car className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                      <input type="text" className="w-full bg-slate-950/50 border border-white/10 p-4 pl-11 rounded-2xl text-sm text-white outline-none focus:border-orange-500 transition-all" placeholder="ABC-123" value={plate} onChange={(e) => setPlate(e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input required type="email" autoComplete="email" className="w-full bg-slate-950/50 border border-white/10 p-4 pl-12 rounded-2xl text-white outline-none focus:border-orange-500 transition-all" placeholder="admin@uptons.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input required type="password" name="password" autoComplete="current-password" className="w-full bg-slate-950/50 border border-white/10 p-4 pl-12 rounded-2xl text-white outline-none focus:border-orange-500 transition-all" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-red-400 text-[11px] font-bold italic">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            {message && (
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl text-emerald-400 text-[11px] font-bold italic">
                <CheckCircle2 size={14} /> {message}
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-orange-900/20 active:scale-[0.98] uppercase tracking-widest flex items-center justify-center gap-2">
              {loading ? <Loader2 className="animate-spin" size={20} /> : isRegistering ? "Unirse al Garage" : "Entrar al Sistema"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => { setIsRegistering(!isRegistering); setError(null); setMessage(null); }}
              className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-orange-500 transition-colors"
            >
              {isRegistering ? "¿Ya eres miembro? Inicia Sesión" : "¿Nuevo en Upton's Garage? Regístrate aquí"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}