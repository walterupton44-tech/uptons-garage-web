import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { 
  Package, Search, Plus, Minus, 
  Trash2, Edit3, Loader2, Tag, X, Save
} from "lucide-react";

export default function Inventory() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [editingItem, setEditingItem] = useState<any | null>(null);

  useEffect(() => {
    fetchRepuestos();
  }, []);

  const fetchRepuestos = async () => {
    setLoading(true);
    const { data } = await supabase.from("repuestos").select("*").order("descripcion", { ascending: true });
    setItems(data || []);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!editingItem) return;
    const { error } = await supabase
      .from("repuestos")
      .update({
        costo: editingItem.costo,
        stock: editingItem.stock,
        margen_porcentaje: editingItem.margen_porcentaje,
        codigo_parte: editingItem.codigo_parte
      })
      .eq("id", editingItem.id);

    if (!error) {
      setEditingItem(null);
      fetchRepuestos();
    }
  };

  const itemsFiltrados = items.filter(item => 
    item.descripcion?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="space-y-6 relative">
      
      {/* BUSCADOR */}
      <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700 flex items-center gap-3 shadow-xl">
        <Search className="text-slate-500" size={20} />
        <input 
          className="bg-transparent w-full outline-none text-white placeholder:text-slate-600 font-medium"
          placeholder="Buscar repuesto por nombre o categoría..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {/* TABLA */}
      <div className="bg-slate-800/30 rounded-[2rem] border border-slate-800 overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead className="bg-slate-800/50 border-b border-slate-700">
            <tr className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">
              <th className="p-5">Repuesto</th>
              <th className="p-5 text-center">Stock</th>
              <th className="p-5 text-center">Costo</th>
              <th className="p-5 text-center text-orange-500 italic">P. Venta</th>
              <th className="p-5 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {itemsFiltrados.map((item) => {
              const precioVenta = Number(item.costo) * (1 + (Number(item.margen_porcentaje) / 100));
              return (
                <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                  <td className="p-5">
                    <p className="text-sm font-bold text-slate-200 uppercase leading-tight">{item.descripcion}</p>
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">
                      {item.codigo_parte || "Sin Código"}
                    </span>
                  </td>
                  <td className="p-5 text-center font-black italic text-lg text-white">
                    {item.stock}
                  </td>
                  <td className="p-5 text-center font-mono text-slate-400">
                    ${Number(item.costo).toLocaleString()}
                  </td>
                  <td className="p-5 text-center font-black text-orange-500 italic text-lg">
                    ${precioVenta.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-5 text-right">
                    <button 
                      onClick={() => setEditingItem(item)}
                      className="p-2.5 bg-slate-800 rounded-xl text-slate-400 hover:text-white hover:bg-orange-600 transition-all shadow-lg"
                    >
                      <Edit3 size={18} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL DE EDICIÓN (Se muestra cuando editingItem no es null) */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-[2.5rem] shadow-3xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Editar Repuesto</h2>
                <button onClick={() => setEditingItem(null)} className="text-slate-500 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Costo Unitario ($)</label>
                  <input 
                    type="number"
                    className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white font-bold mt-1 outline-none focus:border-orange-500"
                    value={editingItem.costo}
                    onChange={(e) => setEditingItem({...editingItem, costo: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Stock Actual</label>
                    <input 
                      type="number"
                      className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white font-bold mt-1 outline-none"
                      value={editingItem.stock}
                      onChange={(e) => setEditingItem({...editingItem, stock: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Margen (%)</label>
                    <input 
                      type="number"
                      className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white font-bold mt-1 outline-none"
                      value={editingItem.margen_porcentaje}
                      onChange={(e) => setEditingItem({...editingItem, margen_porcentaje: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <button 
                onClick={handleSave}
                className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black uppercase py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-orange-900/20"
              >
                <Save size={20} /> Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}