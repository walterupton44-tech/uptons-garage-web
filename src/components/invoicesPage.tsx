import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { 
  Receipt, Search, DollarSign, FileCheck, ArrowLeftRight, Wallet 
} from "lucide-react";

export default function Facturacion() {
  const [items, setItems] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [clienteSel, setClienteSel] = useState<any>(null);
  const [metodoPago, setMetodoPago] = useState("Efectivo");
  const [presupuestos, setPresupuestos] = useState<any[]>([]);
  const [busquedaP, setBusquedaP] = useState("");
  const [isCargando, setIsCargando] = useState(false);

  // ESTADOS NUEVOS PARA PAGOS PARCIALES
  const [esPagoParcial, setEsPagoParcial] = useState(false);
  const [montoEntrega, setMontoEntrega] = useState<number>(0);

  // 1. CARGA DE DATOS
  useEffect(() => {
    const fetchData = async () => {
      const { data: cData } = await supabase.from("clients").select("*").order("name");
      setClientes(cData || []);
      fetchPresupuestos("");
    };
    fetchData();
  }, []);

  // 2. BÚSQUEDA SEGURA (Sin error 400)
  const fetchPresupuestos = async (termino = "") => {
    try {
      let query = supabase
        .from("presupuestos_guardados")
        .select("*")
        .order("created_at", { ascending: false });

      if (termino.trim()) {
        query = query.ilike("cliente_nombre", `%${termino}%`);
      } else {
        query = query.limit(10);
      }

      const { data, error } = await query;
      if (error) throw error;
      setPresupuestos(data || []);
    } catch (err) {
      console.error("Error en búsqueda:", err);
    }
  };

  const total = items.reduce((acc, i) => acc + (Number(i.total) || 0), 0);

  // Al cambiar el total, si no es pago parcial, la entrega es el total
  useEffect(() => {
    if (!esPagoParcial) setMontoEntrega(total);
  }, [total, esPagoParcial]);

  const importarPresupuesto = (p: any) => {
    setItems(p.items || []);
    const cliente = clientes.find(c => c.id === p.cliente_id);
    setClienteSel(cliente || { id: p.cliente_id, name: p.cliente_nombre });
  };

  // 3. FINALIZAR VENTA CON LÓGICA DE DEUDA
  const finalizarFactura = async () => {
    if (!clienteSel || items.length === 0) {
      alert("Selecciona un cliente y un presupuesto.");
      return;
    }

    setIsCargando(true);
    const saldoPendiente = total - montoEntrega;
    const estadoFinal = (esPagoParcial && saldoPendiente > 0) ? 'pendiente' : 'pagada';

    try {
      const { data, error } = await supabase.from("facturas").insert([{
        cliente_id: clienteSel.id,
        items: items, 
        total: total,
        subtotal: total,
        monto_pagado: montoEntrega, // Asegúrate de tener esta columna en tu tabla
        metodo_pago: metodoPago,
        estado: estadoFinal
      }]).select();

      if (error) throw error;

      alert(estadoFinal === 'pendiente' 
        ? `Venta registrada. Queda un saldo de $${saldoPendiente.toLocaleString()}` 
        : "Venta cobrada totalmente con éxito.");

      // Limpiar todo
      setItems([]);
      setClienteSel(null);
      setEsPagoParcial(false);
      setMontoEntrega(0);
      setBusquedaP("");
      fetchPresupuestos("");

    } catch (err: any) {
      alert("Error al guardar: " + err.message);
    } finally {
      setIsCargando(false);
    }
  };

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-white grid grid-cols-1 lg:grid-cols-4 gap-6 font-sans">
      
      {/* COLUMNA IZQUIERDA: BUSCADOR Y PAGOS */}
      <div className="lg:col-span-1 space-y-6">
        {/* Buscador */}
        <div className="bg-slate-800 p-5 rounded-3xl border border-slate-700 shadow-xl flex flex-col h-[500px]">
          <h2 className="text-[10px] font-black text-amber-500 uppercase mb-4 tracking-widest flex items-center gap-2">
            <Search size={14}/> Presupuestos
          </h2>
          <input 
            type="text"
            placeholder="Buscar cliente..."
            className="w-full bg-slate-950 border border-slate-700 p-3 rounded-xl text-xs outline-none focus:border-amber-500 transition-all mb-4"
            value={busquedaP}
            onChange={(e) => { setBusquedaP(e.target.value); fetchPresupuestos(e.target.value); }}
          />
          <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
            {presupuestos.map(p => (
              <button key={p.id} onClick={() => importarPresupuesto(p)} className="w-full text-left p-4 rounded-xl bg-slate-900/50 border border-slate-700 hover:border-emerald-500 transition-all group">
                <p className="text-[10px] font-bold text-slate-300 uppercase truncate">{p.cliente_nombre}</p>
                <p className="text-sm text-emerald-400 font-mono font-bold">${(p.total || 0).toLocaleString()}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Configuración de Cobro */}
        <div className="bg-slate-800 p-5 rounded-3xl border border-slate-700 shadow-xl space-y-4">
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cobro</h2>
          
          <div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-700">
            <span className="text-[10px] font-bold text-slate-300 uppercase italic">¿Pago Parcial?</span>
            <input 
              type="checkbox" 
              className="w-4 h-4 accent-emerald-500"
              checked={esPagoParcial}
              onChange={(e) => setEsPagoParcial(e.target.checked)}
            />
          </div>

          {esPagoParcial && (
            <div className="space-y-2">
              <label className="text-[9px] font-bold text-amber-500 uppercase ml-1">Monto que entrega</label>
              <input 
                type="number"
                className="w-full bg-slate-950 p-3 rounded-xl border border-amber-500/50 text-sm outline-none text-amber-400 font-mono"
                value={montoEntrega}
                onChange={(e) => setMontoEntrega(Number(e.target.value))}
              />
              <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-[9px] text-red-400 font-bold uppercase">Deuda: ${(total - montoEntrega).toLocaleString()}</p>
              </div>
            </div>
          )}

          <select 
            className="w-full bg-slate-900 p-3 rounded-xl border border-slate-700 text-xs outline-none focus:border-emerald-500"
            value={metodoPago}
            onChange={(e) => setMetodoPago(e.target.value)}
          >
            <option value="Efectivo">Efectivo</option>
            <option value="Transferencia">Transferencia</option>
            <option value="Tarjeta">Tarjeta</option>
          </select>
        </div>
      </div>

      {/* COLUMNA DERECHA: PANEL PRINCIPAL */}
      <div className="lg:col-span-3 bg-slate-800 rounded-[2.5rem] border border-slate-700 flex flex-col shadow-2xl overflow-hidden">
        <div className="p-8 border-b border-slate-700 flex flex-col md:flex-row justify-between items-center bg-slate-800/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center transform -rotate-3 shadow-lg">
              <Receipt className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tighter italic">Caja de Facturación</h2>
              {clienteSel && <p className="text-[10px] text-emerald-500 font-bold uppercase">Cliente: {clienteSel.name}</p>}
            </div>
          </div>
          <div className="bg-slate-950 px-6 py-3 rounded-2xl border border-slate-700 text-right">
            <p className="text-[9px] font-bold text-slate-500 uppercase">Total a Facturar</p>
            <span className="text-3xl font-black text-emerald-400 font-mono">${total.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex-1 p-8">
          <table className="w-full text-left border-separate border-spacing-y-2">
            <thead>
              <tr className="text-[10px] font-black text-slate-500 uppercase">
                <th className="px-4">Detalle</th>
                <th className="px-4 text-right">Precio</th>
                <th className="px-4 text-center">Cant.</th>
                <th className="px-4 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i, idx) => (
                <tr key={idx} className="bg-slate-900/50 group">
                  <td className="px-4 py-4 rounded-l-xl text-sm font-bold uppercase">{i.desc || i.descripcion}</td>
                  <td className="px-4 py-4 text-right font-mono text-slate-400">${(i.unit || i.precio || 0).toLocaleString()}</td>
                  <td className="px-4 py-4 text-center"><span className="bg-slate-800 px-2 py-1 rounded text-amber-500 font-bold text-xs">{i.cant || i.cantidad}</span></td>
                  <td className="px-4 py-4 text-right font-black rounded-r-xl">${(i.total || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && <p className="text-center text-slate-600 mt-20 uppercase text-[10px] font-black tracking-[0.2em]">Esperando datos de presupuesto...</p>}
        </div>

        <div className="p-8 bg-slate-900/50 border-t border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Wallet className="text-slate-500" size={20} />
            <div className="text-[9px] font-bold text-slate-500 uppercase">
              Estado: <span className={esPagoParcial ? "text-amber-500" : "text-emerald-500"}>{esPagoParcial ? "Cobro Parcial / Deuda" : "Cobro Total"}</span>
            </div>
          </div>
          <button 
            onClick={finalizarFactura}
            disabled={isCargando || items.length === 0}
            className={`px-10 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
              items.length === 0 ? "bg-slate-700 text-slate-500" : "bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-900/20 active:scale-95"
            }`}
          >
            {isCargando ? "Procesando..." : "Confirmar Venta"}
          </button>
        </div>
      </div>
    </div>
  );
}