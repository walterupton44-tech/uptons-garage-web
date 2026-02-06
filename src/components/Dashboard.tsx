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
      // 1. Obtener Ingresos Totales
      const { data: inv } = await supabase.from("invoices").select("total");
      const ingresos = inv?.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0) || 0;

      // 2. Obtener Gastos Totales
      const { data: exp } = await supabase.from("expenses").select("amount");
      const gastos = exp?.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0) || 0;

      // 3. Obtener Conteos de Clientes y Vehículos
      const { count: countClients } = await supabase.from("clients").select("*", { count: 'exact', head: true });
      const { count: countVehicles } = await supabase.from("vehicles").select("*", { count: 'exact', head: true });

      // 4. Obtener Órdenes en Proceso
      const { count: countOrders } = await supabase
        .from("service_orders")
        .select("*", { count: 'exact', head: true })
        .eq("status", "en_proceso");

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
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* SECCIÓN DE BIENVENIDA */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">
            Panel de <span className="text-orange-500">Control</span>
          </h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mt-1">
            Resumen operativo y financiero del taller
          </p>
        </div>
        <div className="bg-slate-900 px-4 py-2 rounded-xl border border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Estado: <span className="text-emerald-500">En Línea</span>
        </div>
      </header>

      {/* KPIs PRINCIPALES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* INGRESOS */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] hover:border-emerald-500/50 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500">
              <TrendingUp size={24} />
            </div>
            <ArrowUpRight className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Ingresos Brutos</p>
          <h2 className="text-3xl font-black text-white mt-1 font-mono">${stats.ingresos.toLocaleString()}</h2>
        </div>

        {/* GASTOS */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] hover:border-red-500/50 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-red-500/10 rounded-2xl text-red-500">
              <Wallet size={24} />
            </div>
            <ArrowDownRight className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Gastos Totales</p>
          <h2 className="text-3xl font-black text-white mt-1 font-mono">-${stats.gastos.toLocaleString()}</h2>
        </div>

        {/* CLIENTES */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] hover:border-blue-500/50 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
              <Users size={24} />
            </div>
          </div>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Cartera Clientes</p>
          <h2 className="text-3xl font-black text-white mt-1 font-mono">{stats.totalClientes}</h2>
        </div>

        {/* ÓRDENES ACTIVAS */}
        <div className="bg-slate-800 border-2 border-orange-500/20 p-6 rounded-[2rem] shadow-xl shadow-orange-500/5 group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-orange-500 rounded-2xl text-white">
              <ClipboardList size={24} />
            </div>
          </div>
          <p className="text-orange-500 text-[10px] font-black uppercase tracking-widest">Autos en Taller</p>
          <h2 className="text-3xl font-black text-white mt-1 font-mono">{stats.ordenesActivas}</h2>
        </div>
      </div>

      {/* SECCIÓN INFERIOR: GRÁFICO Y ALERTAS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ANALISIS DE RENTABILIDAD */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-8 rounded-[3rem]">
          <h3 className="text-white font-black uppercase italic mb-8 flex items-center gap-2 tracking-widest">
            Rendimiento del Negocio
          </h3>
          
          <div className="space-y-10">
            {/* Barra comparativa Ingresos vs Gastos */}
            <div className="space-y-3">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                <span className="text-slate-400">Distribución de Ingresos</span>
                <span className="text-orange-500">{stats.margen}% Rentabilidad</span>
              </div>
              <div className="h-16 w-full bg-slate-800 rounded-2xl overflow-hidden flex p-1 border border-slate-700">
                <div 
                  style={{ width: `${(stats.gastos / stats.ingresos) * 100}%` }} 
                  className="bg-red-500/80 rounded-xl flex items-center justify-center text-[10px] font-black text-white italic transition-all duration-1000"
                >
                  Gastos
                </div>
                <div 
                  style={{ width: `${stats.margen}%` }} 
                  className="bg-emerald-500 rounded-xl ml-1 flex items-center justify-center text-[10px] font-black text-white italic transition-all duration-1000"
                >
                  Utilidad
                </div>
              </div>
            </div>

            {/* Stats Rápidos */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-800">
                <p className="text-[10px] text-slate-500 font-black uppercase">Utilidad Neta</p>
                <p className={`text-xl font-black ${stats.utilidad >= 0 ? 'text-white' : 'text-red-500'}`}>
                  ${stats.utilidad.toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-800">
                <p className="text-[10px] text-slate-500 font-black uppercase">Flota Registrada</p>
                <p className="text-xl font-black text-white">{stats.totalVehiculos} Vehículos</p>
              </div>
            </div>
          </div>
        </div>

        {/* ALERTAS / ESTADO RÁPIDO */}
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-[3rem] flex flex-col">
          <h3 className="text-white font-black uppercase italic mb-6 text-sm tracking-widest">
            Avisos del Sistema
          </h3>
          <div className="space-y-4 flex-1">
            {stats.ordenesActivas > 5 && (
              <div className="flex gap-4 p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl">
                <AlertCircle className="text-orange-500 shrink-0" />
                <p className="text-xs text-slate-300 font-medium">Capacidad de taller alta. Considera programar nuevos turnos para la próxima semana.</p>
              </div>
            )}
            
            <div className="flex gap-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
              <Car className="text-blue-500 shrink-0" />
              <p className="text-xs text-slate-300 font-medium">Hay {stats.totalVehiculos} vehículos registrados en la base de datos para seguimiento.</p>
            </div>

            <div className="flex gap-4 p-4 bg-slate-800 border border-slate-700 rounded-2xl">
              <DollarSign className="text-slate-500 shrink-0" />
              <p className="text-xs text-slate-300 font-medium">El balance actual refleja un margen de ganancia del {stats.margen}% sobre el total bruto.</p>
            </div>
          </div>
          
          <button 
            onClick={() => window.location.href = '/agenda'}
            className="w-full mt-6 bg-slate-800 hover:bg-slate-700 text-white font-black py-4 rounded-2xl transition-all text-[10px] uppercase tracking-widest"
          >
            Ver Agenda Completa
          </button>
        </div>
      </div>
    </div>
  );
}