import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { Wallet, PlusCircle, History, CheckCircle2, Clock } from "lucide-react";

export default function CuentasCorrientes() {
  const [deudores, setDeudores] = useState<any[]>([]);
  const [montoAbono, setMontoAbono] = useState<{[key: string]: number}>({});

  useEffect(() => {
    fetchDeudores();
  }, []);

  const fetchDeudores = async () => {
    // Traemos facturas pendientes e incluimos el nombre del cliente
    const { data } = await supabase
      .from("facturas")
      .select(`*, clients(name)`)
      .eq("estado", "pendiente")
      .order("created_at", { ascending: false });
    setDeudores(data || []);
  };

  const registrarAbono = async (factura: any) => {
    const monto = montoAbono[factura.id] || 0;
    if (monto <= 0) return alert("Ingresa un monto válido");

    const nuevoMontoPagado = Number(factura.monto_pagado) + monto;
    const nuevoEstado = nuevoMontoPagado >= factura.total ? 'pagada' : 'pendiente';

    try {
      // 1. Registrar en el historial
      await supabase.from("historial_pagos").insert([{
        factura_id: factura.id,
        monto_abonado: monto,
        metodo_pago: "Efectivo/Abono"
      }]);

      // 2. Actualizar la factura
      await supabase.from("facturas")
        .update({ 
          monto_pagado: nuevoMontoPagado,
          estado: nuevoEstado 
        })
        .eq("id", factura.id);

      alert(nuevoEstado === 'pagada' ? "¡Deuda cancelada!" : "Abono registrado con éxito");
      setMontoAbono({ ...montoAbono, [factura.id]: 0 });
      fetchDeudores();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 bg-slate-900 min-h-screen text-white">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-900/40">
          <Wallet className="text-slate-900" size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter italic">Cuentas Corrientes</h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Gestión de saldos y deudores</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {deudores.map((d) => {
          const saldo = d.total - d.monto_pagado;
          return (
            <div key={d.id} className="bg-slate-800 border border-slate-700 p-6 rounded-[2rem] shadow-xl relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Deudor</p>
                  <h3 className="text-lg font-bold uppercase">{d.clients?.name || "Cliente Desconocido"}</h3>
                </div>
                <Clock className="text-slate-600" size={20} />
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Total Factura:</span>
                  <span className="font-mono">${d.total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-emerald-400">
                  <span>Ya pagado:</span>
                  <span className="font-mono">${d.monto_pagado.toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t border-slate-700 flex justify-between">
                  <span className="text-sm font-black uppercase text-red-400">Resta pagar:</span>
                  <span className="text-xl font-black text-red-400 font-mono">${saldo.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <input 
                  type="number" 
                  placeholder="Monto..."
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 text-sm font-mono outline-none focus:border-amber-500 transition-all"
                  value={montoAbono[d.id] || ""}
                  onChange={(e) => setMontoAbono({...montoAbono, [d.id]: Number(e.target.value)})}
                />
                <button 
                  onClick={() => registrarAbono(d)}
                  className="bg-emerald-600 hover:bg-emerald-500 p-3 rounded-xl transition-all active:scale-95"
                >
                  <PlusCircle size={20} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {deudores.length === 0 && (
        <div className="text-center py-20 opacity-20">
          <CheckCircle2 size={64} className="mx-auto mb-4" />
          <p className="font-black uppercase tracking-[0.3em]">No hay deudas pendientes</p>
        </div>
      )}
    </div>
  );
}