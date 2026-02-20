import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { 
  Receipt, Search, DollarSign, FileCheck, Wallet, Loader2 
} from "lucide-react";

export default function Facturacion() {
  const [items, setItems] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [clienteSel, setClienteSel] = useState<any>(null);
  const [metodoPago, setMetodoPago] = useState("Efectivo");
  const [presupuestos, setPresupuestos] = useState<any[]>([]);
  const [busquedaP, setBusquedaP] = useState("");
  const [isCargando, setIsCargando] = useState(false);

  // ESTADOS PARA PAGOS PARCIALES
  const [esPagoParcial, setEsPagoParcial] = useState(false);
  const [montoEntrega, setMontoEntrega] = useState<number>(0);

  // 1. CARGA INICIAL
  useEffect(() => {
    const fetchData = async () => {
      const { data: cData } = await supabase.from("clients").select("*").order("name");
      setClientes(cData || []);
      fetchPresupuestos("");
    };
    fetchData();
  }, []);

  // 2. BÚSQUEDA DE PRESUPUESTOS
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

  // Sincronizar monto de entrega si no es pago parcial
  useEffect(() => {
    if (!esPagoParcial) setMontoEntrega(total);
  }, [total, esPagoParcial]);

  const importarPresupuesto = (p: any) => {
    setItems(p.items || []);
    const clienteExistente = clientes.find(c => c.id === p.cliente_id);
    setClienteSel(clienteExistente || { id: p.cliente_id, name: p.cliente_nombre });
  };

  // 3. FINALIZAR VENTA (CONEXIÓN CON BALANCE)
          
 const finalizarFactura = async () => {
  if (!clienteSel || items.length === 0) {
    alert("Error: Selecciona un cliente y carga un presupuesto.");
    return;
  }

  setIsCargando(true);
  const saldoPendiente = total - montoEntrega;
  const estadoFinal = (esPagoParcial && saldoPendiente > 0) ? 'pendiente' : 'pagada';
  const fechaActual = new Date().toISOString();

  try {
    // 1. Insertamos la Factura
    const { data: facturaData, error: errorFactura } = await supabase
      .from("facturas")
      .insert([{
        cliente_id: clienteSel.id,
        items: items, 
        total: total,
        subtotal: total,
        monto_pagado: montoEntrega,
        metodo_pago: metodoPago,
        estado: estadoFinal,
        created_at: fechaActual
      }])
      .select()
      .single(); // Obtenemos el ID de la factura recién creada

    if (errorFactura) throw errorFactura;

    // 2. REGISTRAMOS EL INGRESO EN EL HISTORIAL (Para que aparezca en Caja)
    // Solo si el monto entregado es mayor a 0
    if (montoEntrega > 0) {
      const { error: errorHistorial } = await supabase
        .from("historial_pagos")
        .insert([{
          factura_id: facturaData.id,
          monto_abonado: montoEntrega,
          metodo_pago: metodoPago,
          fecha_pago: fechaActual,
          notas: estadoFinal === 'pagada' ? "Pago total venta" : "Entrega inicial"
        }]);
      
      if (errorHistorial) console.error("Error al registrar historial:", errorHistorial);
    }

    alert(estadoFinal === 'pendiente' 
      ? `¡Venta registrada! Deuda: $${saldoPendiente.toLocaleString()}` 
      : "¡Venta cobrada con éxito!");

    // Resetear formulario
    setItems([]);
    setClienteSel(null);
    setEsPagoParcial(false);
    setMontoEntrega(0);
    fetchPresupuestos("");

  } catch (err: any) {
    alert("Error al guardar: " + err.message);
  } finally {
    setIsCargando(false);
  }
};         
              
              
  return (
    <div className="p-6 bg-slate-950 min-h-screen text-white grid grid-cols-1 lg:grid-cols-4 gap-6 font-sans">
      
      {/* PANEL IZQUIERDO: SELECCIÓN */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-xl flex flex-col h-[450px]">
          <h2 className="text-[10px] font-black text-orange-500 uppercase mb-4 tracking-widest flex items-center gap-2">
            <Search size={14}/> Buscar Presupuesto
          </h2>
          <input 
            type="text"
            placeholder="Nombre del cliente..."
            className="w-full bg-slate-950 border border-slate-700 p-3 rounded-xl text-xs outline-none focus:border-orange-500 transition-all mb-4"
            value={busquedaP}
            onChange={(e) => { setBusquedaP(e.target.value); fetchPresupuestos(e.target.value); }}
          />
          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {presupuestos.map(p => (
              <button 
                key={p.id} 
                onClick={() => importarPresupuesto(p)} 
                className="w-full text-left p-4 rounded-xl bg-slate-800/40 border border-slate-700 hover:border-orange-500 transition-all group"
              >
                <p className="text-[10px] font-bold text-slate-400 uppercase truncate">{p.cliente_nombre}</p>
                <p className="text-sm text-white font-mono font-bold">${(p.total || 0).toLocaleString()}</p>
              </button>
            ))}
          </div>
        </div>

        {/* MÓDULO DE PAGO */}
        <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-xl space-y-4">
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ajustes de Cobro</h2>
          
          <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-[10px] font-bold text-slate-300 uppercase">¿Pago Parcial?</span>
            <input 
              type="checkbox" 
              className="w-4 h-4 accent-orange-500"
              checked={esPagoParcial}
              onChange={(e) => setEsPagoParcial(e.target.checked)}
            />
          </div>

          {esPagoParcial && (
            <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
              <label className="text-[9px] font-bold text-orange-500 uppercase ml-1">Monto que entrega hoy</label>
              <input 
                type="number"
                className="w-full bg-slate-950 p-3 rounded-xl border border-orange-500/50 text-sm outline-none text-orange-400 font-mono"
                value={montoEntrega}
                onChange={(e) => setMontoEntrega(Number(e.target.value))}
              />
              <p className="text-[9px] text-red-400 font-bold uppercase text-right">Por cobrar: ${(total - montoEntrega).toLocaleString()}</p>
            </div>
          )}

          <select 
            className="w-full bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs outline-none focus:border-emerald-500 text-slate-300"
            value={metodoPago}
            onChange={(e) => setMetodoPago(e.target.value)}
          >
            <option value="Efectivo">Efectivo</option>
            <option value="Transferencia">Transferencia</option>
            <option value="Tarjeta">Tarjeta</option>
          </select>
        </div>
      </div>

      {/* PANEL DERECHO: FACTURA ACTUAL */}
      <div className="lg:col-span-3 bg-slate-900 rounded-[2.5rem] border border-slate-800 flex flex-col shadow-2xl overflow-hidden">
        <div className="p-8 border-b border-slate-800 flex flex-col md:flex-row justify-between items-center bg-slate-900/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-900/20">
              <Receipt className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase italic tracking-tighter">Generar Factura</h2>
              {clienteSel && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">
                    {clienteSel.name || clienteSel.cliente_nombre}
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="bg-black/40 px-6 py-4 rounded-2xl border border-slate-800 text-right">
            <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Total Neto</p>
            <span className="text-4xl font-black text-white font-mono">${total.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex-1 p-8 overflow-y-auto">
          <table className="w-full text-left border-separate border-spacing-y-3">
            <thead>
              <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <th className="px-4 pb-2">Descripción</th>
                <th className="px-4 pb-2 text-right">Unitario</th>
                <th className="px-4 pb-2 text-center">Cant.</th>
                <th className="px-4 pb-2 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i, idx) => (
                <tr key={idx} className="bg-slate-800/30 group transition-all">
                  <td className="px-4 py-4 rounded-l-2xl text-xs font-bold uppercase text-slate-300">
                    {i.desc || i.descripcion || "Servicio Upton's"}
                  </td>
                  <td className="px-4 py-4 text-right font-mono text-slate-500 text-xs">
                    ${(Number(i.unit || i.precio) || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="bg-slate-900 px-3 py-1 rounded-lg text-orange-500 font-black text-[10px] border border-slate-700">
                      {i.cant || i.cantidad || 1}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right font-black text-white rounded-r-2xl">
                    ${(Number(i.total) || 0).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 opacity-10">
              <FileCheck size={80} />
              <p className="text-[10px] font-black uppercase mt-4">Documento vacío</p>
            </div>
          )}
        </div>

        {/* PIE DE FACTURA */}
        <div className="p-8 bg-black/20 border-t border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${esPagoParcial ? 'bg-orange-500/10 text-orange-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
              <Wallet size={20} />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-500 uppercase mb-0.5">Tipo de Operación</p>
              <p className={`text-[11px] font-black uppercase ${esPagoParcial ? 'text-orange-500' : 'text-emerald-500'}`}>
                {esPagoParcial ? 'Crédito / Pago Parcial' : 'Contado / Cancelado'}
              </p>
            </div>
          </div>
          
          <button 
            onClick={finalizarFactura}
            disabled={isCargando || items.length === 0}
            className={`flex items-center gap-3 px-12 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all ${
              items.length === 0 
              ? "bg-slate-800 text-slate-600 cursor-not-allowed" 
              : "bg-orange-600 hover:bg-orange-500 shadow-xl shadow-orange-900/20 active:scale-95"
            }`}
          >
            {isCargando ? <Loader2 className="animate-spin" size={18} /> : <FileCheck size={18} />}
            {isCargando ? "Procesando..." : "Confirmar Venta"}
          </button>
        </div>
      </div>
    </div>
  );
}