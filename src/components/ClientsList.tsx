import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { 
  UserPlus, Search, Pencil, User, 
  Phone, Mail, MapPin, X, Lock, ShieldCheck, CheckCircle2, Loader2, Car
} from "lucide-react";
import { UserRole } from "../types";
import { useNavigate } from "react-router-dom";

interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  role: UserRole;
  matricula?: string;
  presupuestos_count?: number;
  user_id?: string;
}

interface ClientsListProps {
  clients?: Client[];
  onRefresh?: () => void;
}

export default function ClientsList({ clients: externalClients, onRefresh }: ClientsListProps) {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>(externalClients || []);
  const [loading, setLoading] = useState(!externalClients);
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [filtro, setFiltro] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  const [crearAcceso, setCrearAcceso] = useState(false);
  const [password, setPassword] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    role: UserRole.CLIENT,
    matricula: "",
  });

  const fetchClients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*, presupuestos_count:presupuestos_guardados(count)")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const clientesProcesados = (data || []).map((c: any) => ({
        ...c,
        presupuestos_count: c.presupuestos_count?.[0]?.count || 0
      }));

      setClients(clientesProcesados);
    } catch (err) {
      console.error("Error al cargar clientes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!externalClients) fetchClients();
  }, [externalClients]);

  const saveClient = async () => {
    if (!formData.name.trim()) return setMessage({ type: "error", text: "El nombre es obligatorio" });
    if (crearAcceso && (!formData.email || password.length < 6)) {
      return setMessage({ type: "error", text: "Email y contraseña (mín. 6 caracteres) son obligatorios" });
    }

    setLoading(true);
    setMessage(null);

    try {
      let currentUserId = editingClient?.user_id || null;
      let clientId = editingClient?.id || null;

      if (crearAcceso && !currentUserId) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: password,
          options: { 
            emailRedirectTo: window.location.origin,
            data: { full_name: formData.name, role: 'cliente' } 
          }
        });

        if (authError) {
          if (authError.message.includes("already registered") || authError.status === 422) {
            const { data: existingProfile } = await supabase.from('profiles').select('id').eq('email', formData.email).single();
            if (existingProfile) currentUserId = existingProfile.id;
            else throw new Error("El email ya existe pero no se pudo recuperar el perfil.");
          } else throw authError;
        } else {
          currentUserId = authData.user?.id || null;
        }
      }

      const clientPayload = { 
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        matricula: formData.matricula || null,
        user_id: currentUserId 
      };

      if (editingClient) {
        const { error: updateError } = await supabase.from("clients").update(clientPayload).eq("id", editingClient.id);
        if (updateError) throw updateError;
        clientId = editingClient.id;
      } else {
        const { data: newClient, error: insertError } = await supabase.from("clients").insert([clientPayload]).select().single();
        if (insertError) throw insertError;
        clientId = newClient.id;
      }

      if (currentUserId && clientId) {
        await supabase.from("profiles").upsert({
          id: currentUserId,
          email: formData.email,
          full_name: formData.name,
          role: 'cliente' as any,
          client_id: clientId,
          updated_at: new Date()
        });
      }

      setMessage({ type: "success", text: "Cliente guardado con éxito" });
      setTimeout(() => {
        setShowModal(false);
        fetchClients();
        onRefresh?.();
      }, 1500);

    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Error inesperado" });
    } finally {
      setLoading(false);
    }
  };

  const openModal = (client?: Client) => {
    setMessage(null);
    setCrearAcceso(false);
    setPassword("");
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name, phone: client.phone, email: client.email,
        address: client.address, role: client.role, matricula: client.matricula || "",
      });
    } else {
      setEditingClient(null);
      setFormData({ name: "", phone: "", email: "", address: "", role: UserRole.CLIENT, matricula: "" });
    }
    setShowModal(true);
  };

  const clientesFiltrados = clients.filter(c => c.name.toLowerCase().includes(filtro.toLowerCase()));

  return (
    <div className="p-4 md:p-6 bg-slate-900 min-h-screen text-white">
      {/* HEADER RESPONSIVO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3 italic text-white uppercase">
            <User className="text-amber-500 shrink-0" size={28} /> UPTON'S CLIENTES
          </h1>
          <p className="text-slate-500 text-[9px] font-bold uppercase tracking-[0.2em] mt-1">Base de datos central de garage</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Buscar cliente..." 
              className="bg-slate-800 border border-slate-700 pl-10 pr-4 py-3 rounded-xl text-sm outline-none focus:border-amber-500 w-full transition-all" 
              value={filtro} 
              onChange={(e) => setFiltro(e.target.value)} 
            />
          </div>
          <button onClick={() => openModal()} className="bg-amber-600 hover:bg-amber-500 text-white px-6 py-3 rounded-xl font-black italic text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 uppercase tracking-widest">
            <UserPlus size={18} /> Nuevo Registro
          </button>
        </div>
      </div>

      {/* VISTA DE TABLA (ESCRITORIO) */}
      <div className="hidden lg:block bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-900/50 text-slate-500 text-[9px] uppercase font-black tracking-[0.2em]">
              <th className="p-5">Información Personal</th>
              <th className="p-5">Contacto</th>
              <th className="p-5 text-center">Acceso Sistema</th>
              <th className="p-5 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {clientesFiltrados.map(client => (
              <tr key={client.id} className="hover:bg-slate-700/20 transition-all group">
                <td className="p-5">
                  <div className="font-bold text-slate-200 group-hover:text-amber-500 transition-colors uppercase italic">{client.name}</div>
                  <div className="text-[10px] text-slate-500 uppercase flex items-center gap-1 mt-1"><MapPin size={10}/> {client.address || "Sin dirección"}</div>
                </td>
                <td className="p-5">
                  <div className="text-xs font-mono text-amber-500">{client.phone}</div>
                  <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-1 font-bold"><Mail size={10}/> {client.email}</div>
                </td>
                <td className="p-5 text-center">
                  {client.user_id ? (
                    <div className="flex flex-col items-center gap-1 text-emerald-500">
                      <ShieldCheck size={18} className="drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                      <span className="text-[8px] font-black uppercase tracking-tighter">Activo</span>
                    </div>
                  ) : (
                    <span className="text-[8px] font-black uppercase text-slate-600 tracking-tighter">Sin Acceso</span>
                  )}
                </td>
                <td className="p-5">
                  <div className="flex justify-center gap-2">
                    <button onClick={() => navigate(`/vehicles?client_id=${client.id}`)} className="p-2.5 bg-slate-900 rounded-xl hover:bg-amber-600 text-white transition-all shadow-md"><Car size={16}/></button>
                    <button onClick={() => openModal(client)} className="p-2.5 bg-slate-900 rounded-xl hover:bg-slate-700 text-white transition-all shadow-md"><Pencil size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* VISTA DE CARDS (CELULAR) */}
      <div className="lg:hidden space-y-4">
        {clientesFiltrados.map(client => (
          <div key={client.id} className="bg-slate-800/80 border border-slate-700 p-5 rounded-[2rem] shadow-xl relative group">
            <div className="flex items-center gap-4 mb-4">
               <div className="w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center text-amber-500 border border-slate-700">
                  <User size={24} />
               </div>
               <div className="flex-1">
                  <h3 className="font-black text-white italic uppercase leading-none">{client.name}</h3>
                  <p className="text-[9px] text-slate-500 font-bold uppercase mt-1 flex items-center gap-1">
                    <MapPin size={10} /> {client.address || "S/D"}
                  </p>
               </div>
               <div className="flex flex-col gap-2">
                  <button onClick={() => navigate(`/vehicles?client_id=${client.id}`)} className="p-3 bg-amber-600 rounded-xl text-white shadow-lg active:scale-90 transition-all"><Car size={18}/></button>
                  <button onClick={() => openModal(client)} className="p-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-400 active:bg-slate-700 transition-all"><Pencil size={18}/></button>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-700/50">
               <div className="flex items-center gap-2 text-[10px] font-mono text-amber-500">
                  <Phone size={12} /> {client.phone || "---"}
               </div>
               <div className="flex items-center justify-end">
                  {client.user_id ? (
                    <span className="bg-emerald-500/10 text-emerald-500 text-[8px] font-black px-2 py-1 rounded-md border border-emerald-500/20 uppercase">Acceso Activo</span>
                  ) : (
                    <span className="text-slate-600 text-[8px] font-black uppercase">Sin Acceso</span>
                  )}
               </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL RESPONSIVO */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-end md:items-center justify-center z-50">
          <div className="bg-slate-900 border-t md:border border-slate-700 rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in slide-in-from-bottom duration-300">
            <div className="p-6 md:p-8 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                <UserPlus className="text-amber-500" /> {editingClient ? "Editar" : "Nuevo"} Cliente
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-500 p-2"><X size={28} /></button>
            </div>

            <div className="p-6 md:p-8 space-y-5 max-h-[70vh] overflow-y-auto">
              {message && (
                <div className={`p-4 rounded-2xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest ${
                  message.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                }`}>
                  {message.type === 'success' ? <CheckCircle2 size={16}/> : <X size={16}/>} {message.text}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-[9px] text-slate-500 uppercase font-black mb-1 block ml-2">Nombre y Apellido</label>
                  <input type="text" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl outline-none focus:border-amber-500 text-white" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                      <label className="text-[9px] text-slate-500 uppercase font-black mb-1 block ml-2">Email</label>
                      <input type="email" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl outline-none focus:border-amber-500 text-white" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                   </div>
                   <div>
                      <label className="text-[9px] text-slate-500 uppercase font-black mb-1 block ml-2">Teléfono</label>
                      <input type="text" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl outline-none focus:border-amber-500 text-white" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                   </div>
                </div>

                <div>
                  <label className="text-[9px] text-slate-500 uppercase font-black mb-1 block ml-2">Dirección</label>
                  <input type="text" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl outline-none focus:border-amber-500 text-white" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
                </div>
              </div>

              {!editingClient?.user_id && (
                <div className="bg-slate-950/50 border border-slate-800 p-5 rounded-[2rem] space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500"><Lock size={18} /></div>
                      <div>
                        <p className="text-[9px] font-black uppercase text-white">¿Habilitar acceso?</p>
                        <p className="text-[8px] text-slate-500 uppercase font-bold">Podrá ver sus presupuestos online</p>
                      </div>
                    </div>
                    <input type="checkbox" className="w-6 h-6 rounded-lg accent-amber-500" checked={crearAcceso} onChange={(e) => setCrearAcceso(e.target.checked)} />
                  </div>

                  {crearAcceso && (
                    <div className="pt-2 animate-in slide-in-from-top-2 duration-200">
                      <label className="text-[9px] text-slate-500 uppercase font-black mb-1 block ml-2">Contraseña Provisoria</label>
                      <input type="password" placeholder="Mínimo 6 caracteres" className="w-full bg-slate-950 border border-slate-700 p-4 rounded-2xl outline-none focus:border-emerald-500 text-white" value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col md:flex-row gap-3 pt-4">
                <button 
                  onClick={saveClient} 
                  disabled={loading} 
                  className="w-full md:flex-[2] bg-amber-600 text-white font-black py-4 rounded-2xl hover:bg-amber-500 transition-all uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 shadow-lg"
                >
                  {loading ? <Loader2 className="animate-spin" size={16}/> : (editingClient ? "Actualizar Datos" : "Confirmar Registro")}
                </button>
                <button onClick={() => setShowModal(false)} className="w-full md:flex-1 bg-slate-800 text-slate-400 font-bold py-4 rounded-2xl hover:bg-slate-700 transition-all uppercase text-[10px]">
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}