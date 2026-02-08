import { useEffect, useState, useCallback } from "react";
import { supabase } from "../supabase";
import { useAuth } from "../contexts/AuthContext";
import { startOfMonth, endOfMonth, eachDayOfInterval, format, addMonths, subMonths, isToday, startOfWeek, endOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, User, Car, Plus, X, MessageCircle } from "lucide-react";
import NewAppointmentModal from "./NewAppointmentModal";

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

      // SEGURIDAD: Solo mostramos los turnos propios si es cliente
      if (isCliente) {
        if (currentUser?.client_id) {
          query = query.eq("client_id", currentUser.client_id);
        } else {
          // Si no tiene ID de cliente, no puede ver nada por seguridad
          setAppointments([]);
          setLoading(false);
          return;
        }
      }

      const { data, error } = await query.order("time", { ascending: true });
      if (error) throw error;
      setAppointments(data || []);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) fetchAppointments();
  }, [currentUser]);

  // Funciones de WhatsApp (Solo accesibles para Admin)
  const enviarWhatsApp = (ap: any, tipo: 'confirmar' | 'recordar') => {
    const tel = ap.clients?.phone;
    if (!tel) return alert("Sin teléfono");
    const msg = tipo === 'confirmar' 
      ? `Confirmamos tu turno para el ${ap.date} a las ${ap.time}`
      : `Recordatorio de tu turno para mañana a las ${ap.time}`;
    window.open(`https://wa.me/${tel.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const calendarDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 }),
  });

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-white">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <div className="bg-orange-600 p-2 rounded-xl"><CalendarIcon size={24} /></div>
          <h1 className="text-2xl font-black uppercase italic">{isCliente ? "Mis Turnos" : "Agenda Taller"}</h1>
        </div>

        <div className="flex items-center bg-slate-800 rounded-2xl p-1 border border-slate-700">
          <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2 text-orange-500"><ChevronLeft /></button>
          <span className="px-4 font-black text-xs uppercase">{format(currentDate, "MMMM yyyy", { locale: es })}</span>
          <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2 text-orange-500"><ChevronRight /></button>
        </div>

        <button onClick={() => { setPreselectedDate(format(new Date(), "yyyy-MM-dd")); setIsModalOpen(true); }} className="bg-orange-600 px-6 py-3 rounded-2xl font-black text-xs uppercase flex items-center gap-2">
          <Plus size={18} /> {isCliente ? "PEDIR TURNO" : "NUEVO TURNO"}
        </button>
      </div>

      <div className="bg-slate-800 rounded-[2.5rem] border border-slate-700 overflow-hidden">
        <div className="grid grid-cols-7 bg-slate-900/50">
          {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map(d => (
            <div key={d} className="py-4 text-center text-[10px] font-black text-slate-500 uppercase">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {calendarDays.map((day) => {
            const dayStr = format(day, "yyyy-MM-dd");
            const turns = appointments.filter(ap => ap.date === dayStr);
            const isOutside = format(day, "MM") !== format(currentDate, "MM");

            return (
              <button key={dayStr} onClick={() => { setSelectedDay(dayStr); setPreselectedDate(dayStr); }} className={`min-h-[100px] p-2 border-r border-b border-slate-700/50 text-left ${isOutside ? "opacity-20" : ""}`}>
                <span className={`text-[10px] font-black ${isToday(day) ? "text-orange-500" : "text-slate-500"}`}>{format(day, "d")}</span>
                <div className="mt-2 space-y-1">
                  {turns.slice(0, 3).map(t => (
                    <div key={t.id} className="text-[7px] truncate px-1 py-1 rounded bg-slate-950 text-orange-400 font-bold uppercase">
                      {t.time?.substring(0,5)} {isCliente ? "OCUPADO" : (t.clients?.name || 'Turno')}
                    </div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selectedDay && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-[2rem] w-full max-w-md">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center">
              <h2 className="font-black uppercase italic">Turnos {selectedDay}</h2>
              <button onClick={() => setSelectedDay(null)}><X /></button>
            </div>
            <div className="p-6 space-y-4">
              {appointments.filter(ap => ap.date === selectedDay).map(ap => (
                <div key={ap.id} className={`p-4 rounded-2xl border ${getStatusStyles(ap.status)}`}>
                   <div className="flex justify-between font-black italic mb-2">
                     <span>{ap.time?.substring(0,5)} HS</span>
                     {!isCliente && (
                       <div className="flex gap-2">
                         <button onClick={() => enviarWhatsApp(ap, 'confirmar')} className="p-1 bg-emerald-500/20 rounded"><MessageCircle size={14}/></button>
                       </div>
                     )}
                   </div>
                   <p className="text-xs font-bold uppercase">{isCliente ? "Mi Turno" : ap.clients?.name}</p>
                   <p className="text-[10px] opacity-70">{ap.vehicles?.plate}</p>
                   <p className="mt-2 text-[10px] italic">"{ap.reason}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <NewAppointmentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} preselectedDate={preselectedDate || undefined} onCreated={fetchAppointments} />
    </div>
  );
}