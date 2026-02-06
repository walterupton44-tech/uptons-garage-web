import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { 
  Package, Search, Plus, Minus, 
  Trash2, Edit3, Loader2, DollarSign, Tag
} from "lucide-react";

export default function Inventory() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    fetchRepuestos();
  }, []);

  const fetchRepuestos = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("repuestos")
      .select("*")
      .order("descripcion", { ascending: true });
    setItems(data || []);
    setLoading(false);
  };

  const updateStock = async (id: string, nuevoStock: number) => {
    if (nuevoStock < 0) return;
    await supabase.from("repuestos").update({ stock: nuevoStock }).eq("id", id);
    fetchRepuestos();
  };

  const itemsFiltrados = items.filter(item => 
    item.descripcion.toLowerCase().includes(busqueda.toLowerCase()) ||
    item.codigo_parte?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="p-6 bg-[#0B0F1A] min-h-screen text-slate-200">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* HEADER */}
        <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center">
              <Package className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase italic tracking-tighter text-white">Stock de Repuestos</h1>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Control de Almacén</p>
            </div>
          </div>

          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              className="w-full bg-[#0B0F1A] border border-slate-800 py-3.5 pl-12 pr-4 rounded-2xl outline-none focus:border-orange-500/50 text-sm"
              placeholder="Buscar por descripción o código..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </div>

        {/* LISTADO */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] overflow-hidden">
          {loading ? (
            <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-orange-500" size={40} /></div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-800/30 text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">
                  <th className="p-6">Descripción / Código</th>
                  <th className="p-6 text-center">Stock</th>
                  <th className="p-6 text-center">Costo</th>
                  <th className="p-6 text-center">Margen</th>
                  <th className="p-6 text-center text-orange-500">P. Venta</th>
                  <th className="p-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {itemsFiltrados.map((item) => {
                  const precioVenta = item.costo * (1 + (item.margen_porcentaje / 100));
                  return (
                    <tr key={item.id} className="hover:bg-slate-800/20 transition-colors group">
                      <td className="p-6">
                        <p className="text-sm font-bold text-white uppercase leading-tight max-w-xs">{item.descripcion}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Tag size={10} className="text-slate-600" />
                          <span className="text-[10px] font-black text-slate-600 uppercase">
                            {item.codigo_parte || 'SIN CÓDIGO'}
                          </span>
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center justify-center gap-3">
                          <button onClick={() => updateStock(item.id, item.stock - 1)} className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400">-</button>
                          <span className={`text-lg font-black italic min-w-[30px] text-center ${item.stock <= 2 ? 'text-red-500' : 'text-white'}`}>{item.stock}</span>
                          <button onClick={() => updateStock(item.id, item.stock + 1)} className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400">+</button>
                        </div>
                      </td>
                      <td className="p-6 text-center font-bold text-slate-400">${item.costo}</td>
                      <td className="p-6 text-center">
                        <span className="bg-slate-800 px-2 py-1 rounded text-[10px] font-black text-slate-400">{item.margen_porcentaje}%</span>
                      </td>
                      <td className="p-6 text-center font-black text-orange-500 text-lg italic">
                        ${precioVenta.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-6 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 text-slate-500 hover:text-white"><Edit3 size={18} /></button>
                          <button className="p-2 text-slate-500 hover:text-red-500"><Trash2 size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}