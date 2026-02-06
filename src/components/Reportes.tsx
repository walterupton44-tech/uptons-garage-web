import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { 
  BarChart3, TrendingUp, Calendar, 
  Wallet, CreditCard, Banknote, 
  ChevronRight, ArrowUpRight 
} from "lucide-react";

export default function ReportesIngresos() {
  const [metricas, setMetricas] = useState({
    totalMes: 0,
    efectivo: 0,
    transferencia: 0,
    tarjeta: 0,
    cantidadVentas: 0
  });
  const [ultimasFacturas, setUltimasFacturas] = useState<any[]>([]);

  useEffect(() => {
    const calcularReporte = async () => {
      // Obtenemos el primer día del mes actual
      const inicioMes = new Date();
      inicioMes.setDate(1);
      inicioMes.setHours(0, 0, 0, 0);

      const { data: facturas } = await supabase
        .from("facturas")
        .select("*")
        .gte("created_at", inicioMes.toISOString())
        .order("created_at", { ascending: false });

      if (facturas) {
        const stats = facturas.reduce((acc, f) => {
          acc.totalMes += f.total;
          acc.cantidadVentas += 1;
          if (f.metodo_pago === 'Efectivo') acc.efectivo += f.total;
          if (f.metodo_pago === 'Transferencia') acc.transferencia += f.total;
          if (f.metodo_pago.includes('Tarjeta')) acc.tarjeta += f.total;
          return acc;
        }, { totalMes: 0, efectivo: 0, transferencia: 0, tarjeta: 0, cantidadVentas: 0 });

        setMetricas(stats);
        setUltimasFacturas(facturas.slice(0, 5));
      }
    };

    calcularReporte();
  }, []);

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-white space-y-6">
      
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter">Dashboard Financiero</h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Rendimiento del mes actual</p>
        </div>
        <div className="bg-slate-800 p-3 rounded-2xl border border-slate-700 flex items-center gap-3">
          <Calendar className="text-amber-500" size={20}/>
          <span className="text-sm font-black">{new Date().toLocaleString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase()}</span>
        </div>
      </div>

      {/* CARDS DE MÉTRICAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          titulo="Total Facturado" 
          valor={metricas.totalMes} 
          icon={<TrendingUp className="text-emerald-400" />} 
          color="border-emerald-500/20"
        />
        <MetricCard 
          titulo="Efectivo" 
          valor={metricas.efectivo} 
          icon={<Banknote className="text-amber-400" />} 
          color="border-amber-500/20"
        />
        <MetricCard 
          titulo="Transferencias" 
          valor={metricas.transferencia} 
          icon={<Wallet className="text-blue-400" />} 
          color="border-blue-500/20"
        />
        <MetricCard 
          titulo="Tarjetas" 
          valor={metricas.tarjeta} 
          icon={<CreditCard className="text-purple-400" />} 
          color="border-purple-500/20"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LISTADO DE ÚLTIMAS VENTAS */}
        <div className="lg:col-span-2 bg-slate-800 rounded-[2.5rem] border border-slate-700 overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-slate-700 flex justify-between items-center">
            <h3 className="font-black uppercase text-xs tracking-widest text-slate-400">Últimos movimientos</h3>
            <span className="bg-slate-900 px-3 py-1 rounded-full text-[10px] font-bold">{metricas.cantidadVentas} Ventas</span>
          </div>
          <div className="divide-y divide-slate-700/50">
            {ultimasFacturas.map((f) => (
              <div key={f.id} className="p-4 flex justify-between items-center hover:bg-slate-700/20 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center border border-slate-700">
                    <ArrowUpRight size={18} className="text-emerald-500"/>
                  </div>
                  <div>
                    <p className="text-sm font-bold">{f.cliente_nombre}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">{f.metodo_pago} • {new Date(f.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <p className="font-mono font-black text-white">${f.total.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        {/* RESUMEN RÁPIDO */}
        <div className="bg-gradient-to-br from-amber-600 to-orange-700 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-orange-900/20 flex flex-col justify-between">
          <div>
            <BarChart3 size={40} className="mb-4 opacity-50" />
            <h3 className="text-2xl font-black leading-tight mb-2 italic uppercase">Objetivo Mensual</h3>
            <p className="text-orange-100 text-sm font-medium opacity-80 italic">Continúa registrando todas tus facturas para tener un balance real a fin de mes.</p>
          </div>
          <div className="mt-8 pt-6 border-t border-white/20">
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Promedio por Venta</p>
            <p className="text-3xl font-black font-mono">
              ${metricas.cantidadVentas > 0 ? (metricas.totalMes / metricas.cantidadVentas).toLocaleString(undefined, {maximumFractionDigits: 0}) : 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ titulo, valor, icon, color }: any) {
  return (
    <div className={`bg-slate-800 p-6 rounded-3xl border ${color} shadow-xl`}>
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-slate-900 rounded-lg">{icon}</div>
      </div>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{titulo}</p>
      <p className="text-2xl font-black font-mono tracking-tighter">${valor.toLocaleString()}</p>
    </div>
  );
}