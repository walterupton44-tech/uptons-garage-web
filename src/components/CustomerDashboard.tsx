import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { 
  Car, Calendar, ClipboardList, CheckCircle2, 
  Clock, Wrench, AlertCircle, MapPin, 
  ChevronRight, MessageCircle, DollarSign, Receipt
} from "lucide-react";

export default function CustomerDashboard() {
  const [vehiculos, setVehiculos] = useState<any[]>([]);
  const [ordenes, setOrdenes] = useState<any[]>([]);
  const [pagos, setPagos] = useState<any[]>([]); // Nueva estado para pagos
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const TALLER_INFO = {
    tel1: "+5492804505498", 
    tel2: "+5492805065531",
    mapUrl: "https://goo.gl/maps/tu-ubicacion-real" 
  };

  useEffect(() => {
    fetchDatosCliente();
  }, []);

  const fetchDatosCliente = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setAvatarUrl(user.user_metadata?.avatar_url || null);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, client_id')
        .eq('id', user.id)
        .maybeSingle();

      setUserName(profileData?.full_name || user.user_metadata?.full_name || "Cliente");
      let clientId = profileData?.client_id;

      if (!clientId) {
        const { data: clientTableData } = await supabase
          .from('clients')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        clientId = clientTableData?.id;
      }

      if (clientId) {
        // Consultamos Vehículos, Órdenes y ahora también Pagos/Facturas
        const [vehiclesRes, ordersRes, paymentsRes] = await Promise.all([
          supabase.from("vehicles").select("*").eq("client_id", clientId),
          supabase
            .from("service_orders")
            .select("*, vehicles(autos, modelo, plate)")
            .eq("client_id", clientId)
            .order("created_at", { ascending: false }),
          supabase
            .from("payments") // Asumiendo que tu tabla se llama 'payments'
            .select("*, service_orders(vehicles(autos, plate))")
            .eq("client_id", clientId)
            .order("payment_date", { ascending: false })
        ]);

        setVehiculos(vehiclesRes.data || []);
        setOrdenes(ordersRes.data || []);
        setPagos(paymentsRes.data || []);
      }
    } catch (error) {
      console.error("Error crítico en Dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="p-10 text-center animate-pulse text-slate-500 uppercase font-black italic">
      Sincronizando con Upton Garage...
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      
      {/* BIENVENIDA */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-400 p-8 rounded-[2.5rem] shadow-xl shadow-orange-900/20 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
          <div className="w-20 h-20 rounded-3xl border-4 border-white/30 overflow-hidden bg-orange-700 shadow-2xl flex items-center justify-center">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-black text-white italic">{userName.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div>
            <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">
              ¡Hola, {userName.split(' ')[0]}!
            </h1>
            <p className="text-orange-100 font-bold text-sm uppercase tracking-widest mt-2">
              Tu garaje está bajo control profesional.
            </p>
          </div>
        </div>
        <Car className="absolute -right-10 -bottom-10 text-white/10 w-64 h-64 rotate-12 pointer-events-none" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA: SERVICIOS Y PAGOS */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* SECCIÓN REPARACIONES */}
          <div>
            <h3 className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-2 ml-4 mb-4">
              <ClipboardList size={14} className="text-orange-500" /> Seguimiento de Reparaciones
            </h3>
            {ordenes.length === 0 ? (
              <div className="bg-slate-900/50 border border-slate-800 p-12 rounded-[2.5rem] text-center">
                <p className="text-slate-600 font-bold uppercase text-xs italic">No hay servicios activos.</p>
              </div>
            ) : (
              ordenes.map((o) => (
                <div key={o.id} className="bg-slate-800 border border-slate-700 p-6 rounded-[2.5rem] mb-4 hover:border-orange-500/30 transition-all">
                   {/* ... (Mismo contenido de órdenes que ya tenías) ... */}
                   <div className="flex justify-between items-start mb-6">
                    <div>
                      <h4 className="text-xl font-black text-white uppercase italic">{o.vehicles?.autos} {o.vehicles?.modelo}</h4>
                      <p className="text-[10px] font-mono text-orange-500 font-bold uppercase tracking-tighter">PLACA: {o.vehicles?.plate}</p>
                    </div>
                    <span className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      o.status === 'terminado' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 animate-pulse'
                    }`}>
                      {o.status}
                    </span>
                  </div>
                  <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50">
                    <p className="text-[9px] text-slate-500 font-black uppercase mb-1">Diagnóstico</p>
                    <p className="text-sm text-slate-300 italic">"{o.diagnostico || "Evaluando..."}"</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* NUEVA SECCIÓN: HISTORIAL DE PAGOS */}
          <div>
            <h3 className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-2 ml-4 mb-4">
              <DollarSign size={14} className="text-emerald-500" /> Historial de Pagos
            </h3>
            <div className="bg-slate-800 border border-slate-700 rounded-[2.5rem] overflow-hidden shadow-xl">
              {pagos.length === 0 ? (
                <div className="p-8 text-center text-slate-600 font-bold uppercase text-[10px] italic">
                  Aún no registras pagos realizados.
                </div>
              ) : (
                <div className="divide-y divide-slate-700/50">
                  {pagos.map((p) => (
                    <div key={p.id} className="p-5 flex items-center justify-between hover:bg-slate-700/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="bg-emerald-500/10 p-3 rounded-2xl">
                          <Receipt className="text-emerald-500" size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-white uppercase italic">Pago #{p.id.toString().slice(-4)}</p>
                          <p className="text-[9px] text-slate-500 uppercase font-bold">{p.payment_date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-emerald-500 italic">${p.amount.toLocaleString()}</p>
                        <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest">Abonado</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA */}
        <div className="space-y-6">
          <h3 className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-2 ml-4">
            <Car size={14} className="text-orange-500" /> Mis Vehículos
          </h3>
          <div className="space-y-3 italic">
            {vehiculos.map((v) => (
              <div key={v.id} className="bg-slate-800/40 border border-slate-700 p-4 rounded-2xl flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-orange-500 shadow-lg"><Car size={24}/></div>
                <div className="flex-1">
                  <p className="text-xs font-black text-white uppercase tracking-tight">{v.autos} {v.modelo}</p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase">{v.plate} • {v.year}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CONTACTO */}
          <div className="bg-slate-800 p-6 rounded-[2.5rem] border border-slate-700 shadow-xl mt-8">
            <h4 className="text-[10px] font-black text-orange-500 uppercase mb-4 tracking-[0.2em] text-center">Centro de Asistencia</h4>
            <div className="space-y-3">
              <a 
                href={`https://wa.me/${TALLER_INFO.tel1}?text=${encodeURIComponent(`Hola Upton Garage! Soy ${userName}, te escribo desde la App para realizar una consulta.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-slate-900 hover:bg-emerald-500/10 border border-slate-700 p-4 rounded-2xl flex items-center gap-4 transition-all group"
              >
                <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-500">
                  <MessageCircle size={18} />
                </div>
                <span className="text-[10px] font-black uppercase text-white tracking-widest">Enviar WhatsApp</span>
              </a>

              <a href={TALLER_INFO.mapUrl} target="_blank" rel="noopener noreferrer" className="w-full bg-slate-900 hover:bg-blue-500/10 border border-slate-700 p-4 rounded-2xl flex items-center gap-4 transition-all group">
                <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-500">
                  <MapPin size={18} />
                </div>
                <span className="text-[10px] font-black uppercase text-white tracking-widest">Cómo llegar</span>
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// Subcomponente de iconos (Mismo que antes)
function StepIcon({ active, label, Icon, isFinal }: { active: boolean, label: string, Icon: any, isFinal?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
        active 
          ? (isFinal ? 'bg-emerald-500 text-white' : 'bg-orange-500 text-white') 
          : 'bg-slate-700 text-slate-500'
      }`}>
        <Icon size={18} />
      </div>
      <span className={`text-[8px] font-black uppercase ${active ? 'text-white' : 'text-slate-600'}`}>{label}</span>
    </div>
  );
}