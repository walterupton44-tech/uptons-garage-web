import { useEffect, useState, useCallback } from "react";
import { supabase } from "../supabase";
import { useAuth } from "../contexts/AuthContext";
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
import { Appointment } from "../types";
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

// 1. FUNCIONES AUXILIARES (Fuera del componente para que no se pierdan)
const getStatusStyles = (status: string) => {
  switch (status?.toLowerCase()) {
    case "pendiente": return "bg-amber-500/20 text-amber-500 border-amber-500/30";
    case "confirmado": return "bg-emerald-500/20 text-emerald-500 border-emerald-500/30";
    case "completado": return "bg-blue-500/20 text-blue-500 border-blue-500/30";
    case "cancelado": return "bg-red-500/20 text-red-400 border-red-500/30";
    default: return "bg-slate-500/20 text-slate-400 border-slate-500/30";
  }
};

export default function AppointmentsCalendar() {
  const { currentUser } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]); // Usamos any[] temporalmente para evitar choques con types.ts
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [preselectedDate, setPreselectedDate] = useState<string | null>(null);

  const isAdmin = currentUser?.role?.toLowerCase() === 'admin';
  const isCliente = currentUser?.role?.toLowerCase() === 'cliente' || currentUser?.role === 'CLIENT';

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("appointments")
        .select(`
          *,
          clients ( name, phone ), 
          vehicles ( plate )
        `);

      if (isCliente && currentUser?.client_id) {
        query = query.eq("client_id", currentUser.client_id);
      }

      const { data, error } = await query.order("time", { ascending: true });
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
  }, [currentUser]);

  // 2. FUNCIONES DE WHATSAPP RE-INSERTADAS
  const enviarConfirmacionWhatsApp = (ap: any) => {
    const telefono = ap.clients?.phone;
    if (!telefono) return alert("El cliente no tiene teléfono.");
    const fechaTurno = format(new Date(ap.date + "T00:00:00"), "EEEE dd 'de' MMMM", { locale: es });
    const mensaje = `*CONFIRMACIÓN DE TURNO* 📅%0A%0A` +
      `Hola *${ap.clients?.name}*, confirmamos tu turno para el taller el ${fechaTurno} a las ${ap.time.substring(0, 5)} hs.`;
    window.open(`https://wa.me/${telefono.replace(/\D/g, "")}?text=${mensaje}`, '_blank');
  };

  const enviarRecordatorioWhatsApp = (ap: any) => {
    const telefono = ap.clients?.phone;
    if (!telefono) return alert("El cliente no tiene teléfono.");
    const mensaje = `*RECORDATORIO* 🔔%0A%0A` +
      `Hola *${ap.clients?.name}*, te recordamos tu turno de mañana a las ${ap.time.substring(0, 5)} hs.`;
    window.open(`https://wa.me/${telefono.replace(/\D/g, "")}?text=${mensaje}`, '_blank');
  };

  // 3. LÓGICA DEL CALENDARIO (Para arreglar el error de calendarDays)
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
    const dias = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

    return dias.map((dia, index) => {
      const count = appointments.filter(ap => {
        const d = new Date(ap.date + "T00:00:00");
        const dayIdx = d.getDay() === 0 ? 6 : d.getDay() - 1;
        return dayIdx === index && d >= start && d <= end;
      }).length;
      return { larga: dia, count };
    });
  };

  const weeklyStats = getWeeklyStats();
  const totalWeekly = weeklyStats.reduce((acc, curr) => acc + curr.count, 0);

  if (loading && appointments.length === 0) {
    return <div className="h-screen flex items-center justify-center bg-slate-900 text-white font-black animate-pulse uppercase">Cargando Agenda...</div>;
  }

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-white font-sans">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-amber-600 p-2 rounded-xl shadow-lg transform -rotate-2">
            <CalendarIcon size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter italic">
              {isCliente ? "Mis Turnos" : "Agenda de Turnos"}
            </h1>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">
              {format(currentDate, "MMMM yyyy", { locale: es })}
            </p>
          </div>
        </div>

        <div className="flex items-center bg-slate-800 rounded-2xl p-1 border border-slate-700 shadow-xl">
          <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2 text-amber-500 hover:bg-slate-700 rounded-xl transition-colors">
            <ChevronLeft size={20} />
          </button>
          <span className="px-4 font-black text-xs uppercase min-w-[140px] text-center">
            {format(currentDate, "MMMM", { locale: es })}
          </span>
          <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2 text-amber-500 hover:bg-slate-700 rounded-xl transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>

        <button 
          onClick={() => { setPreselectedDate(format(new Date(), "yyyy-MM-dd")); setIsModalOpen(true); }}
          className="bg-amber-600 hover:bg-amber-500 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg transition-all flex items-center gap-2"
        >
          <Plus size={18} /> {isCliente ? "SOLICITAR TURNO" : "AGENDAR"}
        </button>
      </div>

      {/* STATS (Solo Admin) */}
      {!isCliente && (
        <div className="mb-8 grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 bg-slate-800/50 border border-slate-700 p-6 rounded-[2rem]">
            <div className="flex justify-between items-end h-32 gap-4">
              {weeklyStats.map((stat, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-3">
                  <div className="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl h-full relative overflow-hidden">
                    <div 
                      className="absolute bottom-0 w-full bg-amber-500 transition-all duration-1000" 
                      style={{ height: `${Math.min((stat.count / 8) * 100, 100)}%` }} 
                    />
                  </div>
                  <span className="text-[9px] font-black text-slate-500 uppercase">{stat.larga}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gradient-to-br from-amber-500 to-orange-700 rounded-[2rem] p-6 flex flex-col justify-center">
             <h3 className="text-white/80 text-[10px] font-black uppercase mb-1">Total Semanal</h3>
             <p className="text-6xl font-black text-white italic">{totalWeekly}</p>
          </div>
        </div>
      )}

      {/* GRID CALENDARIO */}
      <div className="bg-slate-800 rounded-[2.5rem] border border-slate-700 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-slate-700 bg-slate-900/80">
          {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map(dia => (
            <div key={dia} className="py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">{dia}</div>
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
                className={`min-h-[120px] p-3 border-r border-b border-slate-700/50 text-left transition-all ${
                  isOutsideMonth ? "bg-slate-900/30 opacity-20" : "bg-slate-800 hover:bg-slate-700/40"
                } ${selectedDay === dayStr ? "bg-amber-500/10" : ""}`}
              >
                <span className={`text-[10px] font-black ${isToday(day) ? "bg-amber-600 text-white px-2 py-1 rounded-lg" : "text-slate-500"}`}>
                  {format(day, "d")}
                </span>
                <div className="mt-3 space-y-1">
                  {turns.slice(0, 2).map(t => (
                    <div key={t.id} className="text-[7px] truncate px-2 py-1 rounded-lg bg-slate-950/80 border border-slate-700 text-amber-500 font-black uppercase">
                      {t.time.substring(0,5)} • {isCliente ? "MI TURNO" : (t.clients?.name || 'Cliente')}
                    </div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* MODAL DETALLE DEL DÍA */}
      {selectedDay && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-slate-900/50 p-6 border-b border-slate-700 flex justify-between items-center">
              <h2 className="text-xl font-black text-white uppercase italic">Detalle {format(new Date(selectedDay + "T00:00:00"), "dd/MM", { locale: es })}</h2>
              <button onClick={() => setSelectedDay(null)} className="p-2 text-slate-500 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[450px] overflow-y-auto">
              {appointments.filter(ap => ap.date === selectedDay).map(ap => (
                <div key={ap.id} className={`p-5 rounded-3xl border ${getStatusStyles(ap.status)} shadow-lg`}>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-lg font-black italic">{ap.time.substring(0,5)} hs</span>
                    {!isCliente && (
                      <div className="flex gap-2">
                        <button onClick={() => enviarRecordatorioWhatsApp(ap)} className="p-2 bg-blue-500/20 rounded-xl hover:bg-blue-500 hover:text-white transition-all"><Clock size={14} /></button>
                        <button onClick={() => enviarConfirmacionWhatsApp(ap)} className="p-2 bg-emerald-500/20 rounded-xl hover:bg-emerald-500 hover:text-white transition-all"><MessageCircle size={14} /></button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-black uppercase flex items-center gap-2"><User size={14}/> {isCliente ? "Mi Turno" : (ap.clients?.name || 'S/N')}</p>
                    <p className="text-xs text-slate-400 font-bold uppercase flex items-center gap-2"><Car size={14}/> {ap.vehicles?.plate || "S/P"}</p>
                    <p className="mt-2 text-[11px] italic text-slate-300 bg-black/10 p-2 rounded-lg">"{ap.reason}"</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-6 bg-slate-900/50 border-t border-slate-700 flex gap-3">
              <button onClick={() => setSelectedDay(null)} className="flex-1 bg-slate-700 text-white font-black py-4 rounded-2xl uppercase text-[10px]">Cerrar</button>
              <button onClick={() => { setIsModalOpen(true); setSelectedDay(null); }} className="flex-1 bg-amber-600 text-white font-black py-4 rounded-2xl uppercase text-[10px]">Nuevo Turno</button>
            </div>
          </div>
        </div>
      )}

      <NewAppointmentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        preselectedDate={preselectedDate}
        onCreated={fetchAppointments}
      />
    </div>
  );
}