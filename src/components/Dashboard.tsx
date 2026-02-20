import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { 
  TrendingUp, Users, Car, ClipboardList, Wallet, 
  AlertCircle, ArrowUpRight, ArrowDownRight, Loader2 
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
      // 1. Obtener Ingresos Totales de la tabla FACTURAS (usando monto_pagado para dinero real)
      const { data: fact } = await supabase.from("facturas").select("monto_pagado");
      const ingresos = fact?.reduce((acc, curr) => acc + (Number(curr.monto_pagado) || 0), 0) || 0;

      // 2. Obtener Gastos Totales
      const { data: exp } = await supabase.from("expenses").select("amount");
      const gastos = exp?.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0) || 0;

      // 3. Conteos
      const { count: countClients } = await supabase.from("clients").select("*", { count: 'exact', head: true });
      const { count: countVehicles } = await supabase.from("vehicles").select("*", { count: 'exact', head: true });
      const { count: countOrders } = await supabase
        .from("service_orders")
        .select("*", { count: 'exact', head: true })
        .neq("status", "FINALIZADO");

      const utilidad = ingresos - gastos;
      const margen = ingresos > 0 ? Math.round((utilidad / ingresos) * 100) : 0;

      setStats({
        ingresos, gastos, utilidad,
        totalClientes: countClients || 0,
        totalVehiculos: countVehicles || 0,
        ordenesActivas: countOrders || 0,
        margen
      });
    } catch (error) {
      console.error("Error Dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-orange-500" size={48} />
      <p className="text-slate-500 font-black uppercase text-xs">Sincronizando Upton's Garage...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700 p-6">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-white italic uppercase italic">Panel de <span className="text-orange-500">Control</span></h1>
          <p className="text-slate-500 text-xs font-bold uppercase mt-1">Ingresos basados en pagos reales</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem]">
          <TrendingUp className="text-emerald-500 mb-4" size={24} />
          <p className="text-slate-500 text-[10px] font-black uppercase">Ingresos Reales</p>
          <h2 className="text-3xl font-black text-white font-mono">${stats.ingresos.toLocaleString()}</h2>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem]">
          <Wallet className="text-red-500 mb-4" size={24} />
          <p className="text-slate-500 text-[10px] font-black uppercase">Gastos Totales</p>
          <h2 className="text-3xl font-black text-white font-mono">-${stats.gastos.toLocaleString()}</h2>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem]">
          <Users className="text-blue-500 mb-4" size={24} />
          <p className="text-slate-500 text-[10px] font-black uppercase">Clientes</p>
          <h2 className="text-3xl font-black text-white font-mono">{stats.totalClientes}</h2>
        </div>
        <div className="bg-slate-800 border-2 border-orange-500/20 p-6 rounded-[2rem]">
          <ClipboardList className="text-orange-500 mb-4" size={24} />
          <p className="text-orange-500 text-[10px] font-black uppercase">Órdenes Activas</p>
          <h2 className="text-3xl font-black text-white font-mono">{stats.ordenesActivas}</h2>
        </div>
      </div>
    </div>
  );
}