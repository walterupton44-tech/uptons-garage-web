import { useEffect, useState, useCallback } from "react";
import { supabase } from "../supabase";
import { 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  format, 
  addMonths, 
  subMonths, 
  isToday, 
  startOfWeek, 
  endOfWeek 
} from "date-fns";
import { es } from "date-fns/locale";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  User, 
  Car, 
  Plus, 
  X, 
  AlertCircle,
  MessageCircle 
} from "lucide-react";
import NewAppointmentModal from "./NewAppointmentModal";

interface Appointment {
  id: string;
  client_id: string;
  vehicle_id: string;
  date: string;
  time: string;
  reason: string;
  status: string;
  clients?: { name: string; phone: string }; // Incluimos phone aquí
  vehicles?: { plate: string };
}

const getStatusStyles = (status: string) => {
  switch (status) {
    case "pendiente": return "bg-amber-500/20 text-amber-500 border-amber-500/30";
    case "confirmado": return "bg-emerald-500/20 text-emerald-500 border-emerald-500/30";
    case "completado": return "bg-blue-500/20 text-blue-500 border-blue-500/30";
    case "cancelado": return "bg-red-500/20 text-red-400 border-red-500/30";
    default: return "bg-slate-500/20 text-slate-400 border-slate-500/30";
  }
};

export default function AppointmentsCalendar() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [preselectedDate, setPreselectedDate] = useState<string | null>(null);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          clients ( name, phone ), 
          vehicles ( plate )
        `)
        .order("time", { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (err) {
      console.error("Error fetching appointments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // --- LÓGICA DE WHATSAPP ---
  const enviarConfirmacionWhatsApp = (ap: Appointment) => {
    const telefono = ap.clients?.phone;
    if (!telefono) {
      alert("El cliente no tiene un teléfono registrado.");
      return;
    }

    const fechaTurno = format(new Date(ap.date + "T00:00:00"), "EEEE dd 'de' MMMM", { locale: es });
    const mensaje = `*CONFIRMACIÓN DE TURNO* 📅%0A%0A` +
      `Hola *${ap.clients?.name}*, te confirmamos tu turno en el taller:%0A%0A` +
      `🗓️ *Día:* ${fechaTurno}%0A` +
      `⏰ *Hora:* ${ap.time.substring(0, 5)} hs%0A` +
      `🚗 *Vehículo:* ${ap.vehicles?.plate || "Registrado"}%0A` +
      `🔧 *Motivo:* ${ap.reason}%0A%0A` +
      `¡Te esperamos! Por favor, avísanos si tienes algún inconveniente.`;

    const telLimpio = telefono.replace(/\D/g, "");
    window.open(`https://wa.me/${telLimpio}?text=${mensaje}`, '_blank');
  };

const enviarRecordatorioWhatsApp = (ap: Appointment) => {
  const telefono = ap.clients?.phone;
  if (!telefono) {
    alert("El cliente no tiene un teléfono registrado.");
    return;
  }

  const mensaje = `*RECORDATORIO DE TURNO* 🔔%0A%0A` +
    `Hola *${ap.clients?.name}*, te recordamos que tienes un turno programado para *MAÑANA*:%0A%0A` +
    `⏰ *Hora:* ${ap.time.substring(0, 5)} hs%0A` +
    `🚗 *Vehículo:* ${ap.vehicles?.plate || "Registrado"}%0A%0A` +
    `¡Te esperamos! Si no puedes asistir, por favor avísanos para reasignar el lugar. 🙏`;

  const telLimpio = telefono.replace(/\D/g, "");
  window.open(`https://wa.me/${telLimpio}?text=${mensaje}`, '_blank');
};

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({
    start: startOfWeek(monthStart, { weekStartsOn: 1 }),
    end: endOfWeek(monthEnd, { weekStartsOn: 1 }),
  });

  const getWeeklyStats = () => {
    const now = new Date();
    const start = startOfWeek(now, { weekStartsOn: 1 });
    const end = endOfWeek(now, { weekStartsOn: 1 });
    const dias = [
      { corta: "Lun", larga: "Lunes" },
      { corta: "Mar", larga: "Martes" },
      { corta: "Mié", larga: "Miércoles" },
      { corta: "Jue", larga: "Jueves" },
      { corta: "Vie", larga: "Viernes" },
      { corta: "Sáb", larga: "Sábado" },
      { corta: "Dom", larga: "Domingo" }
    ];

    return dias.map((dia, index) => {
      const count = appointments.filter(ap => {
        const d = new Date(ap.date + "T00:00:00");
        const dayIdx = d.getDay() === 0 ? 6 : d.getDay() - 1;
        return dayIdx === index && d >= start && d <= end;
      }).length;
      return { ...dia, count };
    });
  };

  const weeklyStats = getWeeklyStats();
  const totalWeekly = weeklyStats.reduce((acc, curr) => acc + curr.count, 0);

  if (loading && appointments.length === 0) {
    return <div className="h-screen flex items-center justify-center text-white font-black animate-pulse uppercase tracking-[0.3em] bg-slate-900">Sincronizando Agenda...</div>;
  }

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-white font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-amber-600 p-2 rounded-xl shadow-lg shadow-amber-900/40 transform -rotate-2">
            <CalendarIcon size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter italic">Agenda de Turnos</h1>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">
              {format(currentDate, "MMMM yyyy", { locale: es })}
            </p>
          </div>
        </div>

        <div className="flex items-center bg-slate-800 rounded-2xl p-1 border border-slate-700 shadow-xl">
          <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2 hover:bg-slate-700 rounded-xl transition-colors text-amber-500">
            <ChevronLeft size={20} />
          </button>
          <span className="px-4 font-black text-xs uppercase min-w-[140px] text-center">
            {format(currentDate, "MMMM", { locale: es })}
          </span>
          <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2 hover:bg-slate-700 rounded-xl transition-colors text-amber-500">
            <ChevronRight size={20} />
          </button>
        </div>

        <button 
          onClick={() => { setPreselectedDate(format(new Date(), "yyyy-MM-dd")); setIsModalOpen(true); }}
          className="bg-amber-600 hover:bg-amber-500 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-amber-900/40 transition-all flex items-center gap-2"
        >
          <Plus size={18} /> AGENDAR
        </button>
      </div>

      {/* STATS */}
      <div className="mb-8 grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-slate-800/50 border border-slate-700 p-6 rounded-[2rem]">
          <div className="flex justify-between items-end h-32 gap-4">
            {weeklyStats.map((stat, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                <div className="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl h-full relative overflow-hidden">
                  <div 
                    className={`absolute bottom-0 w-full transition-all duration-1000 ease-out ${
                      stat.count >= 6 ? 'bg-red-500' : stat.count >= 4 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ height: `${Math.min((stat.count / 8) * 100, 100)}%` }}
                  />
                  {stat.count > 0 && (
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-white drop-shadow-md">
                      {stat.count}
                    </span>
                  )}
                </div>
                <span className="text-[9px] font-black text-slate-500 uppercase group-hover:text-amber-500">
                  {stat.larga}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-orange-700 rounded-[2rem] p-6 flex flex-col justify-center shadow-xl shadow-amber-900/30 border border-white/10">
          <h3 className="text-white/80 text-[10px] font-black uppercase tracking-widest mb-1">Total Semanal</h3>
          <p className="text-6xl font-black text-white italic tracking-tighter">{totalWeekly}</p>
          <div className="mt-2 w-full h-1 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white/60" style={{ width: `${Math.min((totalWeekly/30)*100, 100)}%` }} />
          </div>
        </div>
      </div>

      {/* GRID CALENDARIO */}
      <div className="bg-slate-800 rounded-[2.5rem] border border-slate-700 overflow-hidden shadow-2xl">
        <div className="grid grid-cols-7 border-b border-slate-700 bg-slate-900/80">
          {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map(dia => (
            <div key={dia} className="py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{dia}</div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {calendarDays.map((day) => {
            const dayStr = format(day, "yyyy-MM-dd");
            const turns = appointments.filter(ap => ap.date === dayStr);
            const isOutsideMonth = format(day, "MM") !== format(currentDate, "MM");

            return (
              <button
                key={dayStr}
                onClick={() => { setSelectedDay(dayStr); setPreselectedDate(dayStr); }}
                className={`min-h-[120px] p-3 border-r border-b border-slate-700/50 text-left transition-all relative group
                  ${isOutsideMonth ? "bg-slate-900/30 opacity-20" : "bg-slate-800 hover:bg-slate-700/40"}
                  ${selectedDay === dayStr ? "bg-amber-500/10" : ""}
                `}
              >
                <div className="flex justify-between items-start">
                  <span className={`text-[10px] font-black ${isToday(day) ? "bg-amber-600 text-white px-2 py-1 rounded-lg shadow-lg" : "text-slate-500"}`}>
                    {format(day, "d")}
                  </span>
                  {turns.length > 0 && !isOutsideMonth && (
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                  )}
                </div>
                
                <div className="mt-3 space-y-1">
                  {turns.slice(0, 2).map(t => (
                    <div key={t.id} className="text-[7px] truncate px-2 py-1 rounded-lg bg-slate-950/80 border border-slate-700 text-amber-500 font-black uppercase">
                      {t.time.substring(0,5)} • {t.clients?.name}
                    </div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* MODAL TURNOS DEL DÍA */}
      {selectedDay && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden transform animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-900/50 p-6 border-b border-slate-700 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Detalle del Día</h2>
                <p className="text-amber-500 text-[10px] font-black uppercase tracking-[0.2em]">
                  {format(new Date(selectedDay + "T00:00:00"), "EEEE dd MMMM", { locale: es })}
                </p>
              </div>
              <button onClick={() => setSelectedDay(null)} className="p-2 hover:bg-slate-700 rounded-full text-slate-500"><X size={20} /></button>
            </div>

            <div className="p-6 space-y-4 max-h-[450px] overflow-y-auto">
              {appointments.filter(ap => ap.date === selectedDay).map(ap => (
                <div key={ap.id} className={`p-5 rounded-3xl border ${getStatusStyles(ap.status || 'pendiente')} shadow-lg`}>
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="opacity-50" />
                      <span className="text-lg font-black italic">{ap.time.substring(0,5)}</span>
                    </div>
                    
                    {/* BOTÓN WHATSAPP EN EL DETALLE */}
                    <div className="flex gap-2">
                      {/* Botón de Recordatorio (Campana) */}
  <button 
    onClick={() => enviarRecordatorioWhatsApp(ap)}
    className="p-2 bg-blue-500/20 hover:bg-blue-500 text-blue-500 hover:text-white rounded-xl transition-all border border-blue-500/30"
    title="Enviar Recordatorio de Mañana"
  >
    <Clock size={14} />
  </button>
                      <button 
                        onClick={() => enviarConfirmacionWhatsApp(ap)}
                        className="p-2 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-500 hover:text-white rounded-xl transition-all border border-emerald-500/30"
                        title="Enviar confirmación"
                      >
                        <MessageCircle size={14} />
                      </button>
                      <span className="text-[8px] font-black uppercase px-3 py-1 rounded-full bg-black/20 border border-current">{ap.status}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-sm font-black text-white uppercase tracking-tighter">
                      <User size={14} className="text-slate-400" /> {ap.clients?.name}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 font-bold uppercase">
                      <Car size={14} /> {ap.vehicles?.plate || "SIN PLACA"}
                    </div>
                    <div className="mt-3 p-3 bg-black/10 rounded-xl text-[11px] italic text-slate-300 border-l-2 border-current">
                      "{ap.reason}"
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 bg-slate-900/50 border-t border-slate-700 flex gap-3">
              <button onClick={() => setSelectedDay(null)} className="flex-1 bg-slate-700 text-white font-black py-4 rounded-2xl hover:bg-slate-600 uppercase text-[10px] tracking-widest">Cerrar</button>
              <button onClick={() => { setIsModalOpen(true); setSelectedDay(null); }} className="flex-1 bg-amber-600 text-white font-black py-4 rounded-2xl hover:bg-amber-500 uppercase text-[10px] tracking-widest">Nuevo Turno</button>
            </div>
          </div>
        </div>
      )}

      <NewAppointmentModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setPreselectedDate(null); }} 
        preselectedDate={preselectedDate}
        onCreated={fetchAppointments}
      />
    </div>
  );
}