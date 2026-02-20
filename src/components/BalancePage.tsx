import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { Scale, Loader2, FileDown } from "lucide-react";

export default function BalancePage() {
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [stats, setStats] = useState({
    ingresos: 0, egresos: 0, utilidad: 0, margen: 0,
    rawInvoices: [] as any[]
  });

  useEffect(() => { fetchFinancialData(); }, [month, year]);

  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      const firstDay = `${year}-${String(month).padStart(2, '0')}-01T00:00:00`;
      const lastDay = `${year}-${String(month).padStart(2, '0')}-31T23:59:59`;

      // Consultar tabla FACTURAS
      const { data: facturas } = await supabase
        .from("facturas")
        .select("created_at, monto_pagado, total")
        .gte("created_at", firstDay)
        .lte("created_at", lastDay);

      // Consultar Gastos
      const { data: expenses } = await supabase
        .from("expenses")
        .select("amount")
        .gte("date", firstDay)
        .lte("date", lastDay);

      const totalIngresos = facturas?.reduce((acc, curr) => acc + (Number(curr.monto_pagado) || 0), 0) || 0;
      const totalEgresos = expenses?.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0) || 0;

      setStats({
        ingresos: totalIngresos,
        egresos: totalEgresos,
        utilidad: totalIngresos - totalEgresos,
        margen: totalIngresos > 0 ? Math.round(((totalIngresos - totalEgresos) / totalIngresos) * 100) : 0,
        rawInvoices: facturas || []
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-[#0B0F1A] min-h-screen text-white space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black uppercase italic flex items-center gap-3">
          <Scale className="text-orange-500" /> Balance Mensual
        </h1>
        <div className="flex gap-3 bg-slate-900 p-3 rounded-2xl border border-slate-800">
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="bg-transparent font-bold text-sm outline-none">
            <option value={2}>Febrero</option>
            {/* ...otros meses... */}
          </select>
          <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="bg-transparent font-bold text-sm w-20 outline-none border-l border-slate-700 pl-3" />
        </div>
      </div>

      {loading ? <Loader2 className="animate-spin text-orange-500 mx-auto" size={40} /> : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800">
            <p className="text-slate-500 text-[10px] font-black uppercase mb-2">Ingresos del Mes</p>
            <h2 className="text-4xl font-black text-emerald-400 font-mono">${stats.ingresos.toLocaleString()}</h2>
          </div>
          <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800">
            <p className="text-slate-500 text-[10px] font-black uppercase mb-2">Egresos del Mes</p>
            <h2 className="text-4xl font-black text-red-400 font-mono">${stats.egresos.toLocaleString()}</h2>
          </div>
          <div className="bg-slate-800 p-8 rounded-[2rem] border-2 border-orange-500/30">
            <p className="text-orange-500 text-[10px] font-black uppercase mb-2">Utilidad Neta</p>
            <h2 className="text-4xl font-black font-mono">${stats.utilidad.toLocaleString()}</h2>
          </div>
        </div>
      )}
    </div>
  );
}