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
  const [pagos, setPagos] = useState<any[]>([]);
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
          .select('id').eq('user_id', user.id).maybeSingle();
        clientId = clientTableData?.id;
      }

      if (clientId) {
        const [vehiclesRes, ordersRes, paymentsRes] = await Promise.all([
          supabase.from("vehicles").select("*").eq("client_id", clientId),
          supabase.from("service_orders").select("*, vehicles(autos, modelo, plate)").eq("client_id", clientId).order("created_at", { ascending: false }),
          supabase.from("payments").select("*, service_orders(vehicles(autos, plate))").eq("client_id", clientId).order("payment_date", { ascending: false })
        ]);

        setVehiculos(vehiclesRes.data || []);
        setOrdenes(ordersRes.data || []);
        setPagos(paymentsRes.data || []);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="p-10 text-center animate-pulse text-slate-500 uppercase font-black italic text-sm">
      Sincronizando Upton Garage...
    </div>
  );

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700 pb-10 px-2 md:px-0">
      
      {/* BIENVENIDA RESPONSIVA */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-400 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-4 md:gap-6">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl border-2 md:border-4 border-white/30 overflow-hidden bg-orange-700 shadow-2xl flex shrink-0 items-center justify-center">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl md:text-3xl font-black text-white italic">{userName.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div>
            <h1 className="text-2xl md:text-4xl font-black text-white italic tracking-tighter uppercase leading-none">
              ¡Hola, {userName.split(' ')[0]}!
            </h1>
            <p className="text-orange-100 font-bold text-[10px] md:text-sm uppercase tracking-widest mt-1 md:mt-2">
              Tu garaje profesional.
            </p>
          </div>
        </div>
        <Car className="absolute -right-6 -bottom-6 text-white/10 w-40 h-40 md:w-64 md:h-64 rotate-12 pointer-events-none" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        
        <div className="lg:col-span-2 space-y-8">
          
          {/* REPARACIONES */}
          <div>
            <h3 className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-2 ml-4 mb-4">
              <ClipboardList size={14} className="text-orange-500" /> Seguimiento
            </h3>
            {ordenes.length === 0 ? (
              <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[2rem] text-center">
                <p className="text-slate-600 font-bold uppercase text-[10px] italic">Sin servicios activos.</p>
              </div>
            ) : (
              ordenes.map((o) => (
                <div key={o.id} className="bg-slate-800 border border-slate-700 p-5 md:p-6 rounded-[2rem] mb-4 hover:border-orange-500/30 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg md:text-xl font-black text-white uppercase italic">{o.vehicles?.autos}</h4>
                      <p className="text-[9px] font-mono text-orange-500 font-bold uppercase tracking-tighter">{o.vehicles?.plate}</p>
                    </div>
                    <span className={`px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                      o.status === 'terminado' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse'
                    }`}>
                      {o.status}
                    </span>
                  </div>
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                    <p className="text-[8px] text-slate-500 font-black uppercase mb-1 italic">Técnico dice:</p>
                    <p className="text-xs md:text-sm text-slate-300 italic">"{o.diagnostico || "Evaluando..."}"</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* PAGOS */}
          <div>
            <h3 className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-2 ml-4 mb-4">
              <DollarSign size={14} className="text-emerald-500" /> Historial de Pagos
            </h3>
            <div className="bg-slate-800 border border-slate-700 rounded-[2rem] overflow-hidden shadow-xl">
              {pagos.length === 0 ? (
                <div className="p-6 text-center text-slate-600 font-bold uppercase text-[10px] italic">Sin pagos registrados.</div>
              ) : (
                <div className="divide-y divide-slate-700/50">
                  {pagos.map((p) => (
                    <div key={p.id} className="p-4 flex items-center justify-between active:bg-slate-700/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="bg-emerald-500/10 p-2.5 rounded-xl text-emerald-500"><Receipt size={18} /></div>
                        <div>
                          <p className="text-[10px] font-black text-white uppercase italic">Recibo #{p.id.toString().slice(-4)}</p>
                          <p className="text-[8px] text-slate-500 font-bold uppercase">{p.payment_date}</p>
                        </div>
                      </div>
                      <p className="text-xs md:text-sm font-black text-emerald-500 italic">${p.amount.toLocaleString()}</p>
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
          <div className="grid grid-cols-1 gap-3 italic">
            {vehiculos.map((v) => (
              <div key={v.id} className="bg-slate-800/40 border border-slate-700 p-4 rounded-2xl flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-orange-500 shrink-0"><Car size={20}/></div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-[10px] font-black text-white uppercase truncate">{v.autos} {v.modelo}</p>
                  <p className="text-[8px] text-slate-500 font-bold uppercase tracking-tighter">{v.plate}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ASISTENCIA */}
          <div className="bg-slate-800 p-6 rounded-[2rem] border border-slate-700 shadow-xl">
            <h4 className="text-[9px] font-black text-orange-500 uppercase mb-4 tracking-[0.2em] text-center">Centro de Asistencia</h4>
            <div className="grid grid-cols-1 gap-3">
              <a 
                href={`https://wa.me/${TALLER_INFO.tel1}?text=${encodeURIComponent(`Hola Upton Garage! Soy ${userName}, consulta desde la App.`)}`}
                target="_blank" rel="noopener noreferrer"
                className="w-full bg-slate-900 p-4 rounded-2xl flex items-center justify-center gap-3 border border-slate-700 active:scale-95 transition-all group"
              >
                <MessageCircle size={18} className="text-emerald-500" />
                <span className="text-[10px] font-black uppercase text-white">WhatsApp</span>
              </a>

              <a 
                href={TALLER_INFO.mapUrl} 
                target="_blank" rel="noopener noreferrer"
                className="w-full bg-slate-900 p-4 rounded-2xl flex items-center justify-center gap-3 border border-slate-700 active:scale-95 transition-all"
              >
                <MapPin size={18} className="text-blue-500" />
                <span className="text-[10px] font-black uppercase text-white">Ubicación</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}