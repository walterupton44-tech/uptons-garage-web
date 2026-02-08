import { useState, useEffect } from "react";
import { supabase } from "../supabase";

export default function NewAppointmentForm({ onCreated }: { onCreated: () => void }) {
  const [clients, setClients] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [clientId, setClientId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  const [userProfile, setUserProfile] = useState<{role: string, client_id: string} | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // 1. Obtener la sesión y el perfil del usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, client_id")
          .eq("id", user.id)
          .single();
        
        setUserProfile(profile);

        // 2. Cargar Clientes (Solo si es admin)
        if (profile?.role === 'admin') {
          const { data: cData } = await supabase.from("clients").select("id, name");
          setClients(cData || []);
        } else {
          // Si es cliente, fijamos su ID automáticamente
          setClientId(profile?.client_id || "");
        }

        // 3. Cargar Vehículos (Filtrar si es cliente)
        let vQuery = supabase.from("vehicles").select("id, matricula, brand, model");
        if (profile?.role !== 'admin' && profile?.client_id) {
          vQuery = vQuery.eq("client_id", profile.client_id);
        }
        
        const { data: vData } = await vQuery;
        setVehicles(vData || []);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Seguridad extra: Si no es admin, forzamos su client_id real del perfil
    const finalClientId = userProfile?.role === 'admin' ? clientId : userProfile?.client_id;

    if (!finalClientId) {
      alert("Error: No se pudo identificar tu cuenta de cliente.");
      return;
    }

    const { error } = await supabase.from("appointments").insert([
      {
        client_id: finalClientId,
        vehicle_id: vehicleId,
        date,
        time,
        reason,
        status: "pendiente",
      },
    ]);

    if (error) {
      console.error(error);
      alert("Error al agendar turno: " + error.message);
    } else {
      alert("Turno agendado correctamente");
      onCreated();
      // Limpiar campos (si es admin limpia todo, si es cliente mantiene su ID)
      if (userProfile?.role === 'admin') setClientId("");
      setVehicleId("");
      setDate("");
      setTime("");
      setReason("");
    }
  };

  if (loading) return <div className="p-4 text-white">Cargando formulario...</div>;

  return (
    <form onSubmit={handleSubmit} className="bg-slate-800 p-6 rounded-2xl text-white shadow-xl border border-slate-700">
      <h2 className="text-xl font-bold mb-6 italic text-amber-500">Agendar Nuevo Turno</h2>

      {/* Solo mostrar selector de clientes si es ADMIN */}
      {userProfile?.role === 'admin' ? (
        <>
          <label className="block mb-2 text-xs font-black uppercase text-slate-400">Seleccionar Cliente</label>
          <select
            value={clientId}
            onChange={e => setClientId(e.target.value)}
            className="w-full p-3 mb-4 rounded-xl bg-slate-900 border border-slate-700 outline-none focus:border-amber-500"
            required
          >
            <option value="">Buscar cliente...</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </>
      ) : (
        <div className="mb-4 p-3 bg-slate-900/50 rounded-xl border border-slate-700">
          <p className="text-[10px] uppercase text-slate-500 font-bold">Registrando turno para:</p>
          <p className="font-bold text-amber-500">Mi Cuenta</p>
        </div>
      )}

      <label className="block mb-2 text-xs font-black uppercase text-slate-400">Vehículo</label>
      <select
        value={vehicleId}
        onChange={e => setVehicleId(e.target.value)}
        className="w-full p-3 mb-4 rounded-xl bg-slate-900 border border-slate-700 outline-none focus:border-amber-500"
        required
      >
        <option value="">{vehicles.length > 0 ? "Seleccionar mi vehículo" : "No tienes vehículos registrados"}</option>
        {vehicles.map(v => (
          <option key={v.id} value={v.id}>{v.brand} {v.model} ({v.matricula})</option>
        ))}
      </select>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block mb-2 text-xs font-black uppercase text-slate-400">Fecha</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full p-3 mb-4 rounded-xl bg-slate-900 border border-slate-700 outline-none focus:border-amber-500"
            required
          />
        </div>
        <div>
          <label className="block mb-2 text-xs font-black uppercase text-slate-400">Hora</label>
          <input
            type="time"
            value={time}
            onChange={e => setTime(e.target.value)}
            className="w-full p-3 mb-4 rounded-xl bg-slate-900 border border-slate-700 outline-none focus:border-amber-500"
            required
          />
        </div>
      </div>

      <label className="block mb-2 text-xs font-black uppercase text-slate-400">Motivo de la visita</label>
      <textarea
        value={reason}
        onChange={e => setReason(e.target.value)}
        className="w-full p-3 mb-4 rounded-xl bg-slate-900 border border-slate-700 outline-none focus:border-amber-500 h-24"
        placeholder="Describa el problema o servicio necesario..."
        required
      />

      <button
        type="submit"
        disabled={!vehicleId}
        className="w-full bg-amber-600 hover:bg-amber-500 text-white font-black py-4 rounded-xl transition-all uppercase tracking-widest text-xs disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Confirmar Turno
      </button>
    </form>
  );
}