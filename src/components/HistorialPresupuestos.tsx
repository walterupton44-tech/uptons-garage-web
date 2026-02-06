import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { Search, Eye, Calendar, User, Car, RotateCcw } from "lucide-react";
interface HistorialProps {
  onReutilizar: (presupuesto: any) => void;
}
export default function HistorialPresupuestos({onReutilizar}: HistorialProps) {
  const [presupuestos, setPresupuestos] = useState<any[]>([]);
  const [filtro, setFiltro] = useState("");

  useEffect(() => {
    const cargarHistorial = async () => {
      const { data } = await supabase
        .from("presupuestos_guardados")
        .select("*")
        .order("created_at", { ascending: false });
      setPresupuestos(data || []);
    };
    cargarHistorial();
  }, []);

  const filtrados = presupuestos.filter(p => 
    p.cliente_nombre.toLowerCase().includes(filtro.toLowerCase()) ||
    p.vehiculo_info.toLowerCase().includes(filtro.toLowerCase())
  );
const actualizarEstado = async (id: string, nuevoEstado: string) => {
  const { error } = await supabase
    .from("presupuestos_guardados")
    .update({ estado: nuevoEstado })
    .eq('id', id);
  
  if (!error) {
    // Actualizar el estado localmente para que cambie el color en pantalla
    setPresupuestos(presupuestos.map(p => p.id === id ? {...p, estado: nuevoEstado} : p));
  }
};
  return (
    <div className="p-6 bg-slate-900 min-h-screen text-white">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">Historial de Presupuestos</h1>
            <p className="text-slate-400">Consulta y revisa cotizaciones anteriores</p>
          </div>
          
          <div className="relative w-72">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={18} />
            <input 
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:border-amber-500"
              placeholder="Buscar por cliente o patente..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtrados.map((p) => (
            <div key={p.id} className="bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-slate-500 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-amber-500/10 p-2 rounded-lg">
                  <Calendar className="text-amber-500" size={20} />
                </div>
                <span className="text-xs text-slate-500 font-mono">
                  {new Date(p.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User size={14} className="text-slate-400" />
                  <h3 className="font-bold text-slate-200 uppercase truncate">{p.cliente_nombre}</h3>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Car size={14} />
                  <span>{p.vehiculo_info}</span>
                </div>
              </div>
<div className="flex gap-2 mt-4">
  <select 
    value={p.estado}
    onChange={(e) => actualizarEstado(p.id, e.target.value)}
    className={`text-[10px] font-bold px-2 py-1 rounded-md bg-slate-900 border outline-none ${
      p.estado === 'ACEPTADO' ? 'text-green-400 border-green-500/50' : 
      p.estado === 'RECHAZADO' ? 'text-red-400 border-red-500/50' : 
      'text-amber-400 border-amber-500/50'
    }`}
  >
    <option value="PENDIENTE">PENDIENTE</option>
    <option value="ACEPTADO">ACEPTADO</option>
    <option value="RECHAZADO">RECHAZADO</option>
  </select>
</div>
              <div className="mt-6 pt-4 border-t border-slate-700 flex justify-between items-center">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Total</p>
                  <p className="text-xl font-mono font-bold text-green-400">${p.total.toLocaleString()}</p>
                </div>
                <button 
                  onClick={() => alert(JSON.stringify(p.items, null, 2))}
                  className="bg-slate-700 hover:bg-slate-600 p-2 rounded-lg transition-colors"
                  title="Ver detalles"
                >
                  <Eye size={18} />
                </button>
                <button 
      onClick={() => onReutilizar(p)} 
      className="flex items-center gap-2 bg-amber-600/20 hover:bg-amber-600 text-amber-500 hover:text-white px-3 py-2 rounded-lg transition-all text-xs font-bold"
    >
      <RotateCcw size={14} /> Reutilizar
    </button>
              </div>
            </div>
          ))}
        </div>

        {filtrados.length === 0 && (
          <div className="text-center py-20 bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-700">
            <p className="text-slate-500">No se encontraron presupuestos guardados.</p>
          </div>
        )}
      </div>
    </div>
  );
}