import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabase";
import { 
  Search, Save, Loader2, ClipboardList, Clock, 
  PackageCheck, MessageCircle, History, ArrowLeftRight, Hash, ShieldCheck
} from "lucide-react";

export default function ServiceOrders() {
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [vehiculos, setVehiculos] = useState<any[]>([]);
  const [ordenesPendientes, setOrdenesPendientes] = useState<any[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [presupuestosVehiculo, setPresupuestosVehiculo] = useState<any[]>([]);
  
  // ESTADOS DE ROL
  const [userRole, setUserRole] = useState<string | null>(null);
  const [currentClientId, setCurrentClientId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    kilometraje: "",
    description: "",
    status: "PENDIENTE"
  });

  const fetchOrdenes = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Obtener Rol y Datos del Usuario
      const { data: { user } } = await supabase.auth.getUser();
      let role = 'cliente';
      let mappedClientId = null;

      if (user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        role = profile?.role || 'cliente';
        setUserRole(role);

        if (role === 'cliente') {
          const { data: clientData } = await supabase.from('clients').select('id').eq('user_id', user.id).single();
          mappedClientId = clientData?.id;
          setCurrentClientId(mappedClientId);
        }
      }

      // 2. Query Filtrada
      let query = supabase
        .from("service_orders")
        .select(`*, clients(name, phone), vehicles(matricula, plate)`)
        .neq("status", "FINALIZADO");

      if (role === 'cliente' && mappedClientId) {
        query = query.eq("client_id", mappedClientId);
      }

      const { data, error } = await query.order("created_at", { ascending: false });
      if (!error) setOrdenesPendientes(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrdenes(); }, [fetchOrdenes]);

  const traducirItemsPresupuesto = (items: any[]) => {
    if (!items || items.length === 0) return "Sin detalles";
    return items.map((i: any) => i.descripcion || i.desc || i.nombre || "Servicio").join(", ");
  };

  const importarPresupuestoAlForm = async (p: any) => {
    if (!p) return;
    const textoServicios = await traducirItemsPresupuesto(p.items);
    const descripcionFinal = ` ${textoServicios}${p.notas ? ' | NOTAS: ' + p.notas : ''}`;
    setFormData(prev => ({ ...prev, description: descripcionFinal }));
  };

  const handleSelectVehicle = async (v: any) => {
    setSelectedVehicle(v);
    setVehiculos([]);
    setBusqueda(v.matricula || v.plate);
    setFormData(prev => ({ ...prev, kilometraje: v.km ? String(v.km) : "", description: "Cargando..." }));

    const { data: pData } = await supabase
      .from("presupuestos_guardados")
      .select("*")
      .eq("vehiculo_id", v.id)
      .order("created_at", { ascending: false }).limit(5);
    
    setPresupuestosVehiculo(pData || []);
    if (pData && pData.length > 0) await importarPresupuestoAlForm(pData[0]);
    else setFormData(prev => ({ ...prev, description: "" }));
  };

  const buscarVehiculos = async (termino: string) => {
    if (termino.length < 2) return setVehiculos([]);
    const { data } = await supabase.from("vehicles")
      .select(`id, plate, matricula, km, client_id, clients(name)`)
      .or(`plate.ilike.%${termino}%, matricula.ilike.%${termino}%`).limit(5);
    setVehiculos(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle || userRole === 'cliente') return;
    setLoading(true);
    try {
      const numKm = parseInt(formData.kilometraje) || 0;
      await supabase.from("service_orders").insert([{
        client_id: selectedVehicle.client_id,
        vehicle_id: selectedVehicle.id,
        description: formData.description,
        status: "PENDIENTE",
        kilometraje: numKm 
      }]);
      await supabase.from("vehicles").update({ km: numKm }).eq("id", selectedVehicle.id);
      setFormData({ kilometraje: "", description: "", status: "PENDIENTE" });
      setSelectedVehicle(null);
      setBusqueda("");
      fetchOrdenes();
      alert("¡Orden creada!");
    } catch (err: any) { alert(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="p-6 bg-[#0B0F1A] min-h-screen text-slate-200">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* BUSCADOR SUPERIOR (SÓLO ADMIN/MECÁNICO) */}
        <div className="bg-slate-800/40 backdrop-blur-xl p-6 rounded-[2rem] border border-slate-700/50 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-900/40 transform -rotate-2">
              <ClipboardList size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase italic text-white tracking-tighter">
                {userRole === 'cliente' ? "Mis Reparaciones" : "Gestión de Órdenes"}
              </h1>
              <p className="text-slate-500 text-[9px] font-bold uppercase tracking-[0.2em]">Estado del Taller</p>
            </div>
          </div>
          
          {userRole !== 'cliente' && (
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                className="w-full bg-slate-900/50 border border-slate-700 py-3 pl-12 pr-4 rounded-xl outline-none focus:border-orange-500/50 text-white transition-all shadow-inner"
                placeholder="Buscar vehículo..."
                value={busqueda}
                onChange={(e) => { setBusqueda(e.target.value); buscarVehiculos(e.target.value); }}
              />
              {vehiculos.length > 0 && (
                <div className="absolute w-full mt-2 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden z-50 shadow-2xl">
                  {vehiculos.map(v => (
                    <div key={v.id} onClick={() => handleSelectVehicle(v)} className="p-3 hover:bg-orange-600/10 cursor-pointer flex justify-between border-b border-slate-800 transition-colors">
                      <span className="font-bold text-white uppercase">{v.matricula || v.plate}</span>
                      <span className="text-[10px] text-slate-500 uppercase">{v.clients?.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* FORMULARIO: OCULTO PARA CLIENTES */}
        {userRole !== 'cliente' ? (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in fade-in duration-500">
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-slate-800/50 p-6 rounded-[2rem] border border-slate-700/50 shadow-xl flex flex-col items-center">
                <div className="flex items-center gap-2 mb-2">
                  <Hash size={12} className="text-orange-500" />
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Kilómetros</label>
                </div>
                <input 
                  type="number" required
                  className="bg-transparent text-5xl font-black text-white outline-none w-full text-center mb-1"
                  value={formData.kilometraje}
                  onChange={(e) => setFormData({...formData, kilometraje: e.target.value})}
                />
              </div>

              <div className="bg-slate-800/50 p-5 rounded-[2rem] border border-slate-700/50 shadow-xl">
                <h2 className="text-[10px] font-black text-amber-500 uppercase mb-4 tracking-widest flex items-center gap-2">
                  <ArrowLeftRight size={14}/> Presupuestos Recientes
                </h2>
                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
                  {presupuestosVehiculo.map(p => (
                    <button type="button" key={p.id} onClick={() => importarPresupuestoAlForm(p)} className="w-full text-left p-4 rounded-2xl bg-slate-900/50 border border-slate-700 hover:border-emerald-500 transition-all group active:scale-95">
                      <p className="text-lg text-emerald-400 font-mono font-bold">${(p.total || 0).toLocaleString()}</p>
                      <p className="text-[8px] text-slate-600 mt-2 italic group-hover:text-emerald-500">Click para importar ↓</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-3 bg-slate-800/30 backdrop-blur-sm p-8 rounded-[2.5rem] border border-slate-700/50 shadow-xl flex flex-col justify-between gap-6">
              <textarea 
                required
                placeholder="Describe el problema o los servicios..."
                className="w-full bg-[#0B0F1A]/60 border border-slate-700 p-6 rounded-[2rem] outline-none text-white text-base h-64 resize-none focus:border-orange-500/50 transition-all"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
              <button type="submit" disabled={loading || !selectedVehicle} className={`w-full p-6 rounded-2xl flex items-center justify-center gap-4 font-black uppercase italic tracking-[0.2em] transition-all ${!selectedVehicle ? "bg-slate-700 text-slate-500" : "bg-orange-600 hover:bg-orange-500 text-white shadow-2xl"}`}>
                {loading ? <Loader2 className="animate-spin" /> : <Save />} Confirmar y Abrir Orden
              </button>
            </div>
          </form>
        ) : (
          /* MENSAJE PARA CLIENTE SI NO HAY ÓRDENES */
          ordenesPendientes.length === 0 && (
            <div className="p-20 text-center bg-slate-800/20 rounded-[3rem] border border-dashed border-slate-700">
              <ShieldCheck size={48} className="mx-auto text-slate-700 mb-4" />
              <p className="text-slate-500 uppercase font-black text-xs tracking-widest">No tienes órdenes activas en este momento</p>
            </div>
          )
        )}

        {/* LISTADO DE ÓRDENES ACTIVAS (COMÚN A AMBOS PERO CON ACCIONES FILTRADAS) */}
        <div className="space-y-4 pt-4">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-500 px-2 flex items-center gap-2">
            <Clock size={14} className="text-orange-500" /> 
            {userRole === 'cliente' ? "Seguimiento de mis Vehículos" : `Órdenes en Taller (${ordenesPendientes.length})`}
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {ordenesPendientes.map((order) => (
              <div key={order.id} className="bg-slate-800/20 backdrop-blur-sm border border-slate-700/30 p-5 rounded-[2.5rem] flex flex-col lg:flex-row items-center justify-between gap-6 hover:border-orange-500/20 transition-all group">
                <div className="flex items-center gap-6 w-full lg:w-auto">
                  <div className="bg-[#0B0F1A] px-6 py-4 rounded-2xl border border-slate-800 text-center min-w-[140px] shadow-lg">
                    <p className="text-xl font-black text-white uppercase tracking-tighter">{order.vehicles?.matricula || order.vehicles?.plate}</p>
                    <span className="bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest">{order.kilometraje} KM</span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-white uppercase">{order.clients?.name}</h3>
                    <p className="text-xs text-slate-400 font-medium">Estado: <span className="text-orange-500">{order.status}</span></p>
                    <p className="text-xs text-slate-500 italic line-clamp-1">"{order.description}"</p>
                  </div>
                </div>
                
                <div className="flex gap-2 w-full lg:w-auto">
                  {/* SOLO EL ADMIN VE "FINALIZAR" */}
                  {userRole !== 'cliente' && (
                    <button className="flex-1 lg:w-auto flex items-center justify-center gap-2 bg-green-600/10 hover:bg-green-600 text-green-500 hover:text-white px-6 py-3 rounded-xl border border-green-600/20 transition-all">
                      <PackageCheck size={18} /> Finalizar
                    </button>
                  )}
                  <button className="flex items-center justify-center bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white p-3 rounded-xl border border-emerald-500/20 transition-all">
                    <MessageCircle size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}