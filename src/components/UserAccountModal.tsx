import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { 
  X, Camera, Lock, Loader2, CheckCircle2, 
  AlertCircle, LogOut 
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export default function UserAccountModal({ isOpen, onClose, userId }: Props) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [passwords, setPasswords] = useState({ new: "", confirm: "" });

  // Cargar la foto actual cuando se abre el modal
  useEffect(() => {
    if (isOpen && userId) {
      fetchProfile();
    }
    // Limpiar mensajes al abrir/cerrar
    if (!isOpen) setMessage(null);
  }, [isOpen, userId]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", userId)
        .single();
      
      if (error) throw error;
      if (data?.avatar_url) setAvatarUrl(data.avatar_url);
    } catch (err) {
      console.warn("No se pudo cargar el avatar inicial:", err);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
    onClose();
  };

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !userId) return;
    
    setLoading(true);
    setMessage(null);
    
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Math.random()}.${fileExt}`;

    try {
      // 1. Subir al Bucket 'avatars' (Asegúrate de que el bucket sea PÚBLICO en Supabase)
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { 
          cacheControl: '3600',
          upsert: true 
        });

      if (uploadError) throw uploadError;

      // 2. Obtener URL Pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // 3. Actualizar tabla profiles
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", userId);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      setMessage({ type: "success", text: "Imagen de perfil actualizada" });
    } catch (error: any) {
      console.error("Error en proceso de imagen:", error);
      setMessage({ type: "error", text: error.message || "Error al procesar la imagen" });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwords.new !== passwords.confirm) {
      return setMessage({ type: "error", text: "Las contraseñas no coinciden" });
    }
    if (passwords.new.length < 6) {
      return setMessage({ type: "error", text: "Debe tener al menos 6 caracteres" });
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: passwords.new });
    
    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({ type: "success", text: "Contraseña actualizada correctamente" });
      setPasswords({ new: "", confirm: "" });
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="p-6 flex justify-between items-center border-b border-white/5 bg-slate-900/50">
          <h2 className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-500 italic">Configuración de Cuenta</h2>
          <button 
            onClick={onClose} 
            className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-all"
          >
            <X size={18}/>
          </button>
        </div>

        <div className="p-8 space-y-8 flex flex-col items-center">
          
          {/* FOTO DE PERFIL */}
          <div className="relative group">
            <div className="w-28 h-28 rounded-3xl bg-slate-950 border-2 border-slate-800 flex items-center justify-center overflow-hidden shadow-2xl tracking-tighter">
              {avatarUrl ? (
                <img src={avatarUrl} className="w-full h-full object-cover" alt="Perfil" />
              ) : (
                <span className="text-4xl font-black text-slate-800 italic">U</span>
              )}
              {loading && (
                <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
                  <Loader2 className="animate-spin text-orange-500" size={32} />
                </div>
              )}
            </div>
            <label className="absolute -bottom-2 -right-2 bg-orange-600 p-3 rounded-2xl cursor-pointer hover:bg-orange-500 hover:scale-110 active:scale-95 transition-all shadow-xl border-4 border-slate-900">
              <Camera size={18} className="text-white" />
              <input type="file" className="hidden" accept="image/*" onChange={handleUploadPhoto} disabled={loading} />
            </label>
          </div>

          {/* FORMULARIO */}
          <div className="w-full space-y-4">
            <div className="space-y-3">
              <p className="text-[9px] font-black uppercase text-slate-500 italic ml-1 tracking-widest text-center">Cambiar Contraseña</p>
              
              <div className="relative">
                <Lock className="absolute left-4 top-4 text-slate-700" size={14} />
                <input 
                  type="password"
                  autoComplete="new-password" 
                  placeholder="NUEVA CONTRASEÑA" 
                  className="w-full bg-slate-950 border border-slate-800 p-4 pl-11 rounded-2xl outline-none focus:border-orange-500/50 text-[10px] font-bold tracking-[0.1em] transition-all text-white placeholder:text-slate-700"
                  value={passwords.new}
                  onChange={e => setPasswords({...passwords, new: e.target.value})}
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-4 text-slate-700" size={14} />
                <input 
                  type="password"
                  autoComplete="new-password" 
                  placeholder="CONFIRMAR CONTRASEÑA" 
                  className="w-full bg-slate-950 border border-slate-800 p-4 pl-11 rounded-2xl outline-none focus:border-orange-500/50 text-[10px] font-bold tracking-[0.1em] transition-all text-white placeholder:text-slate-700"
                  value={passwords.confirm}
                  onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                />
              </div>
            </div>

            {/* FEEDBACK MENSAJES */}
            {message && (
              <div className={`p-4 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-2 tracking-widest border animate-in fade-in slide-in-from-top-1 ${
                message.type === 'success' 
                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                : 'bg-red-500/10 text-red-500 border-red-500/20'
              }`}>
                {message.type === 'success' ? <CheckCircle2 size={14}/> : <AlertCircle size={14}/>} 
                {message.text}
              </div>
            )}

            <div className="pt-2 space-y-3">
              <button 
                onClick={handleChangePassword}
                disabled={loading}
                className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black py-4 rounded-2xl transition-all text-[10px] uppercase tracking-[0.2em] flex justify-center items-center gap-2 shadow-lg shadow-orange-950/20 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={16}/> : "Actualizar Datos"}
              </button>

              <button 
                onClick={handleSignOut}
                className="w-full bg-slate-800/40 hover:bg-red-500/10 hover:text-red-500 text-slate-500 font-black py-4 rounded-2xl transition-all text-[10px] uppercase tracking-[0.2em] flex justify-center items-center gap-2 border border-transparent hover:border-red-500/10"
              >
                <LogOut size={16} /> Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}