import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { 
  Scale, ArrowUpCircle, ArrowDownCircle, 
  FileDown, Filter, Loader2 
} from "lucide-react";
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
    // 1. Simplificamos el rango de fechas para evitar errores de formato
    const start = new Date(year, month - 1, 1).toISOString();
    const end = new Date(year, month, 0, 23, 59, 59).toISOString();

    // 2. Traemos las facturas
    const { data: invoices, error: invError } = await supabase
      .from("facturas")
      .select("monto_pagado, total, created_at")
      .gte("created_at", start)
      .lte("created_at", end);

    if (invError) throw invError;

    // 3. Traemos los gastos
    const { data: expenses, error: expError } = await supabase
      .from("expenses")
      .select("amount, date, description, category")
      .gte("date", start.split('T')[0])
      .lte("date", end.split('T')[0]);

    if (expError) throw expError;

    // 4. Calculamos ingresos 
    // Si monto_pagado es 0 o null, usamos el total para que al menos veas el monto facturado
    const totalIngresos = invoices?.reduce((acc, curr) => {
      const valor = (Number(curr.monto_pagado) > 0) ? Number(curr.monto_pagado) : Number(curr.total);
      return acc + (valor || 0);
    }, 0) || 0;

    const totalEgresos = expenses?.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0) || 0;
    
    const utilidad = totalIngresos - totalEgresos;
    const margen = totalIngresos > 0 ? (utilidad / totalIngresos) * 100 : 0;

    setStats({
      ingresos: totalIngresos,
      egresos: totalEgresos,
      utilidad: utilidad,
      margen: Math.round(margen),
      rawInvoices: invoices || [],
      rawExpenses: expenses || []
    });
  } catch (error) {
    console.error("Error detallado:", error);
  } finally {
    setLoading(false);
  }
};
 
 
    
                            
  const exportToPDF = () => {
    const doc = new jsPDF();
    const dateStr = `${month}/${year}`;
    
    doc.setFontSize(20);
    doc.setTextColor(234, 88, 12); // Naranja Upton's
    doc.text("REPORTE FINANCIERO - UPTON'S GARAGE", 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Periodo: ${dateStr} | Generado: ${new Date().toLocaleDateString()}`, 14, 28);

    autoTable(doc, {
      startY: 35,
      head: [['Concepto', 'Monto']],
      body: [
        ['Total Ingresos (Caja)', `$${stats.ingresos.toLocaleString()}`],
        ['Total Gastos', `$${stats.egresos.toLocaleString()}`],
        ['Utilidad Neta', `$${stats.utilidad.toLocaleString()}`],
        ['Margen de Rentabilidad', `${stats.margen}%`],
      ],
      headStyles: { fillColor: [234, 88, 12] }
    });

    doc.text("Detalle de Egresos:", 14, (doc as any).lastAutoTable.finalY + 10);
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 15,
      head: [['Fecha', 'Categoría', 'Descripción', 'Monto']],
      body: stats.rawExpenses.map(e => [e.date, e.category, e.description, `$${e.amount.toLocaleString()}`]),
    });

    doc.save(`Balance_${month}_${year}.pdf`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20 p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3 uppercase italic">
            <Scale className="text-orange-500" /> Balance Mensual
          </h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2">
            Flujo de caja real Upton's Garage
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-slate-900 p-3 rounded-2xl border border-slate-800 shadow-xl">
          <Filter size={16} className="text-orange-500 ml-2" />
          <select 
            value={month} 
            onChange={(e) => setMonth(Number(e.target.value))}
            className="bg-transparent text-white font-bold text-sm outline-none cursor-pointer"
          >
            {["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"].map((m, idx) => (
              <option key={m} value={idx + 1} className="bg-slate-900">{m}</option>
            ))}
          </select>
          <input 
            type="number" 
            value={year} 
            onChange={(e) => setYear(Number(e.target.value))}
            className="bg-transparent text-white font-bold text-sm w-20 outline-none border-l border-slate-700 pl-2"
          />
          <button 
            onClick={exportToPDF}
            className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all ml-2"
          >
            <FileDown size={16} /> PDF
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-4">
          <Loader2 className="animate-spin text-orange-500" size={40} />
          <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Calculando números...</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] shadow-xl">
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Efectivo Ingresado</p>
              <h2 className="text-3xl font-black text-emerald-400 font-mono">${stats.ingresos.toLocaleString()}</h2>
              <div className="mt-4 flex items-center gap-2 text-emerald-500/50 text-[10px] font-bold uppercase"><ArrowUpCircle size={14}/> Dinero en mano</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] shadow-xl">
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Gastos Pagados</p>
              <h2 className="text-3xl font-black text-red-400 font-mono">${stats.egresos.toLocaleString()}</h2>
              <div className="mt-4 flex items-center gap-2 text-red-500/50 text-[10px] font-bold uppercase"><ArrowDownCircle size={14}/> Salidas de caja</div>
            </div>

            <div className={`p-6 rounded-[2rem] shadow-2xl border-2 transition-all ${stats.utilidad >= 0 ? 'bg-slate-800 border-orange-500/30' : 'bg-red-950/20 border-red-500/30'}`}>
              <p className={`${stats.utilidad >= 0 ? 'text-orange-500' : 'text-red-500'} text-[10px] font-black uppercase tracking-widest mb-1`}>Utilidad Neta</p>
              <h2 className="text-3xl font-black font-mono text-white">${stats.utilidad.toLocaleString()}</h2>
              <p className="text-[10px] mt-4 font-bold text-slate-400 uppercase tracking-tighter">Rentabilidad: {stats.margen}%</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-8 rounded-[3rem] shadow-2xl">
            <h3 className="text-white font-black uppercase italic mb-8 flex items-center gap-2 text-sm tracking-widest">
              Distribución de Capital {month}/{year}
            </h3>
            <div className="flex h-16 w-full rounded-2xl overflow-hidden border-4 border-slate-800 bg-slate-800 shadow-inner">
              <div 
                style={{ width: `${stats.ingresos > 0 ? Math.min((stats.egresos / stats.ingresos) * 100, 100) : 0}%` }} 
                className="bg-red-500 h-full flex items-center justify-center text-[10px] font-black text-white uppercase italic transition-all duration-1000"
              >
                {stats.egresos > 0 && "Gastos"}
              </div>
              <div 
                style={{ width: `${stats.utilidad > 0 ? stats.margen : 0}%` }} 
                className="bg-emerald-500 h-full flex items-center justify-center text-[10px] font-black text-white uppercase italic transition-all duration-1000"
              >
                {stats.utilidad > 0 && "Ganancia"}
              </div>
            </div>
            <div className="grid grid-cols-2 mt-4 text-[10px] font-black uppercase tracking-widest">
               <div className="text-red-500 flex items-center gap-2"><div className="w-2 h-2 bg-red-500 rounded-full"></div> Gastos operativos</div>
               <div className="text-emerald-500 flex items-center gap-2 justify-end"><div className="w-2 h-2 bg-emerald-500 rounded-full"></div> Utilidad neta</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}