
import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { 
  Trash2, FileText, Search, Plus, 
  RotateCcw, History, Clock, User, 
  Car, CheckCircle2, AlertCircle, MessageCircle, Edit3
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
    const { data } = await supabase.from("presupuestos_guardados").select("*").order("created_at", { ascending: false }).limit(6);
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

  // --- NUEVA FUNCIÓN: ACTUALIZAR ITEM EDITADO ---
  const actualizarItem = (id: number, campo: string, valor: any) => {
    const nuevosItems = items.map(item => {
      if (item.id === id) {
        const actualizado = { ...item, [campo]: valor };
        // Recalcular el total del item si cambia precio o cantidad
        if (campo === 'unit' || campo === 'cant') {
          actualizado.total = actualizado.unit * actualizado.cant;
        }
        return actualizado;
      }
      return item;
    });
    setItems(nuevosItems);
  };

  const guardarPresupuesto = async () => {
    if (items.length === 0 || !clienteSel) return;
    const { error } = await supabase.from("presupuestos_guardados").insert([{
      cliente_id: clienteSel.id,
      vehiculo_id: vehiculoSel?.id || null,
      cliente_nombre: clienteSel.name,
      vehiculo_info: vehiculoSel ? `${vehiculoSel.plate} - ${vehiculoSel.matricula}` : "S/P",
      total: total,
      items: items 
    }]);
    if (!error) {
      setNotificacion({ type: 'success', msg: "Guardado en historial." });
      fetchHistorial();
      setTimeout(() => setNotificacion(null), 3000);
    }
  };

  const enviarWhatsApp = () => {
    if (!clienteSel || items.length === 0) return alert("Faltan datos");
    const phone = clienteSel.phone.replace(/\D/g, "");
    let mensaje = `*UPON'S GARAGE - PRESUPUESTO* 🛠️\n\n`;
    mensaje += `Hola *${clienteSel.name}*, adjuntamos el detalle de la cotización:\n\n`;
    items.forEach(i => {
      mensaje += `• ${i.desc} - *$${i.total.toLocaleString()}*\n`;
    });
    mensaje += `\n💰 *TOTAL ESTIMADO: $${total.toLocaleString()}*\n\n`;
    mensaje += `_¿Desea confirmar el trabajo?_`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(mensaje)}`, "_blank");
  };

  
  
  const generarPDF = async () => {
    if (items.length === 0 || !clienteSel) return;
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // --- 1. ENCABEZADO Y LOGO ---
    doc.setFillColor(30, 41, 59); // Color azul pizarra oscuro (slate-800)
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("UPON'S GARAGE", 15, 20);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Servicio Mecánico Profesional", 15, 28);
    doc.text("Calle Ficticia 123 - Ciudad", 15, 33);

    // Etiqueta de Presupuesto a la derecha
    doc.setFontSize(16);
    doc.text("PRESUPUESTO", pageWidth - 15, 25, { align: 'right' });
    doc.setFontSize(10);
    doc.text(`#${Math.floor(Math.random() * 1000).toString().padStart(4, '0')}`, pageWidth - 15, 32, { align: 'right' });

    // --- 2. INFORMACIÓN DEL CLIENTE Y VEHÍCULO ---
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("DATOS DEL CLIENTE", 15, 55);
    doc.line(15, 57, 80, 57); // Línea decorativa
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Nombre:", 15, 65);
    doc.text("Teléfono:", 15, 72);
    
    doc.setFont("helvetica", "normal");
    doc.text(clienteSel.name.toUpperCase(), 35, 65);
    doc.text(clienteSel.phone || "---", 35, 72);

    // Recuadro para el Vehículo
    doc.setFillColor(248, 250, 252); // Gris muy claro
    doc.roundedRect(pageWidth - 95, 50, 80, 28, 3, 3, 'F');
    doc.setFont("helvetica", "bold");
    doc.text("VEHÍCULO", pageWidth - 90, 57);
    doc.setFont("helvetica", "normal");
    doc.text(`Dominio: ${vehiculoSel?.plate || "S/P"}`, pageWidth - 90, 64);
    doc.text(`Modelo: ${vehiculoSel?.matricula || "S/P"}`, pageWidth - 90, 71);

    // --- 3. TABLA DE CONCEPTOS ---
    autoTable(doc, {
      startY: 85,
      head: [['DESCRIPCIÓN', 'UNITARIO', 'CANT.', 'SUBTOTAL']],
      body: items.map(i => [
        i.desc.toUpperCase(), 
        `$${Number(i.unit).toLocaleString()}`, 
        i.cant, 
        `$${Number(i.total).toLocaleString()}`
      ]),
      styles: { fontSize: 9, cellPadding: 5 },
      headStyles: { 
        fillColor: [245, 158, 11], // Color naranja amber-500
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { halign: 'right', fontStyle: 'italic' },
        2: { halign: 'center' },
        3: { halign: 'right', fontStyle: 'bold' }
      },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      margin: { left: 15, right: 15 }
    });

    // --- 4. TOTALES Y NOTAS ---
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    doc.setFillColor(30, 41, 59);
    doc.rect(pageWidth - 85, finalY, 70, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL ESTIMADO:", pageWidth - 80, finalY + 9.5);
    doc.text(`$${total.toLocaleString()}`, pageWidth - 20, finalY + 9.5, { align: 'right' });

    // Nota pie de página
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    const nota = "Este presupuesto tiene una validez de 7 días. Los precios de repuestos están sujetos a cambios sin previo aviso.";
    doc.text(nota, pageWidth / 2, finalY + 30, { align: 'center' });

    // --- 5. GUARDADO ---
    doc.save(`Presupuesto_${clienteSel.name.replace(/\s+/g, '_')}.pdf`);
  };  
  
  

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-white grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
      {notificacion && (
        <div className="fixed top-6 right-6 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl z-50 bg-emerald-600">
          <CheckCircle2 size={20}/> <span className="text-xs font-black uppercase">{notificacion.msg}</span>
        </div>
      )}

      {/* COLUMNA IZQUIERDA */}
      <div className="space-y-6">
        <div className="bg-slate-800 p-5 rounded-3xl border border-slate-700">
          <h2 className="text-[10px] font-black text-amber-500 uppercase mb-4 tracking-widest flex items-center gap-2"><User size={14}/> Cliente</h2>
          <select className="w-full bg-slate-900 p-3 rounded-xl border border-slate-700 mb-3 text-sm" value={clienteSel?.id || ""} 
            onChange={async (e) => {
              const c = clientes.find(cl => cl.id === e.target.value);
              setClienteSel(c);
              const { data } = await supabase.from("vehicles").select("*").eq("client_id", c.id);
              setVehiculos(data || []);
            }}>
            <option value="">Seleccionar...</option>
            {clientes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="w-full bg-slate-900 p-3 rounded-xl border border-slate-700 text-sm" onChange={(e) => setVehiculoSel(vehiculos.find(v => v.id === e.target.value))}>
            <option value="">Vehículo...</option>
            {vehiculos.map(v => <option key={v.id} value={v.id}>{v.plate} - {v.matricula}</option>)}
          </select>
        </div>

        <div className="bg-slate-800 p-5 rounded-3xl border border-slate-700 space-y-4">
          <div className="flex gap-2 bg-slate-900 p-1.5 rounded-2xl">
            <button onClick={() => setTipoBusqueda('MANO_OBRA')} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${tipoBusqueda === 'MANO_OBRA' ? 'bg-orange-600 text-white' : 'text-slate-500'}`}>Mano Obra</button>
            <button onClick={() => setTipoBusqueda('REPUESTO')} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${tipoBusqueda === 'REPUESTO' ? 'bg-orange-600 text-white' : 'text-slate-500'}`}>Repuestos</button>
          </div>
          <input className="w-full bg-slate-900 px-4 py-3 rounded-xl border border-slate-700 text-sm" placeholder="Buscar..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          <div className="max-h-40 overflow-y-auto space-y-1">
            {resultados.map(r => (
              <button key={r.id} onClick={() => agregarItem(r)} className="w-full text-left p-2 hover:bg-slate-700 rounded-lg text-xs flex justify-between items-center">
                <span>{r.descripcion}</span> <Plus size={14} className="text-amber-500" />
              </button>
            ))}
          </div>
        </div>

        <div className="bg-slate-800 p-5 rounded-3xl border border-slate-700">
          <h2 className="text-[10px] font-black text-slate-500 uppercase mb-4 tracking-widest flex items-center gap-2"><History size={14}/> Recientes</h2>
          <div className="space-y-2">
            {historial.map(h => (
              <button key={h.id} onClick={() => {
                setItems(h.items);
                setClienteSel(clientes.find(c => c.id === h.cliente_id));
              }} className="w-full text-left p-3 rounded-2xl bg-slate-900/40 border border-slate-700 hover:border-orange-500/50">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-300 truncate w-32">{h.cliente_nombre}</span>
                  <span className="text-[10px] font-black text-emerald-500 font-mono">${h.total.toLocaleString()}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* HOJA DE PRESUPUESTO EDITABLE */}
      <div className="lg:col-span-2 bg-slate-800 rounded-[2.5rem] border border-slate-700 flex flex-col shadow-2xl overflow-hidden min-h-[600px]">
        <div className="p-8 border-b border-slate-700 flex justify-between items-end bg-slate-800/50">
          <div>
            <h2 className="text-2xl font-black italic uppercase tracking-tighter">Cotización</h2>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{clienteSel?.name || 'Esperando selección...'}</p>
          </div>
          <div className="text-right">
            <span className="text-4xl font-black text-emerald-400 font-mono italic">${total.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
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
                      <input 
                        className="bg-transparent border-none outline-none focus:ring-1 focus:ring-orange-500/30 rounded px-2 py-1 w-full text-sm font-bold text-slate-200"
                        value={i.desc}
                        onChange={(e) => actualizarItem(i.id, 'desc', e.target.value)}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <input 
                      type="number"
                      className="bg-transparent border-none outline-none focus:ring-1 focus:ring-orange-500/30 rounded px-2 py-1 w-24 text-right font-mono text-slate-400 text-sm"
                      value={i.unit}
                      onChange={(e) => actualizarItem(i.id, 'unit', parseFloat(e.target.value) || 0)}
                    />
                  </td>
                  <td className="px-4 py-2 text-center">
                    <input 
                      type="number"
                      className="bg-transparent border-none outline-none focus:ring-1 focus:ring-orange-500/30 rounded px-2 py-1 w-12 text-center font-black text-amber-500"
                      value={i.cant}
                      onChange={(e) => actualizarItem(i.id, 'cant', parseInt(e.target.value) || 0)}
                    />
                  </td>
                  <td className="px-6 py-4 text-right font-black text-white text-sm">${i.total.toLocaleString()}</td>
                  <td className="px-4 py-2 text-right rounded-r-2xl">
                    <button onClick={() => setItems(items.filter(it => it.id !== i.id))} className="text-slate-600 hover:text-red-500 transition-colors">
                      <Trash2 size={16}/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && (
            <div className="h-64 flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-slate-700 rounded-3xl m-8">
               <AlertCircle size={40} className="mb-2 opacity-20"/>
               <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Agrega items para comenzar</p>
            </div>
          )}
        </div>

        <div className="p-8 bg-slate-900/50 border-t border-slate-700 flex justify-between items-center">
          <button onClick={() => setItems([])} className="bg-slate-800 text-slate-400 p-3 rounded-2xl hover:bg-red-900/20 hover:text-red-500 transition-all">
            <RotateCcw size={18}/>
          </button>
          <div className="flex gap-3">
            <button onClick={guardarPresupuesto} className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
              <History size={16}/> Guardar
            </button>
            <button onClick={enviarWhatsApp} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
              <MessageCircle size={18}/> Enviar WA
            </button>
            <button onClick={generarPDF} className="bg-amber-600 hover:bg-amber-500 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
              <FileText size={18}/> PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}




















































































































































































































































































