import { useEffect, useState, useCallback } from "react";
import { supabase } from "../supabase";
import { useSearchParams } from "react-router-dom";
import { 
  Car, Search, Pencil, Trash2, User, Hash, 
  Settings, Gauge, Calendar, X, Plus, AlertCircle 
} from "lucide-react";

// --- INTERFACES (Se mantienen igual) ---
interface Vehicle {
  id: string; client_id: string; plate: string; autos: string;
  modelo: string; motores: string; year: number; matricula: string; km: number;
}
interface Client { id: string; name: string; }
interface VehicleFormData {
  client_id: string; plate: string; autos: string; modelo: string;
  motores: string; year: number | ""; matricula: string; km: number | "";
}

export default function VehiclesList({ onRefresh }: { onRefresh?: () => void }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [currentClientId, setCurrentClientId] = useState<string | null>(null);

  const [autoNames, setAutoNames] = useState<Record<string, string>>({});
  const [modelNames, setModelNames] = useState<Record<string, string>>({});
  const [motorNames, setMotorNames] = useState<Record<string, string>>({});
  const [allAutos, setAllAutos] = useState<any[]>([]);
  const [modalModels, setModalModels] = useState<any[]>([]);
  const [modalMotors, setModalMotors] = useState<any[]>([]);

  const [formData, setFormData] = useState<VehicleFormData>({
    client_id: "", plate: "", autos: "", modelo: "", motores: "", year: "", matricula: "", km: ""
  });

  const [searchParams] = useSearchParams();
  const queryClientId = searchParams.get("client_id");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let role = 'cliente';
      let mappedClientId = null;

      if (user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        role = profile?.role || 'cliente';
        setUserRole(role);
        if (role === 'cliente') {
          const { data: clientData } = await supabase.from('clients').select('id, name').eq('user_id', user.id).single();
          mappedClientId = clientData?.id;
          setCurrentClientId(mappedClientId);
          if (clientData) setClients([clientData]);
        }
      }

      let query = supabase.from("vehicles").select("*").order("created_at", { ascending: false });
      if (role === 'cliente' && mappedClientId) query = query.eq("client_id", mappedClientId);
      else if (queryClientId) query = query.eq("client_id", queryClientId);

      const { data: vData } = await query;
      const currentVehicles = vData || [];

      const [resClients, resAutos] = await Promise.all([
        role === 'admin' ? supabase.from("clients").select("id, name").order("name") : Promise.resolve({ data: [] }),
        supabase.from("autos").select("id, marcas").order("marcas")
      ]);

      if (role === 'admin') setClients(resClients.data || []);
      const usedModelIds = [...new Set(currentVehicles.map(v => v.modelo))].filter(Boolean);
      const usedMotorIds = [...new Set(currentVehicles.map(v => v.motores))].filter(Boolean);

      const [resModels, resMotors] = await Promise.all([
        supabase.from("modelo").select("idmod, modelos").in("idmod", usedModelIds),
        supabase.from("motores").select("id, motor").in("id", usedMotorIds)
      ]);

      setVehicles(currentVehicles);
      setAllAutos(resAutos.data || []);
      setAutoNames(Object.fromEntries((resAutos.data || []).map(a => [String(a.id), a.marcas])));
      setModelNames(Object.fromEntries((resModels.data || []).map(m => [String(m.idmod), m.modelos])));
      setMotorNames(Object.fromEntries((resMotors.data || []).map(m => [String(m.id), m.motor])));
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [queryClientId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAutoChange = async (autoId: string) => {
    setFormData({ ...formData, autos: autoId, modelo: "", motores: "" });
    const { data } = await supabase.from("modelo").select("idmod, modelos").eq("idmarca", autoId).order("modelos");
    setModalModels(data || []);
    setModalMotors([]);
  };

  const handleModeloChange = async (modeloId: string) => {
    setFormData({ ...formData, modelo: modeloId, motores: "" });
    const { data } = await supabase.from("motores").select("id, motor").eq("idmod", modeloId).order("motor");
    setModalMotors(data || []);
  };

  const openModal = async (vehicle?: Vehicle) => {
    if (vehicle) {
      setEditingVehicle(vehicle);
      setFormData({ ...vehicle });
      const [resM, resMo] = await Promise.all([
        supabase.from("modelo").select("idmod, modelos").eq("idmarca", vehicle.autos),
        supabase.from("motores").select("id, motor").eq("idmod", vehicle.modelo)
      ]);
      setModalModels(resM.data || []);
      setModalMotors(resMo.data || []);
    } else {
      setEditingVehicle(null);
      setFormData({ 
        client_id: userRole === 'cliente' ? (currentClientId || "") : (queryClientId || ""), 
        plate: "", autos: "", modelo: "", motores: "", year: "", matricula: "", km: "" 
      });
      setModalModels([]); setModalMotors([]);
    }
    setShowModal(true);
  };

  const saveVehicle = async () => {
    const finalData = { ...formData, client_id: userRole === 'cliente' ? currentClientId : formData.client_id };
    if (!finalData.plate || !finalData.client_id) { alert("Obligatorio: Patente y Propietario"); return; }
    const { error } = editingVehicle 
      ? await supabase.from("vehicles").update(finalData).eq("id", editingVehicle.id)
      : await supabase.from("vehicles").insert([finalData]);
    if (!error) { setShowModal(false); fetchData(); onRefresh?.(); }
  };

  const deleteVehicle = async (id: string) => {
    if (confirm("¿Eliminar este vehículo?")) {
      const { error } = await supabase.from("vehicles").delete().eq("id", id);
      if (!error) fetchData();
    }
  };

  const filteredVehicles = vehicles.filter(v => {
    if (userRole === 'cliente') return true; 
    const s = searchTerm.toLowerCase().trim();
    if (!s) return true;
    const cliente = clients.find(cl => cl.id === v.client_id)?.name || "";
    const marca = autoNames[v.autos] || "";
    const modelo = modelNames[v.modelo] || "";
    const patente = v.matricula || "";
    return cliente.toLowerCase().includes(s) || marca.toLowerCase().includes(s) || 
           modelo.toLowerCase().includes(s) || patente.toLowerCase().includes(s);
  });

  if (loading) return <div className="p-10 text-center text-white font-black animate-pulse uppercase">Cargando Garage...</div>;

  return (
    <div className="p-4 md:p-6 bg-slate-900 min-h-screen text-white">
      {/* HEADER RESPONSIVO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3 italic uppercase">
            <Car className="text-orange-500 shrink-0" size={28} />
            {userRole === 'cliente' ? "Mis Vehículos" : "Gestión de Flota"}
          </h1>
          <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] mt-1">
            {userRole === 'cliente' ? "Tu garage personal" : "Panel administrativo"}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {userRole !== 'cliente' && (
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text" 
                placeholder="Buscar unidad..." 
                className="bg-slate-800 border border-slate-700 pl-10 pr-4 py-3 rounded-xl text-xs outline-none focus:border-orange-500 w-full text-white"
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          )}
          <button 
            onClick={() => openModal()} 
            className="bg-orange-600 hover:bg-orange-500 text-white px-6 py-3 rounded-xl font-black italic text-xs flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
          >
            <Plus size={18} /> NUEVA UNIDAD
          </button>
        </div>
      </div>

      {/* VISTA DE TABLA (SOLO PC) */}
      <div className="hidden lg:block bg-slate-800/50 rounded-[2rem] border border-slate-800 overflow-hidden shadow-2xl backdrop-blur-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900/80 text-slate-500 text-[9px] uppercase tracking-[0.2em]">
              <th className="p-5 font-black">Propietario</th>
              <th className="p-5 font-black text-center">Identificación</th>
              <th className="p-5 font-black">Marca / Modelo</th>
              <th className="p-5 font-black">Especificaciones</th>
              <th className="p-5 font-black text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filteredVehicles.map(v => (
              <tr key={v.id} className="hover:bg-white/5 transition-colors group">
                <td className="p-5">
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-orange-500/50" />
                    <span className="text-xs font-bold text-slate-300">{clients.find(c => c.id === v.client_id)?.name || "---"}</span>
                  </div>
                </td>
                <td className="p-5">
                  <div className="flex flex-col items-center">
                    <span className="bg-slate-950 text-orange-500 px-3 py-1 rounded-lg font-mono font-black text-xs border border-slate-800 uppercase tracking-widest">{v.matricula || "S/M"}</span>
                    <span className="text-[9px] text-slate-600 mt-1 font-bold tracking-tighter">CHASIS: {v.plate || "---"}</span>
                  </div>
                </td>
                <td className="p-5">
                  <div className="flex flex-col italic uppercase">
                    <span className="text-white font-black text-sm">{autoNames[String(v.autos)] || "---"}</span>
                    <span className="text-slate-500 text-[10px] font-bold tracking-tighter">{modelNames[String(v.modelo)] || "---"}</span>
                  </div>
                </td>
                <td className="p-5">
                   <div className="flex items-center gap-3 text-[9px] text-slate-400 font-bold uppercase">
                      <span className="flex items-center gap-1"><Calendar size={10} className="text-orange-500" /> {v.year}</span>
                      <span className="flex items-center gap-1"><Gauge size={10} className="text-orange-500" /> {v.km?.toLocaleString()} KM</span>
                   </div>
                </td>
                <td className="p-5">
                  <div className="flex justify-center gap-2">
                    <button onClick={() => openModal(v)} className="p-2 bg-slate-900 hover:bg-orange-600 rounded-xl transition-all border border-slate-800"><Pencil size={14} /></button>
                    {userRole === 'admin' && <button onClick={() => deleteVehicle(v.id)} className="p-2 bg-slate-900 hover:bg-red-600 rounded-xl transition-all border border-slate-800"><Trash2 size={14} /></button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* VISTA DE CARDS (SOLO MÓVIL) */}
      <div className="lg:hidden grid grid-cols-1 gap-4">
        {filteredVehicles.map(v => (
          <div key={v.id} className="bg-slate-800/80 border border-slate-700 p-5 rounded-[1.5rem] shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 flex gap-2">
               <button onClick={() => openModal(v)} className="p-3 bg-slate-900 rounded-xl border border-slate-700 text-orange-500 active:bg-orange-600 active:text-white transition-all"><Pencil size={16} /></button>
               {userRole === 'admin' && <button onClick={() => deleteVehicle(v.id)} className="p-3 bg-slate-900 rounded-xl border border-slate-700 text-red-500 active:bg-red-600 active:text-white transition-all"><Trash2 size={16} /></button>}
            </div>
            
            <div className="flex items-start gap-4 mb-4">
               <div className="p-3 bg-slate-900 rounded-2xl text-orange-500 border border-slate-700 shadow-inner"><Car size={24} /></div>
               <div>
                  <h3 className="text-lg font-black italic uppercase text-white leading-tight">{autoNames[String(v.autos)] || "---"}</h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{modelNames[String(v.modelo)] || "---"}</p>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
               <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                  <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Patente</p>
                  <p className="text-xs font-mono font-black text-orange-500">{v.matricula || "S/M"}</p>
               </div>
               <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                  <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Kilometraje</p>
                  <p className="text-xs font-black text-white">{v.km?.toLocaleString()} <span className="text-[9px] text-slate-500">KM</span></p>
               </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
               <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase">
                  <User size={12} className="text-orange-500/50" /> {clients.find(c => c.id === v.client_id)?.name || "---"}
               </div>
               <div className="text-[9px] font-black text-slate-600 uppercase">AÑO: {v.year}</div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL RESPONSIVO */}
      {showModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-end md:items-center justify-center">
          <div className="bg-slate-900 border-t md:border border-slate-800 w-full max-w-2xl rounded-t-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="p-6 md:p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <h2 className="text-lg md:text-xl font-black italic uppercase text-white tracking-tight flex items-center gap-3">
                <Settings className="text-orange-500" /> {editingVehicle ? "Editar Unidad" : "Nueva Unidad"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white p-2"><X size={24} /></button>
            </div>
            
            <div className="p-6 md:p-8 overflow-y-auto max-h-[70vh] grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* Los campos del select e input ahora son full width en móvil */}
              <div className="col-span-1 md:col-span-2 space-y-2">
                <label className="text-[9px] font-black uppercase text-slate-500 ml-2">Propietario</label>
                <select disabled={userRole === 'cliente'} className="w-full bg-slate-800 border border-slate-700 p-4 rounded-2xl text-xs text-white outline-none focus:border-orange-500 appearance-none" value={formData.client_id} onChange={(e) => setFormData({...formData, client_id: e.target.value})}>
                  <option value="">Seleccionar Cliente...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-slate-500 ml-2">Matrícula</label>
                <input className="w-full bg-slate-800 border border-slate-700 p-4 rounded-2xl text-xs text-white outline-none focus:border-orange-500 uppercase" value={formData.matricula} onChange={(e) => setFormData({...formData, matricula: e.target.value.toUpperCase()})} />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-slate-500 ml-2">Chasis</label>
                <input className="w-full bg-slate-800 border border-slate-700 p-4 rounded-2xl text-xs text-white outline-none focus:border-orange-500 uppercase" value={formData.plate} onChange={(e) => setFormData({...formData, plate: e.target.value.toUpperCase()})} />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-slate-500 ml-2">Marca</label>
                <select className="w-full bg-slate-800 border border-slate-700 p-4 rounded-2xl text-xs text-white" value={formData.autos} onChange={(e) => handleAutoChange(e.target.value)}>
                  <option value="">Marca...</option>
                  {allAutos.map(a => <option key={a.id} value={a.id}>{a.marcas}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-slate-500 ml-2">Modelo</label>
                <select className="w-full bg-slate-800 border border-slate-700 p-4 rounded-2xl text-xs text-white" value={formData.modelo} onChange={(e) => handleModeloChange(e.target.value)}>
                  <option value="">Modelo...</option>
                  {modalModels.map(m => <option key={m.idmod} value={m.idmod}>{m.modelos}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-slate-500 ml-2">Año</label>
                <input type="number" className="w-full bg-slate-800 border border-slate-700 p-4 rounded-2xl text-xs text-white" value={formData.year} onChange={(e) => setFormData({...formData, year: Number(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-slate-500 ml-2">Kilometraje</label>
                <input type="number" className="w-full bg-slate-800 border border-slate-700 p-4 rounded-2xl text-xs text-white" value={formData.km} onChange={(e) => setFormData({...formData, km: Number(e.target.value)})} />
              </div>
            </div>

            <div className="p-6 md:p-8 bg-slate-950/50 flex flex-col md:flex-row gap-3">
              <button onClick={saveVehicle} className="w-full md:flex-[2] bg-orange-600 hover:bg-orange-500 p-4 rounded-2xl text-[10px] font-black uppercase italic tracking-widest shadow-lg active:scale-95 transition-all">
                {editingVehicle ? "Guardar Cambios" : "Confirmar Registro"}
              </button>
              <button onClick={() => setShowModal(false)} className="w-full md:flex-1 py-4 text-[10px] font-black uppercase text-slate-500 hover:text-white order-last md:order-none">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}