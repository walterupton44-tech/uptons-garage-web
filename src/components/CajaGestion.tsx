import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { 
  Wallet, PlusCircle, History, CheckCircle2, 
  Clock, TrendingDown, ArrowUpRight, Printer, TrendingUp 
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function CajaGestion() {
  const [deudores, setDeudores] = useState<any[]>([]);
  const [pagos, setPagos] = useState<any[]>([]);
  const [montoAbono, setMontoAbono] = useState<{[key: string]: number}>({});
  const [totalDeuda, setTotalDeuda] = useState(0);
  const [isCargando, setIsCargando] = useState(false);

  useEffect(() => {
    fetchDatos();
  }, []);

  const fetchDatos = async () => {
    // 1. Facturas con deuda
    const { data: facturas } = await supabase
      .from("facturas")
      .select(`*, clients(name, phone)`)
      .eq("estado", "pendiente")
      .order("created_at", { ascending: false });
    
    setDeudores(facturas || []);
    const deuda = (facturas || []).reduce((acc, f) => acc + (f.total - f.monto_pagado), 0);
    setTotalDeuda(deuda);

    // 2. Historial de ingresos (Traemos más datos para el gráfico de 7 días)
    const { data: historial } = await supabase
      .from("historial_pagos")
      .select(`*, facturas(clients(name))`)
      .order("fecha_pago", { ascending: false });
    
    setPagos(historial || []);
  };

  // --- LÓGICA DEL GRÁFICO ---
  const prepararDatosGrafico = () => {
    const ultimos7Dias = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toLocaleDateString();
    }).reverse();

    return ultimos7Dias.map(fecha => {
      const totalDia = pagos
        .filter(p => new Date(p.fecha_pago).toLocaleDateString() === fecha)
        .reduce((acc, p) => acc + (Number(p.monto_abonado) || 0), 0);
      return { name: fecha.split('/')[0] + '/' + fecha.split('/')[1], ingresos: totalDia };
    });
  };

  // --- REPORTES PDF ---
  const generarTicket = (factura: any, monto: number, saldo: number) => {
    const doc = new jsPDF({ unit: "mm", format: [80, 150] });
    doc.setFontSize(12).text("UPTON'S GARAGE", 40, 10, { align: "center" });
    doc.setFontSize(8).text("COMPROBANTE DE ABONO", 40, 15, { align: "center" });
    doc.text(`CLIENTE: ${factura.clients?.name.toUpperCase()}`, 5, 30);
    autoTable(doc, {
      startY: 40,
      head: [['Detalle', 'Monto']],
      body: [['Abono', `$${monto.toLocaleString()}`], ['Resta', `$${saldo.toLocaleString()}`]],
      styles: { fontSize: 7 },
      headStyles: { fillColor: [80, 80, 80] }
    });
    window.open(doc.output('bloburl'), '_blank');
  };

  const generarCierreCaja = () => {
    const hoy = new Date().toLocaleDateString();
    const pagosHoy = pagos.filter(p => new Date(p.fecha_pago).toLocaleDateString() === hoy);
    const total = pagosHoy.reduce((acc, p) => acc + p.monto_abonado, 0);
    const doc = new jsPDF();
    doc.setFontSize(18).text("CIERRE DE CAJA DIARIO", 105, 20, { align: "center" });
    autoTable(doc, {
      startY: 40,
      head: [['Resumen', 'Monto']],
      body: [['Total Cobrado Hoy', `$${total.toLocaleString()}`]],
      headStyles: { fillColor: [16, 185, 129] }
    });
    doc.save(`Cierre_${hoy.replace(/\//g, '-')}.pdf`);
  };

  // --- ACCIÓN DE COBRO ---
  const registrarAbono = async (factura: any) => {
    const monto = montoAbono[factura.id] || 0;
    const saldoActual = factura.total - factura.monto_pagado;
    if (monto <= 0 || monto > saldoActual) return alert("Monto inválido");

    setIsCargando(true);
    const nuevoMontoPagado = Number(factura.monto_pagado) + monto;
    const nuevoSaldo = factura.total - nuevoMontoPagado;

    try {
      await supabase.from("historial_pagos").insert([{ factura_id: factura.id, monto_abonado: monto, metodo_pago: "Efectivo" }]);
      await supabase.from("facturas").update({ monto_pagado: nuevoMontoPagado, estado: nuevoSaldo <= 0 ? 'pagada' : 'pendiente' }).eq("id", factura.id);

      generarTicket(factura, monto, nuevoSaldo);
      if (factura.clients?.phone) {
        const tel = factura.clients.phone.replace(/\D/g, '');
        const msg = `*UPTON'S GARAGE*%0AConfirmamos abono de *$${monto.toLocaleString()}*.%0ASaldo restante: *$${nuevoSaldo.toLocaleString()}*.`;
        setTimeout(() => window.open(`https://wa.me/${tel}?text=${msg}`, '_blank'), 1000);
      }
      setMontoAbono({ ...montoAbono, [factura.id]: 0 });
      fetchDatos();
    } catch (err) { console.error(err); } finally { setIsCargando(false); }
  };

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-white font-sans">
      
      {/* 1. HEADER & INDICADORES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-red-600/20 to-slate-800 p-6 rounded-[2.5rem] border border-red-500/20">
          <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">Saldo Pendiente Total</p>
          <h2 className="text-4xl font-black font-mono">${totalDeuda.toLocaleString()}</h2>
        </div>

        <div className="md:col-span-2 bg-slate-800 p-6 rounded-[2.5rem] border border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center"><Wallet size={24} /></div>
            <div>
              <h1 className="text-xl font-black uppercase italic">Caja y Deudores</h1>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Upton's Garage Systems</p>
            </div>
          </div>
          <button onClick={generarCierreCaja} className="flex items-center gap-2 bg-slate-950 border border-emerald-500/30 hover:bg-emerald-600 px-5 py-3 rounded-2xl transition-all group">
            <Printer size={18} className="text-emerald-500 group-hover:text-white" />
            <span className="text-[10px] font-black uppercase group-hover:text-white">Cierre Diario</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 2. GRÁFICO Y LISTADO DE DEUDORES */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* GRÁFICO DE INGRESOS */}
          <div className="bg-slate-800 p-6 rounded-[2.5rem] border border-slate-700 shadow-xl">
            <h3 className="text-[10px] font-black uppercase text-slate-500 mb-6 flex items-center gap-2">
              <TrendingUp size={14} className="text-emerald-500" /> Crecimiento Semanal
            </h3>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={prepararDatosGrafico()}>
                  <defs>
                    <linearGradient id="colorIng" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none' }} />
                  <Area type="monotone" dataKey="ingresos" stroke="#10b981" strokeWidth={3} fill="url(#colorIng)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {deudores.map((d) => (
              <div key={d.id} className="bg-slate-800 border border-slate-700 p-5 rounded-3xl border-l-4 border-l-red-500 hover:scale-[1.02] transition-transform">
                <h4 className="text-md font-bold uppercase mb-4 truncate text-slate-200">{d.clients?.name}</h4>
                <div className="flex justify-between items-end bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50">
                  <div>
                    <p className="text-[8px] text-red-400 font-bold mb-1 uppercase tracking-tighter">Deuda Actual</p>
                    <p className="text-xl font-black font-mono text-white">${(d.total - d.monto_pagado).toLocaleString()}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <input type="number" className="w-24 bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-xs text-emerald-400 outline-none focus:border-emerald-500" 
                      placeholder="Monto" value={montoAbono[d.id] || ""} onChange={(e) => setMontoAbono({...montoAbono, [d.id]: Number(e.target.value)})}/>
                    <button onClick={() => registrarAbono(d)} className="bg-emerald-600 hover:bg-emerald-500 p-2 rounded-lg flex justify-center shadow-lg shadow-emerald-900/20">
                      <PlusCircle size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. HISTORIAL DE MOVIMIENTOS */}
        <div className="bg-slate-800 rounded-[2.5rem] border border-slate-700 p-6 h-fit shadow-2xl">
          <h3 className="text-[10px] font-black uppercase text-slate-500 mb-6 flex items-center gap-2">
            <History size={14} className="text-emerald-500" /> Últimos Movimientos
          </h3>
          <div className="space-y-4">
            {pagos.slice(0, 10).map((p) => (
              <div key={p.id} className="flex items-center justify-between border-b border-slate-700/30 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500"><ArrowUpRight size={14} /></div>
                  <div className="max-w-[120px]">
                    <p className="text-[10px] font-bold uppercase truncate">{p.facturas?.clients?.name}</p>
                    <p className="text-[8px] text-slate-600 font-bold">{new Date(p.fecha_pago).toLocaleDateString()}</p>
                  </div>
                </div>
                <p className="font-mono text-xs font-black text-emerald-400">+$ {p.monto_abonado.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}