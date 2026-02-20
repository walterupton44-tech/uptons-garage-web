import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { 
  TrendingUp, 
  Users, 
  Car, 
  ClipboardList, 
  DollarSign, 
  Wallet, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Loader2
} from "lucide-react";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    ingresos: 0,
    gastos: 0,
    utilidad: 0,
    totalClientes: 0,
    totalVehiculos: 0,
    ordenesActivas: 0,
    margen: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Obtener Ingresos Reales desde la tabla 'facturas'
      // Usamos 'monto_pagado' porque es lo que realmente entró a caja (evita inflar con deudas)
      const { data: fact } = await supabase.from("facturas").select("monto_pagado");
      const ingresos = fact?.reduce((acc, curr) => acc + (Number(curr.monto_pagado) || 0), 0) || 0;

      // 2. Obtener Gastos Totales
      const { data: exp } = await supabase.from("expenses").select("amount");
      const gastos = exp?.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0) || 0;

      // 3. Obtener Conteos de Clientes y Vehículos
      const { count: countClients } = await supabase.from("clients").select("*", { count: 'exact', head: true });
      const { count: countVehicles } = await supabase.from("vehicles").select("*", { count: 'exact', head: true });

      // 4. Obtener Órdenes Activas (Todo lo que NO esté FINALIZADO)
      const { count: countOrders } = await supabase
        .from("service_orders")
        .select("*", { count: 'exact', head: true })
        .neq("status", "FINALIZADO"); // Cambiado para incluir PENDIENTE y EN PROCESO

      const utilidad = ingresos - gastos;
      const margen = ingresos > 0 ? Math.round((utilidad / ingresos) * 100) : 0;

      setStats({
        ingresos,
        gastos,
        utilidad,
        totalClientes: countClients || 0,
        totalVehiculos: countVehicles || 0,
        ordenesActivas: countOrders || 0,
        margen
      });
    } catch (error) {
      console.error("Error al cargar dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-orange-500" size={48} />
      <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Sincronizando Upton's Garage...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700 p-4 md:p-6">
      {/* SECCIÓN DE BIENVENIDA */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">
            Panel de <span className="text-orange-500">Control</span>
          </h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mt-1">
            Basado en facturación real y flujo de caja
          </p>
        </div>
        <div className="bg-slate-900 px-4 py-2 rounded-xl border border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Estado: <span className="text-emerald-500">Sincronizado</span>
        </div>
      </header>

      {/* KPIs PRINCIPALES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] hover:border-emerald-500/50 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500">
              <TrendingUp size={24} />
            </div>
            <ArrowUpRight className="text-emerald-500 opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Caja Real (Pagado)</p>
          <h2 className="text-3xl font-black text-white mt-1 font-mono">${stats.ingresos.toLocaleString()}</h2>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] hover:border-red-500/50 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-red-500/10 rounded-2xl text-red-500">
              <Wallet size={24} />
            </div>
            <ArrowDownRight className="text-red-500 opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Gastos Totales</p>
          <h2 className="text-3xl font-black text-white mt-1 font-mono">-${stats.gastos.toLocaleString()}</h2>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] hover:border-blue-500/50 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
              <Users size={24} />
            </div>
          </div>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Cartera Clientes</p>
          <h2 className="text-3xl font-black text-white mt-1 font-mono">{stats.totalClientes}</h2>
        </div>

        <div className="bg-slate-800 border-2 border-orange-500/20 p-6 rounded-[2rem] shadow-xl shadow-orange-500/5 group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-orange-500 rounded-2xl text-white">
              <ClipboardList size={24} />
            </div>
          </div>
          <p className="text-orange-500 text-[10px] font-black uppercase tracking-widest">Vehículos en Taller</p>
          <h2 className="text-3xl font-black text-white mt-1 font-mono">{stats.ordenesActivas}</h2>
        </div>
      </div>

      {/* SECCIÓN INFERIOR: ANÁLISIS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-8 rounded-[3rem]">
          <h3 className="text-white font-black uppercase italic mb-8 flex items-center gap-2 tracking-widest">
            Rendimiento Neto
          </h3>
          
          <div className="space-y-10">
            <div className="space-y-3">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                <span className="text-slate-400">Balance de Capital</span>
                <span className={stats.margen >= 0 ? "text-emerald-500" : "text-red-500"}>{stats.margen}% Eficiencia</span>
              </div>
              <div className="h-16 w-full bg-slate-800 rounded-2xl overflow-hidden flex p-1 border border-slate-700">
                <div 
                  style={{ width: `${stats.ingresos > 0 ? (stats.gastos / stats.ingresos) * 100 : 0}%` }} 
                  className="bg-red-500/80 rounded-xl flex items-center justify-center text-[10px] font-black text-white italic transition-all duration-1000 min-w-[20px]"
                >
                  Gastos
                </div>
                <div 
                  style={{ width: `${stats.margen > 0 ? stats.margen : 0}%` }} 
                  className="bg-emerald-500 rounded-xl ml-1 flex items-center justify-center text-[10px] font-black text-white italic transition-all duration-1000"
                >
                  Utilidad
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
                <p className="text-[10px] text-slate-500 font-black uppercase">Utilidad Actual</p>
                <p className={`text-xl font-black ${stats.utilidad >= 0 ? 'text-emerald-400' : 'text-red-500'}`}>
                  ${stats.utilidad.toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
                <p className="text-[10px] text-slate-500 font-black uppercase">Flota Total</p>
                <p className="text-xl font-black text-white">{stats.totalVehiculos} Unidades</p>
              </div>
            </div>
          </div>
        </div>

        {/* ALERTAS DINÁMICAS */}
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-[3rem] flex flex-col">
          <h3 className="text-white font-black uppercase italic mb-6 text-sm tracking-widest">Alertas</h3>
          <div className="space-y-4 flex-1">
            {stats.ordenesActivas > 0 && (
              <div className="flex gap-4 p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl">
                <AlertCircle className="text-orange-500 shrink-0" />
                <p className="text-xs text-slate-300 font-medium">Hay {stats.ordenesActivas} órdenes activas. Recuerda facturarlas al finalizar.</p>
              </div>
            )}
            
            <div className="flex gap-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
              <Car className="text-blue-500 shrink-0" />
              <p className="text-xs text-slate-300 font-medium">Base de datos optimizada: {stats.totalVehiculos} vehículos activos.</p>
            </div>

            <div className="flex gap-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
              <DollarSign className="text-emerald-500 shrink-0" />
              <p className="text-xs text-slate-300 font-medium">Margen operativo saludable del {stats.margen}% este mes.</p>
            </div>
          </div>
          
          <button 
            onClick={() => window.location.href = '/facturacion'}
            className="w-full mt-6 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-2xl transition-all text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-900/20"
          >
            Ir a Facturación
          </button>
        </div>
      </div>
    </div>
  );
}