import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { Scale, ArrowUpCircle, ArrowDownCircle, Loader2, FileDown, Filter } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function BalancePage() {
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [stats, setStats] = useState({
    ingresos: 0,
    egresos: 0,
    utilidad: 0,
    margen: 0,
    rawInvoices: [] as any[],
    rawExpenses: [] as any[]
  });

  useEffect(() => {
    fetchFinancialData();
  }, [month, year]);

  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      const firstDay = `${year}-${String(month).padStart(2, '0')}-01T00:00:00`;
      const lastDay = `${year}-${String(month).padStart(2, '0')}-31T23:59:59`;

      // 1. Obtener INGRESOS REALES desde historial_pagos
      const { data: pagos } = await supabase
        .from("historial_pagos")
        .select("monto_abonado, fecha_pago")
        .gte("fecha_pago", firstDay)
        .lte("fecha_pago", lastDay);

      // 2. Obtener EGRESOS desde expenses
      const { data: expenses } = await supabase
        .from("expenses")
        .select("*")
        .gte("date", firstDay)
        .lte("date", lastDay);

      const totalIngresos = pagos?.reduce((acc, curr) => acc + (Number(curr.monto_abonado) || 0), 0) || 0;
      const totalEgresos = expenses?.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0) || 0;

      setStats({
        ingresos: totalIngresos,
        egresos: totalEgresos,
        utilidad: totalIngresos - totalEgresos,
        margen: totalIngresos > 0 ? Math.round(((totalIngresos - totalEgresos) / totalIngresos) * 100) : 0,
        rawInvoices: pagos || [],
        rawExpenses: expenses || []
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-700 bg-[#0B0F1A] min-h-screen text-white">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black uppercase italic flex items-center gap-2"><Scale className="text-orange-500"/> Balance</h1>
        </div>
        <div className="flex gap-2 bg-slate-900 p-2 rounded-xl border border-slate-800">
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="bg-transparent font-bold text-xs uppercase">
            {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('es', { month: 'long' })}</option>)}
          </select>
          <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="bg-transparent font-bold text-xs w-16 border-l border-slate-700 pl-2" />
        </div>
      </div>

      {loading ? <Loader2 className="animate-spin mx-auto text-orange-500" /> : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800">
            <p className="text-[10px] font-black uppercase text-slate-500 mb-2">Ingresos (Caja)</p>
            <h2 className="text-4xl font-black text-emerald-400 font-mono">${stats.ingresos.toLocaleString()}</h2>
          </div>
          <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800">
            <p className="text-[10px] font-black uppercase text-slate-500 mb-2">Gastos (Compras)</p>
            <h2 className="text-4xl font-black text-red-400 font-mono">${stats.egresos.toLocaleString()}</h2>
          </div>
          <div className="bg-slate-800 p-8 rounded-[2rem] border border-orange-500/30">
            <p className="text-[10px] font-black uppercase text-orange-500 mb-2">Utilidad Neta</p>
            <h2 className="text-4xl font-black text-white font-mono">${stats.utilidad.toLocaleString()}</h2>
            <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase">Rentabilidad: {stats.margen}%</p>
          </div>
        </div>
      )}
      {/* ... Gráfico de distribución se mantiene igual ... */}
    </div>
  );
}