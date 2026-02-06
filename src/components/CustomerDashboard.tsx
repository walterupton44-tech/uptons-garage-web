import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { 
  Car, Calendar, ClipboardList, CheckCircle2, 
  Clock, Wrench, AlertCircle, MapPin, Phone,
  ChevronRight
} from "lucide-react";

export default function CustomerDashboard() {
  const [vehiculos, setVehiculos] = useState<any[]>([]);
  const [ordenes, setOrdenes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Datos del taller que proporcionaste
  const TALLER_INFO = {
    tel1: "2804505498",
    tel2: "2805065531",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Upton+Garage+Puerto+Madryn" 
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

      // 1. Buscamos el perfil usando maybeSingle() para evitar el error 406
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, client_id')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) console.error("Error perfil:", profileError);

      setUserName(profileData?.full_name || user.user_metadata?.full_name || "Cliente");

      let clientId = profileData?.client_id;

      // 2. Si el perfil no tiene vinculado el client_id, lo buscamos en la tabla clients
      if (!clientId) {
        const { data: clientTableData, error: clientTableError } = await supabase
          .from('clients')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle(); // Usamos maybeSingle aquí también

        if (clientTableError) console.error("Error tabla clientes:", clientTableError);
        clientId = clientTableData?.id;
      }

      // 3. SOLO si encontramos un clientId, buscamos sus vehículos y órdenes
      if (clientId) {
        const [vehiclesRes, ordersRes] = await Promise.all([
          supabase.from("vehicles").select("*").eq("client_id", clientId),
          supabase
            .from("service_orders")
            .select("*, vehicles(autos, modelo, plate)")
            .eq("client_id", clientId)
            .order("created_at", { ascending: false })
        ]);

        setVehiculos(vehiclesRes.data || []);
        setOrdenes(ordersRes.data || []);
      } else {
        // Si llegamos aquí, el usuario existe pero no está registrado como cliente
        console.warn("Usuario autenticado sin registro en la tabla de clientes.");
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
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl border-4 border-white/30 overflow-hidden bg-orange-700 shadow-2xl flex items-center justify-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-black text-white italic">{userName.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-orange-500 rounded-full shadow-lg"></div>
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
        
        {/* COLUMNA IZQUIERDA: REPARACIONES */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-2 ml-4">
            <ClipboardList size={14} className="text-orange-500" /> Seguimiento en tiempo real
          </h3>

          {ordenes.length === 0 ? (
            <div className="bg-slate-900/50 border border-slate-800 p-12 rounded-[2.5rem] text-center">
              <p className="text-slate-600 font-bold uppercase text-xs italic">No hay servicios activos.</p>
            </div>
          ) : (
            ordenes.map((o) => (
              <div key={o.id} className="bg-slate-800 border border-slate-700 p-6 rounded-[2.5rem] hover:border-orange-500/30 transition-all group">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h4 className="text-xl font-black text-white uppercase italic">{o.vehicles?.autos} {o.vehicles?.modelo}</h4>
                    <p className="text-[10px] font-mono text-orange-500 font-bold uppercase tracking-tighter">PLACA: {o.vehicles?.plate}</p>
                  </div>
                  <span className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest ${
                    o.status === 'terminado' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 
                    o.status === 'en proceso' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse' : 'bg-slate-700 text-slate-400'
                  }`}>
                    {o.status}
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50">
                    <p className="text-[9px] text-slate-500 font-black uppercase mb-1">Diagnóstico</p>
                    <p className="text-sm text-slate-300 leading-relaxed italic">"{o.diagnostico || "Evaluando el vehículo..."}"</p>
                  </div>

                  {/* PROGRESO */}
                  <div className="flex items-center justify-between px-2 pt-4">
                    <StepIcon active={true} label="Recibido" Icon={Clock} />
                    <div className={`h-1 flex-1 mx-2 rounded-full ${['en proceso', 'terminado'].includes(o.status) ? 'bg-orange-500' : 'bg-slate-700'}`}></div>
                    <StepIcon active={['en proceso', 'terminado'].includes(o.status)} label="En Taller" Icon={Wrench} />
                    <div className={`h-1 flex-1 mx-2 rounded-full ${o.status === 'terminado' ? 'bg-orange-500' : 'bg-slate-700'}`}></div>
                    <StepIcon active={o.status === 'terminado'} label="Listo" Icon={CheckCircle2} isFinal />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* COLUMNA DERECHA: VEHÍCULOS Y AYUDA */}
        <div className="space-y-6">
          
          {/* SECCIÓN NUEVA: PRÓXIMAS CITAS */}
          <h3 className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-2 ml-4">
            <Calendar size={14} className="text-orange-500" /> Próximas Citas
          </h3>
          <div className="bg-orange-500/10 border border-orange-500/20 p-5 rounded-[2rem] relative overflow-hidden group">
            <div className="relative z-10">
              <p className="text-[10px] font-black text-orange-500 uppercase">Sin citas pendientes</p>
              <p className="text-[9px] text-orange-200/60 uppercase font-bold mt-1">Agenda tu próximo mantenimiento preventivo.</p>
            </div>
            <Calendar className="absolute -right-2 -bottom-2 text-orange-500/10 w-16 h-16 group-hover:scale-110 transition-transform" />
          </div>

          <h3 className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-2 ml-4 pt-4">
            <Car size={14} className="text-orange-500" /> Mis Vehículos
          </h3>
          <div className="space-y-3 italic">
            {vehiculos.map((v) => (
              <div key={v.id} className="bg-slate-800/40 border border-slate-700 p-4 rounded-2xl flex items-center gap-4 hover:bg-slate-800 transition-colors">
                <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-orange-500 shadow-lg"><Car size={24}/></div>
                <div className="flex-1">
                  <p className="text-xs font-black text-white uppercase tracking-tight">{v.autos} {v.modelo}</p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase">{v.plate} • {v.year}</p>
                </div>
                <ChevronRight size={14} className="text-slate-600" />
              </div>
            ))}
          </div>

          {/* ACCIONES RÁPIDAS (BOTONES CON FUNCIONALIDAD) */}
          <div className="bg-slate-800 p-6 rounded-[2.5rem] border border-slate-700 shadow-xl mt-8">
            <h4 className="text-[10px] font-black text-orange-500 uppercase mb-4 tracking-[0.2em] text-center">Centro de Asistencia</h4>
            <div className="space-y-3">
              {/* LLAMADA PRINCIPAL */}
              <a href={`tel:${TALLER_INFO.tel1}`} 
                 className="w-full bg-slate-900 hover:bg-emerald-500/10 border border-slate-700 p-4 rounded-2xl flex items-center gap-4 transition-all group">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                  <Phone size={18} />
                </div>
                <span className="text-[10px] font-black uppercase text-white tracking-widest">Llamar Principal</span>
              </a>

              {/* CÓMO LLEGAR */}
              <a href={TALLER_INFO.mapUrl} 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="w-full bg-slate-900 hover:bg-blue-500/10 border border-slate-700 p-4 rounded-2xl flex items-center gap-4 transition-all group">
                <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                  <MapPin size={18} />
                </div>
                <span className="text-[10px] font-black uppercase text-white tracking-widest">Cómo llegar</span>
              </a>

              <p className="text-[8px] text-slate-500 text-center uppercase font-bold pt-2">Emergencias: {TALLER_INFO.tel2}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// Subcomponente para los pasos del progreso
function StepIcon({ active, label, Icon, isFinal }: { active: boolean, label: string, Icon: any, isFinal?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all shadow-lg ${
        active 
          ? (isFinal ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-orange-500 text-white shadow-orange-500/20') 
          : 'bg-slate-700 text-slate-500'
      }`}>
        <Icon size={18} />
      </div>
      <span className={`text-[8px] font-black uppercase ${active ? 'text-white' : 'text-slate-600'}`}>{label}</span>
    </div>
  );
}