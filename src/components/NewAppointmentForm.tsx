// src/components/NewAppointmentForm.tsx
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

  useEffect(() => {
    const fetchData = async () => {
      const { data: cData } = await supabase.from("clients").select("id, name");
      setClients(cData || []);
      const { data: vData } = await supabase.from("vehicles").select("id, matricula");
      setVehicles(vData || []);
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("appointments").insert([
      {
        client_id: clientId,
        vehicle_id: vehicleId,
        date,
        time,
        reason,
        status: "pendiente",
      },
    ]);
    if (error) {
      console.error(error);
      alert("Error al agendar turno");
    } else {
      alert("Turno agendado correctamente");
      onCreated(); // refresca el calendario
      setClientId("");
      setVehicleId("");
      setDate("");
      setTime("");
      setReason("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-800 p-4 rounded text-white">
      <h2 className="text-xl font-bold mb-4">Agendar nuevo turno</h2>

      <label className="block mb-2">Cliente</label>
      <select
        value={clientId}
        onChange={e => setClientId(e.target.value)}
        className="w-full p-2 mb-4 rounded bg-slate-700"
        required
      >
        <option value="">Seleccionar cliente</option>
        {clients.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      <label className="block mb-2">Vehículo</label>
      <select
        value={vehicleId}
        onChange={e => setVehicleId(e.target.value)}
        className="w-full p-2 mb-4 rounded bg-slate-700"
        required
      >
        <option value="">Seleccionar vehículo</option>
        {vehicles.map(v => (
          <option key={v.id} value={v.id}>{v.matricula}</option>
        ))}
      </select>

      <label className="block mb-2">Fecha</label>
      <input
        type="date"
        value={date}
        onChange={e => setDate(e.target.value)}
        className="w-full p-2 mb-4 rounded bg-slate-700"
        required
      />

      <label className="block mb-2">Hora</label>
      <input
        type="time"
        value={time}
        onChange={e => setTime(e.target.value)}
        className="w-full p-2 mb-4 rounded bg-slate-700"
        required
      />

      <label className="block mb-2">Motivo</label>
      <input
        type="text"
        value={reason}
        onChange={e => setReason(e.target.value)}
        className="w-full p-2 mb-4 rounded bg-slate-700"
        placeholder="Ej: cambio de aceite"
        required
      />

      <button
        type="submit"
        className="bg-green-600 px-4 py-2 rounded mt-4"
      >
        Guardar turno
      </button>
    </form>
  );
}
