import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { Wallet, Plus, Trash2, Calendar, Tag, Truck, Loader2 } from "lucide-react";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  // Estado para el nuevo gasto
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: "Repuestos",
    description: "",
    provider: "",
    amount: ""
  });

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("expenses")
      .select("*")
      .order("date", { ascending: false });
    setExpenses(data || []);
    setLoading(false);
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("expenses").insert([
      { ...formData, amount: parseFloat(formData.amount) }
    ]);

    if (!error) {
      setFormData({ date: new Date().toISOString().split('T')[0], category: "Repuestos", description: "", provider: "", amount: "" });
      setIsAdding(false);
      fetchExpenses();
    }
  };

  const deleteExpense = async (id: string) => {
    if (window.confirm("¿Eliminar este gasto?")) {
      await supabase.from("expenses").delete().eq("id", id);
      fetchExpenses();
    }
  };

  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header con Total */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3 uppercase italic">
            <Wallet className="text-red-500" /> Gestión de Gastos
          </h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
            Control de egresos y facturas de proveedores
          </p>
        </div>
        
        <div className="bg-slate-900 border border-red-500/20 p-4 rounded-2xl flex items-center gap-6 shadow-xl">
          <div>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Total Egresos</p>
            <p className="text-2xl font-black text-red-500">${totalExpenses.toLocaleString()}</p>
          </div>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="bg-red-600 hover:bg-red-500 text-white p-3 rounded-xl transition-all shadow-lg"
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      {/* Formulario de Nuevo Gasto */}
      {isAdding && (
        <form onSubmit={handleAddExpense} className="bg-slate-800 border border-slate-700 p-6 rounded-3xl grid grid-cols-1 md:grid-cols-5 gap-4 animate-in zoom-in duration-200">
          <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="bg-slate-900 border border-slate-700 p-3 rounded-xl text-white outline-none focus:border-red-500 text-sm" required />
          <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="bg-slate-900 border border-slate-700 p-3 rounded-xl text-white outline-none focus:border-red-500 text-sm">
            <option>Repuestos</option>
            <option>Alquiler</option>
            <option>Servicios</option>
            <option>Sueldos</option>
            <option>Otros</option>
          </select>
          <input type="text" placeholder="Descripción" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="bg-slate-900 border border-slate-700 p-3 rounded-xl text-white outline-none focus:border-red-500 text-sm" required />
          <input type="text" placeholder="Proveedor" value={formData.provider} onChange={e => setFormData({...formData, provider: e.target.value})} className="bg-slate-900 border border-slate-700 p-3 rounded-xl text-white outline-none focus:border-red-500 text-sm" />
          <div className="flex gap-2">
            <input type="number" placeholder="Monto" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="bg-slate-900 border border-slate-700 p-3 rounded-xl text-white outline-none focus:border-red-500 text-sm flex-1" required />
            <button type="submit" className="bg-emerald-600 p-3 rounded-xl text-white"><Plus /></button>
          </div>
        </form>
      )}

      {/* Tabla de Gastos */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-900 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-800">
              <th className="p-4">Fecha</th>
              <th className="p-4">Categoría</th>
              <th className="p-4">Descripción / Proveedor</th>
              <th className="p-4">Monto</th>
              <th className="p-4 text-center">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {loading ? (
              <tr><td colSpan={5} className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-slate-500" /></td></tr>
            ) : expenses.map((exp) => (
              <tr key={exp.id} className="hover:bg-slate-800/30 transition-colors group">
                <td className="p-4 text-sm text-slate-300 font-mono italic">
                   {new Date(exp.date).toLocaleDateString()}
                </td>
                <td className="p-4">
                  <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-1 rounded-lg font-black uppercase border border-slate-700">
                    {exp.category}
                  </span>
                </td>
                <td className="p-4">
                  <div className="text-sm text-white font-bold">{exp.description}</div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-tighter">{exp.provider || "Sin proveedor"}</div>
                </td>
                <td className="p-4 text-red-400 font-black font-mono">
                  -${exp.amount.toLocaleString()}
                </td>
                <td className="p-4 text-center">
                  <button onClick={() => deleteExpense(exp.id)} className="text-slate-600 hover:text-red-500 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}