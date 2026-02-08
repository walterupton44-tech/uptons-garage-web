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
      return setMessage({ type: "error", text: "Email y contraseña (mín. 6 caracteres) son obligatorios para el acceso" });
    }

    setLoading(true);
    setMessage(null);

    try {
      let currentUserId = editingClient?.user_id || null;
      let clientId = editingClient?.id || null;

      // --- PASO 1: MANEJO DE AUTENTICACIÓN (Auth) ---
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
          // Si el usuario ya existe, intentamos recuperar su ID de profiles
          if (authError.message.includes("already registered") || authError.status === 422) {
            const { data: existingProfile } = await supabase
              .from('profiles')
              .select('id')
              .eq('email', formData.email)
              .single();
            
            if (existingProfile) {
              currentUserId = existingProfile.id;
            } else {
              throw new Error("El email ya existe pero no se pudo recuperar el perfil de acceso.");
            }
          } else {
            throw authError;
          }
        } else {
          currentUserId = authData.user?.id || null;
        }
      }

      // --- PASO 2: GUARDAR EN TABLA CLIENTS ---
      const clientPayload = { 
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        matricula: formData.matricula || null,
        user_id: currentUserId 
      };

      if (editingClient) {
        const { error: updateError } = await supabase
          .from("clients")
          .update(clientPayload)
          .eq("id", editingClient.id);
        if (updateError) throw updateError;
        clientId = editingClient.id;
      } else {
        const { data: newClient, error: insertError } = await supabase
          .from("clients")
          .insert([clientPayload])
          .select()
          .single();
        if (insertError) throw insertError;
        clientId = newClient.id;
      }

      // --- PASO 3: SINCRONIZACIÓN DE PERFIL (Vínculo Crítico) ---
      if (currentUserId && clientId) {
        const { error: profileError } = await supabase
          .from("profiles")
          .upsert({
            id: currentUserId,
            email: formData.email,
            full_name: formData.name,
            role: 'cliente' as any,
            client_id: clientId,
            updated_at: new Date()
          });
        
        if (profileError) console.warn("Error vinculando profile:", profileError.message);
      }

      setMessage({ type: "success", text: "Cliente guardado y vinculado con éxito" });
      
      setTimeout(() => {
        setShowModal(false);
        fetchClients();
        onRefresh?.();
      }, 1500);

    } catch (error: any) {
      console.error("Error en el proceso:", error);
      setMessage({ type: "error", text: error.message || "Ocurrió un error inesperado" });
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
        name: client.name, 
        phone: client.phone, 
        email: client.email,
        address: client.address, 
        role: client.role, 
        matricula: client.matricula || "",
      });
    } else {
      setEditingClient(null);
      setFormData({ name: "", phone: "", email: "", address: "", role: UserRole.CLIENT, matricula: "" });
    }
    setShowModal(true);
  };

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-white">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3 italic text-white">
            <User className="text-amber-500" size={32} /> UPTON'S CLIENTES
          </h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Base de datos de Garage</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nombre..." 
              className="bg-slate-800 border border-slate-700 pl-10 pr-4 py-2 rounded-xl text-sm outline-none focus:border-amber-500 w-64 transition-all" 
              value={filtro} 
              onChange={(e) => setFiltro(e.target.value)} 
            />
          </div>
          <button onClick={() => openModal()} className="bg-amber-600 hover:bg-amber-500 text-white px-5 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all">
            <UserPlus size={18} /> Nuevo Registro
          </button>
        </div>
      </div>

      {/* LISTA / TABLA */}
      <div className="bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
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
              {clients.filter(c => c.name.toLowerCase().includes(filtro.toLowerCase())).map(client => (
                <tr key={client.id} className="hover:bg-slate-700/20 transition-all group">
                  <td className="p-5">
                    <div className="font-bold text-slate-200 group-hover:text-amber-500 transition-colors">{client.name}</div>
                    <div className="text-[10px] text-slate-500 uppercase flex items-center gap-1"><MapPin size={10}/> {client.address || "Sin dirección"}</div>
                  </td>
                  <td className="p-5">
                    <div className="text-xs font-mono text-amber-500">{client.phone}</div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1"><Mail size={10}/> {client.email}</div>
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
                  <td className="p-5 flex justify-center gap-2">
                    <button onClick={() => navigate(`/vehicles?client_id=${client.id}`)} className="p-2.5 bg-slate-900 rounded-xl hover:bg-amber-600 text-white transition-all"><Car size={16} /></button>
                    <button onClick={() => openModal(client)} className="p-2.5 bg-slate-900 rounded-xl hover:bg-slate-700 text-white transition-all"><Pencil size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden">
            <div className="p-8 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                <UserPlus className="text-amber-500" /> {editingClient ? "Editar Cliente" : "Nuevo Cliente"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white"><X size={24} /></button>
            </div>

            <div className="p-8 space-y-6 max-h-[75vh] overflow-y-auto">
              {message && (
                <div className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-bold uppercase tracking-widest ${
                  message.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                }`}>
                   {message.type === 'success' ? <CheckCircle2 size={16}/> : <X size={16}/>} {message.text}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-[10px] text-slate-500 uppercase font-black mb-2 block ml-2">Nombre y Apellido</label>
                  <input type="text" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl outline-none focus:border-amber-500 text-white" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-black mb-2 block ml-2">Email</label>
                  <input type="email" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl outline-none focus:border-amber-500 text-white" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-black mb-2 block ml-2">Teléfono</label>
                  <input type="text" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl outline-none focus:border-amber-500 text-white" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>

              {!editingClient?.user_id && (
                <div className="bg-slate-950/50 border border-slate-800 p-6 rounded-[2rem] space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500"><Lock size={18} /></div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-white">¿Habilitar acceso al sistema?</p>
                        <p className="text-[9px] text-slate-500 uppercase font-bold text-slate-500">Podrá consultar sus presupuestos online</p>
                      </div>
                    </div>
                    <input type="checkbox" className="w-6 h-6 rounded-lg accent-amber-500 cursor-pointer" checked={crearAcceso} onChange={(e) => setCrearAcceso(e.target.checked)} />
                  </div>

                  {crearAcceso && (
                    <div className="animate-in slide-in-from-top-2 duration-200">
                      <label className="text-[10px] text-slate-500 uppercase font-black mb-2 block ml-2">Establecer Contraseña</label>
                      <input type="password" placeholder="Mínimo 6 caracteres" className="w-full bg-slate-950 border border-slate-700 p-4 rounded-2xl outline-none focus:border-emerald-500 text-emerald-500 transition-all font-mono" value={password} onChange={e => setPassword(e.target.value)} />
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button onClick={() => setShowModal(false)} className="flex-1 bg-slate-800 text-slate-400 font-bold py-4 rounded-2xl hover:bg-slate-700 hover:text-white transition-all uppercase text-[10px] tracking-widest">Cerrar</button>
                <button 
                  onClick={saveClient} 
                  disabled={loading} 
                  className="flex-1 bg-amber-600 text-white font-black py-4 rounded-2xl hover:bg-amber-500 transition-all uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" size={16}/> : (editingClient ? "Actualizar" : "Registrar")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}