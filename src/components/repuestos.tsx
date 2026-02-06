import { useState, useEffect } from "react";
import { supabase } from "../supabase";

export default function ModuloRepuestos() {
  const [repuestos, setRepuestos] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    descripcion: "", costo: 0, margen_porcentaje: 35, codigo_interno: ""
  });

  // 1. DEFINIR LA FUNCIÓN QUE FALTA
  const fetchRepuestos = async () => {
    const { data, error } = await supabase
      .from("repuestos")
      .select("*")
      .order('descripcion', { ascending: true });
    
    if (!error && data) {
      setRepuestos(data);
    }
  };

  // 2. CARGAR LOS DATOS AL INICIAR
  useEffect(() => {
    fetchRepuestos();
  }, []);

  const precioVenta = formData.costo * (1 + formData.margen_porcentaje / 100);

  const saveRepuesto = async () => {
    const { error } = await supabase.from("repuestos").insert([formData]);
    if (!error) {
      alert("Repuesto guardado");
      // Ahora sí existe esta función
      fetchRepuestos(); 
      // Opcional: limpiar el formulario
      setFormData({ descripcion: "", costo: 0, margen_porcentaje: 35, codigo_interno: "" });
    }
  };

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-white grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* FORMULARIO DE CARGA */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 h-fit">
        <h2 className="text-xl font-bold mb-4 text-orange-500">Cargar Nuevo Repuesto</h2>
        <div className="space-y-4">
          <input 
            placeholder="Código Interno / SKU" 
            value={formData.codigo_interno}
            className="w-full bg-slate-900 p-2 rounded border border-slate-700"
            onChange={e => setFormData({...formData, codigo_interno: e.target.value})}
          />
          <input 
            placeholder="Descripción del Repuesto" 
            value={formData.descripcion}
            className="w-full bg-slate-900 p-2 rounded border border-slate-700"
            onChange={e => setFormData({...formData, descripcion: e.target.value})}
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-500 uppercase font-bold">Costo ($)</label>
              <input 
                type="number" 
                value={formData.costo}
                className="w-full bg-slate-900 p-2 rounded border border-slate-700 text-white"
                onChange={e => setFormData({...formData, costo: Number(e.target.value)})}
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase font-bold">Margen (%)</label>
              <input 
                type="number" 
                className="w-full bg-slate-900 p-2 rounded border border-slate-700 text-white"
                value={formData.margen_porcentaje}
                onChange={e => setFormData({...formData, margen_porcentaje: Number(e.target.value)})}
              />
            </div>
          </div>
          
          <div className="bg-slate-700/50 p-4 rounded-lg flex justify-between items-center border border-amber-500/30">
            <span className="text-sm font-bold uppercase tracking-widest">Precio de Venta:</span>
            <span className="text-2xl font-black text-green-400 italic">${precioVenta.toLocaleString()}</span>
          </div>
          
          <button onClick={saveRepuesto} className="w-full bg-orange-600 p-3 rounded-lg font-black uppercase tracking-widest hover:bg-orange-700 transition-colors">
            Guardar en Inventario
          </button>
        </div>
      </div>

      {/* LISTADO RÁPIDO */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 overflow-hidden">
        <h2 className="text-xl font-bold mb-4 text-slate-300">Stock de Repuestos</h2>
        <div className="overflow-y-auto max-h-[500px]">
          <table className="w-full text-sm">
            <thead className="text-slate-500 uppercase text-[10px] border-b border-slate-700 sticky top-0 bg-slate-800">
              <tr>
                <th className="p-3 text-left">Repuesto</th>
                <th className="p-3 text-right">Costo</th>
                <th className="p-3 text-right">Venta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
                {repuestos.map((item, index) => (
                  <tr key={index} className="hover:bg-slate-700/30 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-white">{item.descripcion}</div>
                      <div className="text-[10px] text-slate-500 uppercase">{item.codigo_interno}</div>
                    </td>
                    <td className="p-3 text-right text-slate-400 font-mono">${item.costo}</td>
                    <td className="p-3 text-right text-green-400 font-bold font-mono">
                      ${(item.costo * (1 + item.margen_porcentaje / 100)).toLocaleString()}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {repuestos.length === 0 && (
            <p className="text-center p-10 text-slate-600 italic">No hay repuestos registrados</p>
          )}
        </div>
      </div>
    </div>
  );
}