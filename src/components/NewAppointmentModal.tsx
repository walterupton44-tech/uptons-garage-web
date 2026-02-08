import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { X, Calendar, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useAuth } from "../contexts/AuthContext";

interface NewAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  preselectedDate?: string;
}

export default function NewAppointmentModal({ isOpen, onClose, onCreated, preselectedDate }: NewAppointmentModalProps) {
  const { currentUser } = useAuth();
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

  // Normalización de roles y obtención segura de IDs
  const userRole = currentUser?.role?.toLowerCase();
  const isCliente = userRole === 'cliente' || userRole === 'client';
  const effectiveClientId = currentUser?.client_id;

  useEffect(() => {
    if (preselectedDate) setDate(preselectedDate);
  }, [preselectedDate]);

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        // Carga de Clientes (Solo para Admin)
        if (!isCliente) {
          const { data: cData } = await supabase
            .from("clients")
            .select("id, name, phone")
            .order("name");
          setClients(cData || []);
        } else {
          setClientId(effectiveClientId || "");
        }

        // Carga de Vehículos filtrada por el rol desde la base de datos
        let vQuery = supabase.from("vehicles").select("id, plate, client_id");
        
        if (isCliente && effectiveClientId) {
          vQuery = vQuery.eq("client_id", effectiveClientId);
        }

        const { data: vData } = await vQuery;
        setAllVehicles(vData || []);
        
        if (isCliente && vData?.length === 1) {
          setVehicleId(vData[0].id);
        }
      };
      fetchData();
    }
  }, [isOpen, isCliente, effectiveClientId]);

  useEffect(() => {
    if (clientId) {
      const filtered = allVehicles.filter(v => v.client_id === clientId);
      setFilteredVehicles(filtered);
    }
  }, [clientId, allVehicles]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalClientId = isCliente ? effectiveClientId : clientId;
    
    if (!finalClientId || !vehicleId || !date || !reason) {
      setNotification({ type: 'error', message: "Completa todos los campos" });
      return;
    }

    setIsSending(true);
    try {
      const { error } = await supabase.from("appointments").insert([{ 
        client_id: finalClientId, 
        vehicle_id: vehicleId, 
        date, 
        time, 
        reason, 
        status: "pendiente" 
      }]);

      if (error) throw error;
      setNotification({ type: 'success', message: isCliente ? "Solicitud enviada!" : "Turno agendado!" });

      setTimeout(() => {
        onCreated(); 
        onClose();
        setNotification(null);
        setReason("");
      }, 1500);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[70] p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-slate-900/50 p-6 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-black text-white flex items-center gap-2 italic uppercase">
            <Calendar className="text-orange-500" size={20} /> 
            {isCliente ? "Solicitar Turno" : "Nuevo Turno"}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {notification && (
            <div className={`p-4 rounded-xl text-xs font-bold ${notification.type === 'success' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
              {notification.message}
            </div>
          )}

          {!isCliente ? (
            <div>
              <label className="text-[10px] text-slate-500 uppercase font-black mb-2 block ml-1">Seleccionar Cliente</label>
              <select value={clientId} onChange={e => setClientId(e.target.value)} required className="w-full bg-slate-900 border border-slate-700 p-4 rounded-2xl text-white outline-none focus:border-orange-500">
                <option value="">Buscar cliente...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>)}
              </select>
            </div>
          ) : (
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-orange-500/20">
              <label className="text-[10px] text-orange-500 uppercase font-black mb-1 block">Usuario</label>
              <p className="text-white font-bold italic uppercase">{currentUser?.name}</p>
            </div>
          )}

          <div>
            <label className="text-[10px] text-slate-500 uppercase font-black mb-2 block ml-1">Vehículo (Placa)</label>
            <select value={vehicleId} onChange={e => setVehicleId(e.target.value)} required className="w-full bg-slate-900 border border-slate-700 p-4 rounded-2xl text-white outline-none focus:border-orange-500">
              <option value="">Seleccionar vehículo...</option>
              {(isCliente ? allVehicles : filteredVehicles).map(v => (
                <option key={v.id} value={v.id}>{v.plate.toUpperCase()}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-slate-500 uppercase font-black mb-2 block">Fecha</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="w-full bg-slate-900 border border-slate-700 p-4 rounded-2xl text-white text-xs" />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 uppercase font-black mb-2 block">Hora</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} required className="w-full bg-slate-900 border border-slate-700 p-4 rounded-2xl text-white text-xs" />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-500 uppercase font-black mb-2 block">Motivo</label>
            <textarea value={reason} onChange={e => setReason(e.target.value)} required className="w-full bg-slate-900 border border-slate-700 p-4 rounded-2xl text-white text-xs h-24 resize-none" placeholder="Describe el problema..." />
          </div>

          <button type="submit" disabled={isSending} className="w-full bg-gradient-to-r from-orange-600 to-orange-500 text-white font-black py-4 rounded-2xl shadow-lg disabled:opacity-50">
            {isSending ? <Loader2 className="animate-spin mx-auto" /> : (isCliente ? "ENVIAR SOLICITUD" : "AGENDAR TURNO")}
          </button>
        </form>
      </div>
    </div>
  );
}