import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { X, Calendar, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface NewAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  preselectedDate?: string;
}

export default function NewAppointmentModal({ isOpen, onClose, onCreated, preselectedDate }: NewAppointmentModalProps) {
  const [clients, setClients] = useState<any[]>([]);
  const [allVehicles, setAllVehicles] = useState<any[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<any[]>([]);
  
  const [clientId, setClientId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");
  const [reason, setReason] = useState("");
  
  const [isSending, setIsSending] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    if (preselectedDate) setDate(preselectedDate);
  }, [preselectedDate]);

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        // Cargar clientes incluyendo el teléfono para WhatsApp
        const { data: cData } = await supabase
          .from("clients")
          .select("id, name, phone")
          .order("name");
        setClients(cData || []);

        const { data: vData } = await supabase
          .from("vehicles")
          .select("id, plate, client_id");
        setAllVehicles(vData || []);
      };
      fetchData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (clientId) {
      const filtered = allVehicles.filter(v => v.client_id === clientId);
      setFilteredVehicles(filtered);
      if (filtered.length === 1) {
        setVehicleId(filtered[0].id);
      } else {
        setVehicleId("");
      }
    } else {
      setFilteredVehicles([]);
      setVehicleId("");
    }
  }, [clientId, allVehicles]);

  // --- FUNCIÓN PARA ENVIAR WHATSAPP AL CREAR ---
  const enviarWhatsAppTurno = (clientName: string, phone: string, plate: string) => {
    if (!phone) return;

    const fechaTurno = format(new Date(date + "T00:00:00"), "EEEE dd 'de' MMMM", { locale: es });
    const ubicacionMaps = "https://maps.app.goo.gl/yr7s3hEyzn45cW9h7?g_st=iw"; // 📍 REEMPLAZA ESTO CON TU LINK REAL
    const mensaje = `*TURNO AGENDADO* 📅%0A%0A` +
      `Hola *${clientName}*, te confirmamos tu turno en el taller:%0A%0A` +
      `🗓️ *Día:* ${fechaTurno}%0A` +
      `⏰ *Hora:* ${time} hs%0A` +
      `🚗 *Vehículo:* ${plate.toUpperCase()}%0A` +
      `🔧 *Motivo:* ${reason}%0A%0A` +
      `📍 *Cómo llegar:* ${ubicacionMaps}%0A%0A` + // <-- Ubicación añadida
      `¡Te esperamos!`;

    const telLimpio = phone.replace(/\D/g, "");
    window.open(`https://wa.me/${telLimpio}?text=${mensaje}`, '_blank');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !vehicleId || !date || !reason) {
      setNotification({ type: 'error', message: "Por favor, completa todos los campos" });
      return;
    }

    setIsSending(true);

    try {
      const { error } = await supabase
        .from("appointments")
        .insert([{ 
          client_id: clientId, 
          vehicle_id: vehicleId, 
          date, 
          time, 
          reason, 
          status: "pendiente" 
        }]);

      if (error) throw error;

      // Obtener datos para WhatsApp antes de limpiar el estado
      const clienteSel = clients.find(c => c.id === clientId);
      const vehiculoSel = filteredVehicles.find(v => v.id === vehicleId);

      setNotification({
        type: 'success',
        message: "¡Turno agendado correctamente!"
      });

      // Preguntar si quiere enviar WhatsApp
      if (clienteSel?.phone && confirm("¿Deseas enviar la confirmación por WhatsApp ahora?")) {
        enviarWhatsAppTurno(clienteSel.name, clienteSel.phone, vehiculoSel?.plate || "");
      }

      setTimeout(() => {
        onCreated(); 
        onClose();
        setNotification(null);
        setClientId(""); 
        setVehicleId(""); 
        setReason("");
      }, 1000);

    } catch (err: any) {
      setNotification({ type: 'error', message: "Error al guardar: " + err.message });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[70] p-4">
      {notification && (
        <div className={`fixed top-10 left-1/2 -translate-x-1/2 flex items-center gap-3 px-8 py-4 rounded-2xl shadow-2xl z-[80] animate-in slide-in-from-top duration-300 ${
          notification.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
        } text-white`}>
          {notification.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
          <span className="font-black text-xs uppercase tracking-widest">{notification.message}</span>
        </div>
      )}

      <div className="bg-slate-800 border border-slate-700 rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
        <div className="bg-slate-900/50 p-6 border-b border-slate-700 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2 italic uppercase tracking-tighter">
              <Calendar className="text-orange-500" size={20} /> 
              Nuevo Turno
            </h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Programación de servicio</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full transition-colors text-slate-500 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] block mb-2 ml-1">Seleccionar Cliente</label>
              <select 
                value={clientId} 
                onChange={e => setClientId(e.target.value)} 
                required 
                className="w-full bg-slate-900 border border-slate-700 p-4 rounded-2xl text-sm text-white outline-none focus:border-orange-500 transition-all cursor-pointer appearance-none"
              >
                <option value="">Buscar cliente...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] block mb-2 ml-1">Vehículo (Placa)</label>
              <select 
                value={vehicleId} 
                onChange={e => setVehicleId(e.target.value)} 
                required 
                disabled={!clientId}
                className="w-full bg-slate-900 border border-slate-700 p-4 rounded-2xl text-sm text-white outline-none focus:border-orange-500 disabled:opacity-30 transition-all cursor-pointer appearance-none"
              >
                <option value="">{clientId ? "Seleccionar placa..." : "Primero elige un cliente"}</option>
                {filteredVehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.plate.toUpperCase()}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] block mb-2 ml-1">Fecha</label>
                <input 
                  type="date" 
                  value={date} 
                  onChange={e => setDate(e.target.value)} 
                  required 
                  className="w-full bg-slate-900 border border-slate-700 p-4 rounded-2xl text-sm text-white outline-none focus:border-orange-500 transition-all" 
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] block mb-2 ml-1">Hora</label>
                <input 
                  type="time" 
                  value={time} 
                  onChange={e => setTime(e.target.value)} 
                  required 
                  className="w-full bg-slate-900 border border-slate-700 p-4 rounded-2xl text-sm text-white outline-none focus:border-orange-500 transition-all" 
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] block mb-2 ml-1">Motivo del Servicio</label>
              <textarea 
                placeholder="Ej: Cambio de aceite y filtros..." 
                value={reason} 
                onChange={e => setReason(e.target.value)} 
                required 
                className="w-full bg-slate-900 border border-slate-700 p-4 rounded-2xl text-sm text-white outline-none focus:border-orange-500 h-28 resize-none transition-all" 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSending || !!notification}
            className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest shadow-lg shadow-orange-900/20"
          >
            {isSending ? <Loader2 className="animate-spin" /> : "AGENDAR AHORA"}
          </button>
        </form>
      </div>
    </div>
  );
}