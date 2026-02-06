import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { 
  Scale, ArrowUpCircle, ArrowDownCircle, 
  TrendingUp, TrendingDown, DollarSign, Loader2,
  Calendar, FileDown, Filter
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
      // Definir rango de fechas para el filtro
      const firstDay = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = `${year}-${String(month).padStart(2, '0')}-31`;

      // 1. Obtener Ingresos filtrados por fecha
      const { data: invoices } = await supabase
        .from("invoices")
        .select("created_at, total, client_name")
        .gte("created_at", firstDay)
        .lte("created_at", lastDay);

      // 2. Obtener Egresos filtrados por fecha
      const { data: expenses } = await supabase
        .from("expenses")
        .select("date, amount, description, category")
        .gte("date", firstDay)
        .lte("date", lastDay);

      const totalIngresos = invoices?.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0) || 0;
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
      console.error("Error cargando balance:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const dateStr = `${month}/${year}`;

    // Título
    doc.setFontSize(20);
    doc.setTextColor(234, 88, 12); // Naranja
    doc.text("REPORTE FINANCIERO - UPTON'S GARAGE", 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Periodo: ${dateStr} | Generado el: ${new Date().toLocaleDateString()}`, 14, 28);

    // Resumen
    autoTable(doc, {
      startY: 35,
      head: [['Concepto', 'Monto']],
      body: [
        ['Total Ingresos', `$${stats.ingresos.toLocaleString()}`],
        ['Total Gastos', `$${stats.egresos.toLocaleString()}`],
        ['Utilidad Neta', `$${stats.utilidad.toLocaleString()}`],
        ['Margen de Rentabilidad', `${stats.margen}%`],
      ],
      theme: 'striped',
      headStyles: { 
    fillColor: [234, 88, 12], // Solo dejamos el color (Naranja Upton's)
    textColor: [255, 255, 255],
    fontStyle: 'bold'
      }
    });

    // Detalle de Gastos
    doc.text("Detalle de Egresos:", 14, (doc as any).lastAutoTable.finalY + 10);
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 15,
      head: [['Fecha', 'Categoría', 'Descripción', 'Monto']],
      body: stats.rawExpenses.map(e => [e.date, e.category, e.description, `$${e.amount}`]),
    });

    doc.save(`Balance_${month}_${year}.pdf`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      {/* HEADER Y FILTROS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3 uppercase italic">
            <Scale className="text-orange-500" /> Balance Mensual
          </h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2">
            Análisis de rentabilidad por periodo
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-slate-900 p-3 rounded-2xl border border-slate-800 shadow-xl">
          <div className="flex items-center gap-2 px-3">
            <Filter size={16} className="text-orange-500" />
            <select 
              value={month} 
              onChange={(e) => setMonth(Number(e.target.value))}
              className="bg-transparent text-white font-bold text-sm outline-none"
            >
              <option value={1}>Enero</option>
              <option value={2}>Febrero</option>
              <option value={3}>Marzo</option>
              <option value={4}>Abril</option>
              <option value={5}>Mayo</option>
              <option value={6}>Junio</option>
              <option value={7}>Julio</option>
              <option value={8}>Agosto</option>
              <option value={9}>Septiembre</option>
              <option value={10}>Octubre</option>
              <option value={11}>Noviembre</option>
              <option value={12}>Diciembre</option>
            </select>
            <input 
              type="number" 
              value={year} 
              onChange={(e) => setYear(Number(e.target.value))}
              className="bg-transparent text-white font-bold text-sm w-20 outline-none border-l border-slate-700 pl-2"
            />
          </div>
          <button 
            onClick={exportToPDF}
            className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all"
          >
            <FileDown size={16} /> PDF
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-orange-500" size={40} /></div>
      ) : (
        <>
          {/* TARJETAS DE RESULTADOS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] shadow-xl">
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Ingresos Periodo</p>
              <h2 className="text-3xl font-black text-emerald-400 font-mono">${stats.ingresos.toLocaleString()}</h2>
              <div className="mt-4 flex items-center gap-2 text-emerald-500/50 text-[10px] font-bold uppercase"><ArrowUpCircle size={14}/> Cobros realizados</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] shadow-xl">
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Gastos Periodo</p>
              <h2 className="text-3xl font-black text-red-400 font-mono">${stats.egresos.toLocaleString()}</h2>
              <div className="mt-4 flex items-center gap-2 text-red-500/50 text-[10px] font-bold uppercase"><ArrowDownCircle size={14}/> Salidas de caja</div>
            </div>

            <div className={`p-6 rounded-[2rem] shadow-2xl border-2 transition-all ${stats.utilidad >= 0 ? 'bg-slate-800 border-orange-500/30' : 'bg-red-950/20 border-red-500/30'}`}>
              <p className={`${stats.utilidad >= 0 ? 'text-orange-500' : 'text-red-500'} text-[10px] font-black uppercase tracking-widest mb-1`}>Resultado Neto</p>
              <h2 className="text-3xl font-black font-mono text-white">${stats.utilidad.toLocaleString()}</h2>
              <p className="text-[10px] mt-4 font-bold text-slate-400 uppercase tracking-tighter">Rentabilidad: {stats.margen}%</p>
            </div>
          </div>

          {/* GRÁFICO DE DISTRIBUCIÓN */}
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-[3rem] shadow-2xl">
            <h3 className="text-white font-black uppercase italic mb-8 flex items-center gap-2 text-sm tracking-widest">
               Salud Financiera de {month}/{year}
            </h3>
            <div className="flex h-16 w-full rounded-2xl overflow-hidden border-4 border-slate-800 bg-slate-800 shadow-inner">
              <div 
                style={{ width: `${stats.ingresos > 0 ? (stats.egresos / stats.ingresos) * 100 : 0}%` }} 
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