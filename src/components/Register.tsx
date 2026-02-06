import { useState } from "react";
import { supabase } from "../supabase";
import { User, Mail, Lock, Phone, Car, Hash, ChevronRight, Loader2 } from "lucide-react";

export default function RegisterModule({ onBack }: { onBack: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    plate: "",
    model: ""
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Crear el usuario en Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: { data: { full_name: formData.fullName } }
      });

      if (authError) throw authError;
      const user = authData.user;

      if (user) {
        // 2. Crear el Cliente
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .insert([{ 
            name: formData.fullName, 
            email: formData.email, 
            phone: formData.phone,
            user_id: user.id 
          }])
          .select().single();

        if (clientError) throw clientError;

        // 3. Crear el Perfil (Vinculado al cliente)
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: user.id,
            email: formData.email,
            full_name: formData.fullName,
            role: 'cliente' as any, // Casting para el tipo ENUM public.user_role
            client_id: clientData.id
          }]);

        if (profileError) throw profileError;

        // 4. Crear el Vehículo inicial (Opcional, pero muy útil)
        if (formData.plate) {
          await supabase.from('vehicles').insert([{
            client_id: clientData.id,
            plate: formData.plate.toUpperCase(),
            modelo: formData.model,
            autos: "Vehículo inicial"
          }]);
        }

        alert("¡Bienvenido a Upton's! Registro exitoso.");
        window.location.reload(); // Para que entre directo al Dashboard
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-slate-900/80 backdrop-blur-xl p-8 rounded-[3rem] border border-white/10 shadow-2xl">
      <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-6">
        Nuevo en <span className="text-orange-500">Upton's</span>
      </h2>
      
      <form onSubmit={handleRegister} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* SECCIÓN CUENTA */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Datos de Cuenta</h3>
            <div className="relative">
              <User className="absolute left-4 top-4 text-slate-500" size={20} />
              <input required className="w-full bg-slate-950/50 border border-white/10 p-4 pl-12 rounded-2xl text-white outline-none focus:border-orange-500 transition-all" 
                placeholder="Nombre completo" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
            </div>
            <div className="relative">
              <Mail className="absolute left-4 top-4 text-slate-500" size={20} />
              <input required type="email" className="w-full bg-slate-950/50 border border-white/10 p-4 pl-12 rounded-2xl text-white outline-none focus:border-orange-500 transition-all" 
                placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-4 text-slate-500" size={20} />
              <input required type="password" title="Mínimo 6 caracteres" className="w-full bg-slate-950/50 border border-white/10 p-4 pl-12 rounded-2xl text-white outline-none focus:border-orange-500 transition-all" 
                placeholder="Contraseña" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
            </div>
          </div>

          {/* SECCIÓN VEHÍCULO */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tu Vehículo (Opcional)</h3>
            <div className="relative">
              <Phone className="absolute left-4 top-4 text-slate-500" size={20} />
              <input className="w-full bg-slate-950/50 border border-white/10 p-4 pl-12 rounded-2xl text-white outline-none focus:border-orange-500 transition-all" 
                placeholder="Teléfono" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            </div>
            <div className="relative">
              <Hash className="absolute left-4 top-4 text-slate-500" size={20} />
              <input className="w-full bg-slate-950/50 border border-white/10 p-4 pl-12 rounded-2xl text-white outline-none focus:border-orange-500 transition-all" 
                placeholder="Matrícula / Patente" value={formData.plate} onChange={e => setFormData({...formData, plate: e.target.value})} />
            </div>
            <div className="relative">
              <Car className="absolute left-4 top-4 text-slate-500" size={20} />
              <input className="w-full bg-slate-950/50 border border-white/10 p-4 pl-12 rounded-2xl text-white outline-none focus:border-orange-500 transition-all" 
                placeholder="Modelo (ej: Golf GTI)" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 pt-4">
          <button type="submit" disabled={loading} className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-orange-900/20 flex items-center justify-center gap-2 uppercase italic tracking-tighter">
            {loading ? <Loader2 className="animate-spin" /> : <>Finalizar Registro <ChevronRight size={20}/></>}
          </button>
          <button type="button" onClick={onBack} className="text-slate-500 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors">
            Volver al Login
          </button>
        </div>
      </form>
    </div>
  );
}