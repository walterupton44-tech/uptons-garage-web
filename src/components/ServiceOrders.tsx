import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabase";
import { 
  Search, Save, Loader2, ClipboardList, Clock, 
  PackageCheck, MessageCircle, Hash, ShieldCheck, ArrowLeftRight, Car, X 
} from "lucide-react";

export default function ServiceOrders() {
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [vehiculos, setVehiculos] = useState<any[]>([]);
  const [ordenesPendientes, setOrdenesPendientes] = useState<any[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [presupuestosVehiculo, setPresupuestosVehiculo] = useState<any[]>([]);
  
  const [userRole, setUserRole] = useState<string | null>(null);
  const [currentClientId, setCurrentClientId] = useState<string | null>(null);

  // Estados para el nuevo Modal de Entrega
  const [orderToFinalize, setOrderToFinalize] = useState<any>(null);

  const [formData, setFormData] = useState({
    kilometraje: "",
    description: "",
    status: "PENDIENTE"
  });

  const fetchOrdenes = useCallback(async () => {
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
          const { data: clientData } = await supabase.from('clients').select('id').eq('user_id', user.id).single();
          mappedClientId = clientData?.id;
          setCurrentClientId(mappedClientId);
        }
      }

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

  // FUNCIONES DE LÓGICA DE BOTONES
  const enviarWhatsApp = (order: any) => {
    const telefono = order.clients?.phone;
    if (!telefono) return alert("El cliente no tiene teléfono registrado.");
    
    const mensaje = encodeURIComponent(
      `Hola ${order.clients.name}, te escribimos de Upton's Garage sobre tu unidad (${order.vehicles?.plate}).`
    );
    window.open(`https://wa.me/${telefono.replace(/\D/g, "")}?text=${mensaje}`, '_blank');
  };

  const ejecutarFinalizacion = async () => {
    if (!orderToFinalize) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("service_orders")
        .update({ status: "FINALIZADO" })
        .eq("id", orderToFinalize.id);

      if (error) throw error;
      setOrdenesPendientes(prev => prev.filter(o => o.id !== orderToFinalize.id));
      setOrderToFinalize(null);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const traducirItemsPresupuesto = (items: any[]) => {
    if (!items || items.length === 0) return "Sin detalles";
    return items.map((i: any) => i.descripcion || i.desc || i.nombre || "Servicio").join(", ");
  };

  const importarPresupuestoAlForm = async (p: any) => {
    if (!p) return;
    const textoServicios = traducirItemsPresupuesto(p.items);
    const descripcionFinal = `${textoServicios}${p.notas ? ' | NOTAS: ' + p.notas : ''}`;
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
    <div className="p-4 md:p-6 bg-[#0B0F1A] min-h-screen text-slate-200">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* HEADER */}
        <div className="bg-slate-800/40 backdrop-blur-xl p-5 md:p-6 rounded-[2rem] border border-slate-700/50 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg transform -rotate-2 shrink-0">
              <ClipboardList size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase italic text-white tracking-tighter leading-none">
                {userRole === 'cliente' ? "Mi Taller" : "Órdenes de Servicio"}
              </h1>
              <p className="text-slate-500 text-[9px] font-bold uppercase tracking-[0.2em] mt-1">Upton's Garage</p>
            </div>
          </div>
          
          {userRole !== 'cliente' && (
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                className="w-full bg-slate-900/50 border border-slate-700 py-3.5 pl-12 pr-4 rounded-2xl outline-none focus:border-orange-500/50 text-white transition-all shadow-inner"
                placeholder="Buscar patente..."
                value={busqueda}
                onChange={(e) => { setBusqueda(e.target.value); buscarVehiculos(e.target.value); }}
              />
              {vehiculos.length > 0 && (
                <div className="absolute w-full mt-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden z-50 shadow-2xl">
                  {vehiculos.map(v => (
                    <div key={v.id} onClick={() => handleSelectVehicle(v)} className="p-4 hover:bg-orange-600/10 cursor-pointer flex justify-between border-b border-slate-800/50 transition-colors">
                      <div className="flex flex-col text-left">
                        <span className="font-bold text-white uppercase">{v.matricula || v.plate}</span>
                        <span className="text-[9px] text-slate-500 uppercase font-bold">{v.clients?.name}</span>
                      </div>
                      <Car size={16} className="text-slate-700" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* FORMULARIO (ADMIN ONLY) */}
        {userRole !== 'cliente' && (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in fade-in duration-500">
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-slate-800/50 p-6 rounded-[2.5rem] border border-slate-700/50 shadow-xl flex flex-col items-center">
                <div className="flex items-center gap-2 mb-2 text-slate-500">
                  <Hash size={12} className="text-orange-500" />
                  <label className="text-[10px] font-black uppercase tracking-widest text-center">KM Actual</label>
                </div>
                <input 
                  type="number" required
                  className="bg-transparent text-5xl font-black text-white outline-none w-full text-center placeholder:text-slate-800"
                  placeholder="0"
                  value={formData.kilometraje}
                  onChange={(e) => setFormData({...formData, kilometraje: e.target.value})}
                />
              </div>

              <div className="bg-slate-800/50 p-6 rounded-[2.5rem] border border-slate-700/50 shadow-xl">
                <h2 className="text-[10px] font-black text-amber-500 uppercase mb-4 tracking-widest flex items-center gap-2">
                  <ArrowLeftRight size={14}/> Historial
                </h2>
                <div className="flex lg:flex-col gap-3 overflow-x-auto lg:max-h-[300px] custom-scrollbar">
                  {presupuestosVehiculo.length === 0 ? (
                    <p className="text-[10px] text-slate-600 italic uppercase">Sin registros</p>
                  ) : (
                    presupuestosVehiculo.map(p => (
                      <button type="button" key={p.id} onClick={() => importarPresupuestoAlForm(p)} className="flex-shrink-0 w-44 lg:w-full text-left p-4 rounded-2xl bg-slate-900/50 border border-slate-700 hover:border-orange-500/50 transition-all">
                        <p className="text-[10px] text-slate-400 font-bold uppercase truncate">{traducirItemsPresupuesto(p.items)}</p>
                        <p className="text-lg text-emerald-400 font-mono font-bold mt-1">${(p.total || 0).toLocaleString()}</p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-3 bg-slate-800/30 p-6 md:p-8 rounded-[2.5rem] border border-slate-700/50 shadow-xl flex flex-col gap-6">
              <textarea 
                required
                placeholder="Detalles del trabajo..."
                className="w-full bg-[#0B0F1A]/60 border border-slate-700 p-6 rounded-[2rem] outline-none text-white text-base h-48 lg:h-64 resize-none focus:border-orange-500/50 transition-all"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
              <button 
                type="submit" 
                disabled={loading || !selectedVehicle} 
                className={`w-full p-6 rounded-[2rem] flex items-center justify-center gap-4 font-black uppercase italic tracking-[0.2em] transition-all shadow-lg active:scale-95 ${
                  selectedVehicle ? 'bg-orange-600 text-white hover:bg-orange-500' : 'bg-slate-800 text-slate-600'
                }`}
              >
                {loading ? <Loader2 className="animate-spin" /> : <Save />} 
                {selectedVehicle ? 'Abrir Orden de Trabajo' : 'Selecciona un vehículo'}
              </button>
            </div>
          </form>
        )}

        {/* LISTADO DE ÓRDENES */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between px-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 flex items-center gap-2">
              <Clock size={12} /> {userRole === 'cliente' ? "Seguimiento en Vivo" : `En Taller Hoy (${ordenesPendientes.length})`}
            </h2>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {ordenesPendientes.map((order) => (
              <div key={order.id} className="bg-slate-800/40 border border-slate-700/30 p-4 md:p-6 rounded-[2.5rem] flex flex-col lg:flex-row items-center justify-between gap-6 hover:border-slate-600 transition-all">
                
                <div className="flex flex-col sm:flex-row items-center gap-6 w-full lg:w-auto text-center sm:text-left">
                  <div className="bg-[#0B0F1A] w-full sm:w-auto px-8 py-5 rounded-[2rem] border border-slate-800 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-orange-600/50"></div>
                    <p className="text-2xl font-black text-white uppercase tracking-tighter leading-none mb-1">
                      {order.vehicles?.matricula || order.vehicles?.plate}
                    </p>
                    <span className="text-[10px] font-mono text-orange-500 font-bold uppercase tracking-widest">
                      {order.kilometraje?.toLocaleString()} KM
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-white uppercase italic tracking-tight">{order.clients?.name}</h3>
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                        Estado: <span className="text-orange-500">{order.status}</span>
                      </p>
                    </div>
                    <p className="text-xs text-slate-500 italic line-clamp-2 max-w-md mt-2">"{order.description}"</p>
                  </div>
                </div>
                
                <div className="flex gap-3 w-full lg:w-auto">
                  {userRole !== 'cliente' && (
                    <button 
                      onClick={() => setOrderToFinalize(order)}
                      className="flex-1 lg:w-auto flex items-center justify-center gap-3 bg-green-600/10 hover:bg-green-600 text-green-500 hover:text-white px-8 py-4 rounded-2xl border border-green-600/20 transition-all"
                    >
                      <PackageCheck size={18} /> Entregar
                    </button>
                  )}
                  <button 
                    onClick={() => enviarWhatsApp(order)}
                    className="flex-1 lg:flex-none flex items-center justify-center bg-blue-500/10 hover:bg-blue-600 text-blue-500 hover:text-white px-6 py-4 rounded-2xl border border-blue-500/20 transition-all"
                  >
                    <MessageCircle size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL DE CONFIRMACIÓN DE ENTREGA */}
      {orderToFinalize && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-300">
          <div className="bg-slate-900 border-t md:border border-slate-700 w-full max-w-md rounded-t-[2.5rem] md:rounded-[3rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-500">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-green-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-green-500/30">
                <PackageCheck size={40} className="text-green-500" />
              </div>
              <h3 className="text-xl font-black uppercase italic text-white mb-2">Confirmar Entrega</h3>
              <p className="text-slate-400 text-sm mb-8 leading-relaxed px-4">
                ¿El vehículo <span className="text-white font-bold">{orderToFinalize.vehicles?.plate}</span> está listo para ser retirado? Se moverá al historial.
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={ejecutarFinalizacion}
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-500 py-4 rounded-2xl font-black uppercase italic tracking-widest text-white transition-all active:scale-95 flex items-center justify-center gap-3 shadow-lg"
                >
                  {loading ? <Loader2 className="animate-spin" /> : "SÍ, ENTREGAR UNIDAD"}
                </button>
                <button 
                  onClick={() => setOrderToFinalize(null)}
                  className="w-full bg-transparent py-4 text-slate-500 font-black text-[10px] tracking-[0.3em] hover:text-white transition-colors"
                >
                  CANCELAR
                </button>
              </div>
            </div>
            <div className="h-2 bg-gradient-to-r from-green-600 to-emerald-400"></div>
          </div>
        </div>
      )}
    </div>
  );
}