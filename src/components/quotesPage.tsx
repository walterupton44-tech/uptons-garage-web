import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { 
  Trash2, FileText, Search, Plus, 
  RotateCcw, History, Clock, User, 
  CheckCircle2, AlertCircle, MessageCircle, Edit3, XCircle, Filter
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function GeneradorPresupuesto() {
  const [items, setItems] = useState<any[]>([]);
  const [tipoBusqueda, setTipoBusqueda] = useState<'MANO_OBRA' | 'REPUESTO'>('MANO_OBRA');
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [clienteSel, setClienteSel] = useState<any>(null);
  const [vehiculos, setVehiculos] = useState<any[]>([]);
  const [vehiculoSel, setVehiculoSel] = useState<any>(null);
  const [historial, setHistorial] = useState<any[]>([]);
  const [filtroEstado, setFiltroEstado] = useState<'TODOS' | 'PENDIENTE' | 'ACEPTADO' | 'RECHAZADO' | 'FINALIZADO'>('TODOS');
  const [presupuestoActualNum, setPresupuestoActualNum] = useState<number | null>(null);
  const [notificacion, setNotificacion] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  const total = items.reduce((acc, i) => acc + i.total, 0);

  useEffect(() => {
    const init = async () => {
      const { data: cData } = await supabase.from("clients").select("*").order("name");
      setClientes(cData || []);
      fetchHistorial();
    };
    init();
  }, []);

  const fetchHistorial = async () => {
    const { data } = await supabase.from("presupuestos_guardados").select("*").order("created_at", { ascending: false }).limit(20);
    setHistorial(data || []);
  };

  useEffect(() => {
    const buscar = async () => {
      if (busqueda.length < 2) { setResultados([]); return; }
      if (tipoBusqueda === 'MANO_OBRA') {
        const { data } = await supabase.from("mano_de_obra").select("*, categorias_hora(valor_hora)").ilike("descripcion", `%${busqueda}%`);
        setResultados(data || []);
      } else {
        const { data } = await supabase.from("repuestos").select("*").ilike("descripcion", `%${busqueda}%`);
        setResultados(data || []);
      }
    };
    const timer = setTimeout(buscar, 300);
    return () => clearTimeout(timer);
  }, [busqueda, tipoBusqueda]);

  const agregarItem = (res: any) => {
    let nuevoItem;
    if (tipoBusqueda === 'MANO_OBRA') {
      const valorHora = res.categorias_hora?.valor_hora || 0;
      const precio = parseFloat(res.horas_estimadas) * valorHora;
      nuevoItem = { id: Math.random(), desc: res.descripcion, cant: 1, unit: precio, total: precio, tipo: 'MO' };
    } else {
      const precioVenta = res.costo * (1 + (res.margen_porcentaje || 0) / 100);
      nuevoItem = { id: Math.random(), desc: res.descripcion, cant: 1, unit: precioVenta, total: precioVenta, tipo: 'REP' };
    }
    setItems([...items, nuevoItem]);
    setBusqueda("");
    setResultados([]);
  };

  const actualizarItem = (id: number, campo: string, valor: any) => {
    const nuevosItems = items.map(item => {
      if (item.id === id) {
        const actualizado = { ...item, [campo]: valor };
        if (campo === 'unit' || campo === 'cant') {
          actualizado.total = actualizado.unit * actualizado.cant;
        }
        return actualizado;
      }
      return item;
    });
    setItems(nuevosItems);
  };

  const crearOrdenDesdePresupuesto = async (p: any) => {
    const { error } = await supabase.from("service_orders").insert([{
      client_id: p.cliente_id,
      vehicle_id: p.vehiculo_id,
      description: `ORDEN DESDE PRESUPUESTO #${p.numero_presupuesto}: ${p.items.map((i: any) => i.desc).join(", ")}`,
      status: "PENDIENTE",
      kilometraje: 0
    }]);
    return !error;
  };

  const actualizarEstadoPresupuesto = async (presu: any, nuevoEstado: any) => {
    const { error } = await supabase.from("presupuestos_guardados").update({ estado: nuevoEstado }).eq("id", presu.id);
    if (!error) {
      if (nuevoEstado === 'ACEPTADO') await crearOrdenDesdePresupuesto(presu);
      setNotificacion({ type: 'success', msg: `Presupuesto #${presu.numero_presupuesto}: ${nuevoEstado}` });
      fetchHistorial();
      setTimeout(() => setNotificacion(null), 3000);
    }
  };

  const guardarPresupuesto = async () => {
    if (items.length === 0 || !clienteSel) return;
    const { data, error } = await supabase.from("presupuestos_guardados").insert([{
      cliente_id: clienteSel.id,
      vehiculo_id: vehiculoSel?.id || null,
      cliente_nombre: clienteSel.name,
      vehiculo_info: vehiculoSel ? `${vehiculoSel.plate} - ${vehiculoSel.matricula}` : "S/P",
      total: total,
      items: items 
    }]).select();

    if (!error && data) {
      setPresupuestoActualNum(data[0].numero_presupuesto);
      setNotificacion({ type: 'success', msg: `Guardado como #${data[0].numero_presupuesto}` });
      fetchHistorial();
      setTimeout(() => setNotificacion(null), 3000);
    }
  };

  const generarPDF = async () => {
    if (items.length === 0 || !clienteSel) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    const completarPDF = (imgData?: string) => {
      doc.setFillColor(30, 41, 59);
      doc.rect(0, 0, pageWidth, 45, 'F');

      if (imgData) doc.addImage(imgData, 'PNG', 15, 7, 60, 30);
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text("PRESUPUESTO", pageWidth - 15, 22, { align: 'right' });
      doc.setFontSize(10);
      doc.text(`#${presupuestoActualNum?.toString().padStart(4, '0') || 'BORRADOR'}`, pageWidth - 15, 29, { align: 'right' });

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("DATOS DEL CLIENTE", 15, 60);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Nombre: ${clienteSel.name.toUpperCase()}`, 15, 70);
      doc.text(`Vehículo: ${vehiculoSel?.plate || "S/P"} - ${vehiculoSel?.matricula || ""}`, 15, 77);

      autoTable(doc, {
        startY: 90,
        head: [['DESCRIPCIÓN', 'UNITARIO', 'CANT.', 'SUBTOTAL']],
        body: items.map(i => [i.desc.toUpperCase(), `$${Number(i.unit).toLocaleString()}`, i.cant, `$${Number(i.total).toLocaleString()}`]),
        headStyles: { fillColor: [245, 158, 11] },
      });

      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(14);
      doc.text(`TOTAL: $${total.toLocaleString()}`, pageWidth - 15, finalY + 10, { align: 'right' });
      
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text("Válido por 7 días. Precios sujetos a cambios según repuestos.", pageWidth / 2, finalY + 30, { align: 'center' });

      doc.save(`Presupuesto_${presupuestoActualNum || 'Nevo'}.pdf`);
    };

    const img = new Image();
    img.src = "/LogoT3.png";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width; canvas.height = img.height;
      canvas.getContext("2d")?.drawImage(img, 0, 0);
      completarPDF(canvas.toDataURL("image/png"));
    };
    img.onerror = () => completarPDF();
  };

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-white grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
      {notificacion && (
        <div className="fixed top-6 right-6 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl z-[100] bg-emerald-600 animate-in slide-in-from-top">
          <CheckCircle2 size={20}/> <span className="text-xs font-black uppercase">{notificacion.msg}</span>
        </div>
      )}

      {/* COLUMNA IZQUIERDA */}
      <div className="space-y-6">
        <div className="bg-slate-800 p-5 rounded-3xl border border-slate-700">
          <h2 className="text-[10px] font-black text-amber-500 uppercase mb-4 tracking-widest flex items-center gap-2"><User size={14}/> Cliente</h2>
          <select 
            className="w-full bg-slate-900 p-3 rounded-xl border border-slate-700 mb-3 text-sm" 
            value={clienteSel?.id || ""} 
            onChange={async (e) => {
              const c = clientes.find(cl => cl.id === e.target.value);
              setClienteSel(c);
              const { data } = await supabase.from("vehicles").select("*").eq("client_id", c.id);
              setVehiculos(data || []);
            }}
          >
            <option value="">Seleccionar Cliente...</option>
            {clientes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select 
            className="w-full bg-slate-900 p-3 rounded-xl border border-slate-700 text-sm" 
            onChange={(e) => setVehiculoSel(vehiculos.find(v => v.id === e.target.value))}
          >
            <option value="">Seleccionar Vehículo...</option>
            {vehiculos.map(v => <option key={v.id} value={v.id}>{v.plate} - {v.matricula}</option>)}
          </select>
        </div>

        {/* BUSCADOR DE ITEMS */}
        <div className="bg-slate-800 p-5 rounded-3xl border border-slate-700 space-y-4">
          <div className="flex gap-2 bg-slate-900 p-1.5 rounded-2xl">
            {(['MANO_OBRA', 'REPUESTO'] as const).map(tipo => (
              <button 
                key={tipo}
                onClick={() => setTipoBusqueda(tipo)} 
                className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${tipoBusqueda === tipo ? 'bg-orange-600 text-white' : 'text-slate-500'}`}
              >
                {tipo.replace('_', ' ')}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16}/>
            <input className="w-full bg-slate-900 pl-10 pr-4 py-3 rounded-xl border border-slate-700 text-sm" placeholder="Buscar..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          </div>
          <div className="max-h-40 overflow-y-auto space-y-1 custom-scrollbar">
            {resultados.map(r => (
              <button key={r.id} onClick={() => agregarItem(r)} className="w-full text-left p-2 hover:bg-slate-700 rounded-lg text-xs flex justify-between items-center group">
                <span className="truncate pr-4">{r.descripcion}</span> <Plus size={14} className="text-amber-500 opacity-0 group-hover:opacity-100" />
              </button>
            ))}
          </div>
        </div>

        {/* HISTORIAL CON FILTROS */}
        <div className="bg-slate-800 p-5 rounded-3xl border border-slate-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><History size={14}/> Recientes</h2>
            <div className="flex gap-1 bg-slate-900 p-1 rounded-lg">
              {['TODOS', 'PENDIENTE', 'ACEPTADO', 'FINALIZADO'].map(f => (
                <button 
                  key={f} 
                  onClick={() => setFiltroEstado(f as any)}
                  className={`px-2 py-1 text-[8px] font-black rounded-md ${filtroEstado === f ? 'bg-orange-600 text-white' : 'text-slate-600'}`}
                >
                  {f[0]}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {historial.filter(h => filtroEstado === 'TODOS' || h.estado === filtroEstado).map(h => (
              <div key={h.id} className="group bg-slate-900/40 border border-slate-700 rounded-2xl p-3 hover:border-orange-500/50 transition-all">
                <div className="flex justify-between items-start mb-1">
                  <div className="cursor-pointer" onClick={() => { setItems(h.items); setClienteSel(clientes.find(c => c.id === h.cliente_id)); setPresupuestoActualNum(h.numero_presupuesto); }}>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black text-amber-500 bg-amber-500/10 px-1 rounded">#{h.numero_presupuesto}</span>
                      <p className="text-xs font-bold text-slate-300 truncate w-24">{h.cliente_nombre}</p>
                    </div>
                  </div>
                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${h.estado === 'ACEPTADO' ? 'bg-emerald-500/20 text-emerald-500' : h.estado === 'FINALIZADO' ? 'bg-blue-500/20 text-blue-500' : 'bg-amber-500/20 text-amber-500'}`}>
                    {h.estado}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs font-mono text-white">${h.total.toLocaleString()}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => actualizarEstadoPresupuesto(h, 'ACEPTADO')} className="p-1 hover:bg-emerald-500/20 text-emerald-500 rounded-lg"><CheckCircle2 size={14}/></button>
                    <button onClick={() => actualizarEstadoPresupuesto(h, 'RECHAZADO')} className="p-1 hover:bg-red-500/20 text-red-500 rounded-lg"><XCircle size={14}/></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CUERPO PRINCIPAL (HOJA) */}
      <div className="lg:col-span-2 bg-slate-800 rounded-[2.5rem] border border-slate-700 flex flex-col shadow-2xl overflow-hidden min-h-[600px]">
        <div className="p-8 border-b border-slate-700 flex justify-between items-end bg-slate-800/50">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black italic uppercase tracking-tighter">Cotización</h2>
              {presupuestoActualNum && <span className="bg-orange-600 text-[10px] font-black px-3 py-1 rounded-full">#{presupuestoActualNum}</span>}
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">{clienteSel?.name || 'Seleccione un cliente'}</p>
          </div>
          <div className="text-right">
            <span className="text-4xl font-black text-emerald-400 font-mono italic">${total.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <table className="w-full text-left">
            <thead className="text-[10px] uppercase font-black text-slate-500">
              <tr>
                <th className="px-6 py-2">Descripción</th>
                <th className="px-6 py-2 text-right">Unitario</th>
                <th className="px-6 py-2 text-center">Cant.</th>
                <th className="px-6 py-2 text-right">Subtotal</th>
                <th className="px-6 py-2 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {items.map(i => (
                <tr key={i.id} className="bg-slate-900/30 hover:bg-slate-700/30 transition-colors border-b border-slate-800/50 group">
                  <td className="px-4 py-2 rounded-l-2xl">
                    <div className="flex items-center gap-2">
                      <Edit3 size={12} className="text-slate-600 group-hover:text-orange-500" />
                      <input className="bg-transparent border-none outline-none focus:ring-1 focus:ring-orange-500/30 rounded px-2 py-1 w-full text-sm font-bold text-slate-200" value={i.desc} onChange={(e) => actualizarItem(i.id, 'desc', e.target.value)} />
                    </div>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <input type="number" className="bg-transparent border-none outline-none w-24 text-right font-mono text-slate-400 text-sm" value={i.unit} onChange={(e) => actualizarItem(i.id, 'unit', parseFloat(e.target.value) || 0)} />
                  </td>
                  <td className="px-4 py-2 text-center">
                    <input type="number" className="bg-transparent border-none outline-none w-12 text-center font-black text-amber-500" value={i.cant} onChange={(e) => actualizarItem(i.id, 'cant', parseInt(e.target.value) || 0)} />
                  </td>
                  <td className="px-6 py-4 text-right font-black text-white text-sm">${i.total.toLocaleString()}</td>
                  <td className="px-4 py-2 text-right rounded-r-2xl">
                    <button onClick={() => setItems(items.filter(it => it.id !== i.id))} className="text-slate-600 hover:text-red-500"><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && (
            <div className="h-64 flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-slate-700 rounded-3xl m-8">
               <AlertCircle size={40} className="mb-2 opacity-20"/>
               <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Hoja de presupuesto vacía</p>
            </div>
          )}
        </div>

        <div className="p-8 bg-slate-900/50 border-t border-slate-700 flex justify-between items-center">
          <button onClick={() => { setItems([]); setPresupuestoActualNum(null); setClienteSel(null); }} className="bg-slate-800 text-slate-400 p-3 rounded-2xl hover:bg-red-900/20 hover:text-red-500 transition-all"><RotateCcw size={18}/></button>
          <div className="flex gap-3">
            <button onClick={guardarPresupuesto} className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2"><History size={16}/> Guardar</button>
            <button onClick={generarPDF} className="bg-amber-600 hover:bg-amber-500 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2"><FileText size={18}/> Exportar PDF</button>
          </div>
        </div>
      </div>
    </div>
  );
}