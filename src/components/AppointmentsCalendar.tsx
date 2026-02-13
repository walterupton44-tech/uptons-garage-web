import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { useAuth } from "../contexts/AuthContext";
import { 
  startOfMonth, endOfMonth, eachDayOfInterval, format, 
  addMonths, subMonths, isToday, startOfWeek, endOfWeek 
} from "date-fns";
import { es } from "date-fns/locale";
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, 
  Clock, User, Car, Plus, X, MessageCircle, AlertCircle 
} from "lucide-react";
import NewAppointmentModal from "./NewAppointmentModal";

const getStatusStyles = (status: string) => {
  switch (status?.toLowerCase()) {
    case "pendiente": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    case "confirmado": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    case "completado": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    case "cancelado": return "bg-red-500/10 text-red-400 border-red-500/20";
    default: return "bg-slate-500/10 text-slate-400 border-slate-500/20";
  }
};

export default function AppointmentsCalendar() {
  const { currentUser } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [preselectedDate, setPreselectedDate] = useState<string | null>(null);

  const userRole = currentUser?.role?.toLowerCase();
  const isCliente = userRole === 'cliente' || userRole === 'client';

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      let query = supabase.from("appointments").select(`*, clients ( name, phone ), vehicles ( plate )`);
      if (isCliente && currentUser?.client_id) {
        query = query.eq("client_id", currentUser.client_id);
      }
      const { data, error } = await query.order("time", { ascending: true });
      if (error) throw error;
      setAppointments(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (currentUser) fetchAppointments(); }, [currentUser]);

  const enviarWhatsApp = (ap: any, tipo: 'confirmar' | 'recordar') => {
    const tel = ap.clients?.phone;
    if (!tel) return alert("Sin teléfono");
    const msg = tipo === 'confirmar' 
      ? `Hola ${ap.clients.name}! Confirmamos tu turno en Upton's Garage para el ${ap.date} a las ${ap.time.substring(0,5)}hs.`
      : `Recordatorio: Tienes un turno mañana a las ${ap.time.substring(0,5)}hs. ¡Te esperamos!`;
    window.open(`https://wa.me/${tel.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const calendarDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 }),
  });

  return (
    <div className="p-4 md:p-6 bg-slate-900 min-h-screen text-white">
      {/* HEADER RESPONSIVO */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="bg-orange-600 p-3 rounded-2xl shadow-lg shadow-orange-900/20 shrink-0">
            <CalendarIcon size={24} />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black uppercase italic leading-none">
              {isCliente ? "Mis Citas" : "Agenda de Taller"}
            </h1>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Gestión de Turnos Online</p>
          </div>
        </div>

        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <div className="flex items-center bg-slate-800 rounded-2xl p-1 border border-slate-700 shadow-inner">
            <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2 hover:bg-slate-700 rounded-xl transition-colors text-orange-500"><ChevronLeft size={20}/></button>
            <span className="px-3 font-black text-[10px] md:text-xs uppercase w-28 md:w-32 text-center">{format(currentDate, "MMMM yyyy", { locale: es })}</span>
            <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2 hover:bg-slate-700 rounded-xl transition-colors text-orange-500"><ChevronRight size={20}/></button>
          </div>

          <button 
            onClick={() => { setPreselectedDate(format(new Date(), "yyyy-MM-dd")); setIsModalOpen(true); }} 
            className="bg-orange-600 hover:bg-orange-500 p-3 md:px-6 md:py-3 rounded-2xl font-black text-[10px] uppercase flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-orange-900/20"
          >
            <Plus size={18} /> <span className="hidden sm:inline">{isCliente ? "Pedir Turno" : "Nuevo Turno"}</span>
          </button>
        </div>
      </div>

      {/* CALENDARIO / VISTA AGENDA */}
      <div className="bg-slate-800 rounded-[2.5rem] border border-slate-700 shadow-2xl overflow-hidden">
        {/* DÍAS DE LA SEMANA (Solo en Desktop) */}
        <div className="hidden md:grid grid-cols-7 bg-slate-900/50 border-b border-slate-700">
          {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map(d => (
            <div key={d} className="py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">{d}</div>
          ))}
        </div>

        {/* CUADRÍCULA DE DÍAS */}
        <div className="grid grid-cols-4 md:grid-cols-7">
          {calendarDays.map((day) => {
            const dayStr = format(day, "yyyy-MM-dd");
            const turns = appointments.filter(ap => ap.date === dayStr);
            const isOutside = format(day, "MM") !== format(currentDate, "MM");

            return (
              <button 
                key={dayStr} 
                onClick={() => { setSelectedDay(dayStr); setPreselectedDate(dayStr); }} 
                className={`min-h-[80px] md:min-h-[120px] p-2 md:p-3 border-r border-b border-slate-700/50 text-left transition-all relative group
                  ${isOutside ? "opacity-20 grayscale" : "hover:bg-slate-700/30"}
                  ${isToday(day) ? "bg-orange-500/5" : ""}
                `}
              >
                <span className={`text-[10px] md:text-xs font-black ${isToday(day) ? "text-orange-500" : "text-slate-500"}`}>
                  {format(day, "d")}
                </span>
                
                <div className="mt-2 space-y-1 overflow-hidden">
                  {turns.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {/* Móvil: Solo puntos de color */}
                      <div className="flex md:hidden gap-1">
                        {turns.slice(0, 3).map(t => (
                          <div key={t.id} className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                        ))}
                        {turns.length > 3 && <div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div>}
                      </div>
                      
                      {/* Desktop: Badges de texto */}
                      <div className="hidden md:block w-full space-y-1">
                        {turns.slice(0, 2).map(t => (
                          <div key={t.id} className="text-[7px] truncate px-1.5 py-1 rounded-lg bg-slate-950/80 text-orange-400 font-bold uppercase border border-slate-800">
                            {t.time?.substring(0,5)} {isCliente ? "OCUPADO" : (t.clients?.name || 'Turno')}
                          </div>
                        ))}
                        {turns.length > 2 && (
                          <div className="text-[7px] text-slate-500 font-bold uppercase pl-1">
                            + {turns.length - 2} más
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* MODAL DE DETALLE DE DÍA (RESPONSIVO) */}
      {selectedDay && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-end md:items-center justify-center z-50 p-0 md:p-4">
          <div className="bg-slate-900 border-t md:border border-slate-700 rounded-t-[2.5rem] md:rounded-[2.5rem] w-full max-w-md shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h2 className="font-black uppercase italic text-lg leading-none">Turnos del Día</h2>
                <p className="text-[10px] text-orange-500 font-bold mt-1 uppercase">{format(new Date(selectedDay + 'T12:00:00'), "EEEE d 'de' MMMM", { locale: es })}</p>
              </div>
              <button onClick={() => setSelectedDay(null)} className="p-2 text-slate-500 hover:text-white"><X size={28} /></button>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {appointments.filter(ap => ap.date === selectedDay).length === 0 ? (
                <div className="text-center py-10 opacity-30">
                  <AlertCircle size={40} className="mx-auto mb-2" />
                  <p className="text-[10px] font-black uppercase">No hay turnos agendados</p>
                </div>
              ) : (
                appointments.filter(ap => ap.date === selectedDay).map(ap => (
                  <div key={ap.id} className={`p-5 rounded-3xl border relative overflow-hidden group transition-all ${getStatusStyles(ap.status)}`}>
                    <div className="flex justify-between items-start mb-3">
                       <div className="flex items-center gap-2 text-white bg-slate-950/50 px-3 py-1 rounded-full border border-white/10">
                          <Clock size={12} className="text-orange-500" />
                          <span className="text-[10px] font-black italic">{ap.time?.substring(0,5)} HS</span>
                       </div>
                       {!isCliente && (
                         <div className="flex gap-2">
                           <button onClick={() => enviarWhatsApp(ap, 'confirmar')} className="p-2 bg-emerald-500 text-white rounded-xl shadow-lg active:scale-90 transition-all"><MessageCircle size={16}/></button>
                         </div>
                       )}
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-black uppercase text-white tracking-tight flex items-center gap-2">
                        <User size={14} className="text-orange-500" /> {isCliente ? "Mi Turno" : ap.clients?.name}
                      </p>
                      <p className="text-[10px] font-bold uppercase opacity-80 flex items-center gap-2">
                        <Car size={14} className="text-orange-500" /> {ap.vehicles?.plate || 'Sin Patente'}
                      </p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/5">
                      <p className="text-[10px] italic leading-relaxed opacity-70">"{ap.reason || 'Sin descripción'}"</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="p-6 bg-slate-950/50 border-t border-slate-800">
               <button 
                onClick={() => { setIsModalOpen(true); setSelectedDay(null); }}
                className="w-full bg-orange-600 py-4 rounded-2xl font-black uppercase italic text-xs tracking-[0.2em]"
               >
                 Añadir Turno Aquí
               </button>
            </div>
          </div>
        </div>
      )}

      <NewAppointmentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        preselectedDate={preselectedDate || undefined} 
        onCreated={fetchAppointments} 
      />
    </div>
  );
}