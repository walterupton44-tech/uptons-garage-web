import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { 
  UserPlus, Shield, Users, Mail, 
  Trash2, Search, Loader2, CheckCircle2 
} from "lucide-react";

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para el formulario de nuevo usuario
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    role: "cliente",
    client_id: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    // 1. Traer perfiles de usuarios
    const { data: profiles } = await supabase.from("profiles").select("*");
    // 2. Traer lista de clientes para el selector (vínculo)
    const { data: clientsData } = await supabase.from("clients").select("id, nombre");
    
    setUsers(profiles || []);
    setClients(clientsData || []);
    setLoading(false);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // NOTA: Para crear usuarios reales desde el front sin cerrar tu sesión,
    // se necesita la Service Role Key o una Edge Function. 
    // Aquí simularemos el proceso que luego conectarás a tu API.
    
    try {
      // 1. Crear en Auth (esto requiere permisos de admin)
      // 2. Crear en tabla Profiles
      const { error } = await supabase.from("profiles").insert([{
        email: newUser.email,
        role: newUser.role,
        client_id: newUser.role === 'cliente' ? newUser.client_id : null
      }]);

      if (error) throw error;
      
      alert("Usuario registrado exitosamente en el sistema.");
      fetchData();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* SECCIÓN 1: FORMULARIO DE REGISTRO */}
      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-orange-600/20 rounded-2xl border border-orange-500/30 text-orange-500">
            <UserPlus size={24} />
          </div>
          <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Registrar Nuevo Acceso</h2>
        </div>

        <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Email</label>
            <input 
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white outline-none focus:border-orange-500 transition-all"
              type="email" required placeholder="correo@ejemplo.com"
              value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Rol de Sistema</label>
            <select 
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white outline-none focus:border-orange-500"
              value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}
            >
              <option value="cliente">Cliente</option>
              <option value="mecanico">Mecánico</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          {newUser.role === 'cliente' && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Vincular a Cliente</label>
              <select 
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white outline-none focus:border-orange-500"
                value={newUser.client_id} onChange={e => setNewUser({...newUser, client_id: e.target.value})}
              >
                <option value="">Seleccionar de lista...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
          )}

          <div className="flex items-end">
            <button 
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black uppercase py-4 rounded-2xl transition-all shadow-lg shadow-orange-900/20"
            >
              Crear Credenciales
            </button>
          </div>
        </form>
      </div>

      {/* SECCIÓN 2: TABLA DE USUARIOS EXISTENTES */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-800/50 border-b border-slate-700">
            <tr className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
              <th className="p-6">Usuario / Email</th>
              <th className="p-6">Rol</th>
              <th className="p-6">Vínculo</th>
              <th className="p-6 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-white/5 transition-all group">
                <td className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-orange-500">
                      <Mail size={16} />
                    </div>
                    <span className="text-sm font-bold text-white">{u.email}</span>
                  </div>
                </td>
                <td className="p-6">
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ${
                    u.role === 'admin' ? 'bg-red-500/10 text-red-500' : 
                    u.role === 'mecanico' ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="p-6 text-sm text-slate-400 italic">
                  {u.client_id ? "Vínculo Activo (Cliente)" : "Acceso Interno"}
                </td>
                <td className="p-6 text-right">
                  <button className="text-slate-600 hover:text-red-500 transition-colors p-2">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}