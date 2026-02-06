import { useState, useEffect } from "react";
import { supabase } from "../supabase";

export default function ModuloRepuestos() {
  const [repuestos, setRepuestos] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    descripcion: "", costo: 0, margen_porcentaje: 35, codigo_interno: ""
  });

  // Cálculo en tiempo real
  const precioVenta = formData.costo * (1 + formData.margen_porcentaje / 100);

  const saveRepuesto = async () => {
    const { error } = await supabase.from("repuestos").insert([formData]);
    if (!error) {
      alert("Repuesto guardado");
      fetchRepuestos();
    }
  };

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-white grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* FORMULARIO DE CARGA */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 h-fit">
        <h2 className="text-xl font-bold mb-4">Cargar Nuevo Repuesto</h2>
        <div className="space-y-4">
          <input 
            placeholder="Código Interno / SKU" 
            className="w-full bg-slate-900 p-2 rounded border border-slate-700"
            onChange={e => setFormData({...formData, codigo_interno: e.target.value})}
          />
          <input 
            placeholder="Descripción del Repuesto" 
            className="w-full bg-slate-900 p-2 rounded border border-slate-700"
            onChange={e => setFormData({...formData, descripcion: e.target.value})}
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-500">Costo ($)</label>
              <input 
                type="number" 
                className="w-full bg-slate-900 p-2 rounded border border-slate-700"
                onChange={e => setFormData({...formData, costo: Number(e.target.value)})}
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">Margen (%)</label>
              <input 
                type="number" 
                className="w-full bg-slate-900 p-2 rounded border border-slate-700"
                value={formData.margen_porcentaje}
                onChange={e => setFormData({...formData, margen_porcentaje: Number(e.target.value)})}
              />
            </div>
          </div>
          
          <div className="bg-slate-700/50 p-4 rounded-lg flex justify-between items-center border border-amber-500/30">
            <span className="text-sm font-bold">PRECIO DE VENTA:</span>
            <span className="text-2xl font-bold text-green-400">${precioVenta.toLocaleString()}</span>
          </div>
          
          <button onClick={saveRepuesto} className="w-full bg-blue-600 p-3 rounded-lg font-bold hover:bg-blue-700">
            Guardar en Inventario
          </button>
        </div>
      </div>

      {/* LISTADO RÁPIDO */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
        <h2 className="text-xl font-bold mb-4">Stock de Repuestos</h2>
        <table className="w-full text-sm">
          <thead className="text-slate-500 uppercase text-[10px] border-b border-slate-700">
            <tr>
              <th className="p-2 text-left">Repuesto</th>
              <th className="p-2 text-right">Costo</th>
              <th className="p-2 text-right">Venta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
             {/* Aquí mapearías los repuestos de la DB */}
          </tbody>
        </table>
      </div>
    </div>
  );
}