import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { History, ArrowUpRight, Calendar, User } from "lucide-react";

export default function HistorialCaja() {
  const [pagos, setPagos] = useState<any[]>([]);

  useEffect(() => {
    fetchHistorial();
  }, []);

  const fetchHistorial = async () => {
    // Traemos los abonos y los unimos con la factura y el cliente
    const { data, error } = await supabase
      .from("historial_pagos")
      .select(`
        id,
        monto_abonado,
        fecha_pago,
        metodo_pago,
        facturas (
          id,
          clients (name)
        )
      `)
      .order("fecha_pago", { ascending: false });

    if (!error) setPagos(data || []);
  };

  return (
    <div className="bg-slate-800/50 p-6 rounded-[2rem] border border-slate-700 mt-10">
      <div className="flex items-center gap-3 mb-6">
        <History className="text-emerald-500" size={20} />
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-300">
          Flujo de Caja Reciente (Abonos y Pagos)
        </h2>
      </div>

      <div className="space-y-3">
        {pagos.map((p) => (
          <div key={p.id} className="bg-slate-900 p-4 rounded-2xl border border-slate-700/50 flex items-center justify-between group hover:border-emerald-500/50 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500">
                <ArrowUpRight size={18} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase">{p.facturas?.clients?.name || "Cliente"}</p>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                  <Calendar size={10} />
                  {new Date(p.fecha_pago).toLocaleString()}
                  <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-400">{p.metodo_pago}</span>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-sm font-black text-emerald-400 font-mono">
                + ${p.monto_abonado.toLocaleString()}
              </p>
              <p className="text-[9px] text-slate-600 uppercase font-bold">Abono recibido</p>
            </div>
          </div>
        ))}

        {pagos.length === 0 && (
          <p className="text-center py-10 text-xs text-slate-600 uppercase font-bold">Sin movimientos de caja hoy</p>
        )}
      </div>
    </div>
  );
}