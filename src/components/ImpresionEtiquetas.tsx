import { useState } from "react";
import { supabase } from "../supabase";
import { 
  Search, Droplets, Wrench, 
  CircleDot, Car, Calendar, Printer, 
  Loader2, ChevronRight
} from "lucide-react";
import Logo from "../assets/Logo.png";

export default function ImpresionEtiquetas() {
  const [busqueda, setBusqueda] = useState("");
  const [ordenes, setOrdenes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const buscarOrdenes = async () => {
    if (!busqueda.trim()) return;
    setLoading(true);
    try {
      const { data: cli } = await supabase.from("clients").select("id").ilike("name", `%${busqueda}%`);
      const cIds = cli?.map(c => c.id) || [];
      const { data, error } = await supabase
        .from("service_orders")
        .select(`*, clients(name, phone), vehicles(plate, matricula)`)
        .or(`client_id.in.(${cIds.length ? cIds.join(',') : '00000000-0000-0000-0000-000000000000'}), description.ilike.%${busqueda}%`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrdenes(data || []);
    } finally {
      setLoading(false);
    }
  };

  const imprimirEtiqueta = (orden: any, tipo: string) => {
    const kmActual = orden.kilometraje || '0';
    const sumaKm = tipo === 'ACEITE' ? 10000 : tipo === 'DISTR.' ? 50000 : 20000;
    const proxKm = parseInt(kmActual) + sumaKm;
    const fechaActual = new Date(orden.created_at).toLocaleDateString();
    const fechaProx = new Date();
    fechaProx.setFullYear(fechaProx.getFullYear() + 1);

    // Extraer viscosidad del aceite de la descripción
    const aceiteMatch = orden.description?.match(/\b\d+W\d+\b/gi);
    const tipoAceite = aceiteMatch ? aceiteMatch[0] : "SINTÉTICO";

    const ventana = window.open("", "PRINT", "height=600,width=400");
    ventana?.document.write(`
      <html>
        <head>
          <style>
            @page { size: 80mm 120mm; margin: 0; }
            body { font-family: 'Helvetica', sans-serif; margin: 0; padding: 5mm; color: #000; }
            .ticket { border: 3px solid #000; height: 110mm; border-radius: 5mm; display: flex; flex-direction: column; padding: 3mm; box-sizing: border-box; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 2mm; margin-bottom: 3mm; }
            .logo { width: 40mm; }
            .title { font-size: 15pt; font-weight: 900; font-style: italic; margin: 0; }
            .row { display: flex; justify-content: space-between; margin-bottom: 2mm; }
            .label { font-size: 7.5pt; font-weight: 900; color: #444; text-transform: uppercase; }
            .value { font-size: 11pt; font-weight: bold; display: block; }
            .vin { font-family: 'Courier New', monospace; font-size: 9pt; font-weight: bold; }
            .service-banner { background: #000; color: #fff; text-align: center; padding: 2mm; font-weight: 900; font-size: 11pt; border-radius: 2mm; margin: 2mm 0; display: flex; justify-content: center; gap: 4mm; }
            .footer { margin-top: auto; border-top: 2px solid #000; padding-top: 2mm; }
            .footer-title { font-size: 9pt; font-weight: 900; text-align: center; background: #eee; padding: 1mm; border-radius: 1mm; margin-bottom: 2mm; border: 1px solid #000; }
            .big { font-size: 16pt; font-weight: 900; }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="header">
              <img src="${Logo}" class="logo" />
              <div class="title">UPTON'S GARAGE</div>
              <div style="font-size: 9pt; font-weight: bold;">TRELEW - TEL: 2804506498</div>
            </div>
            <div class="row">
              <div><span class="label">Cliente / Tel</span><span class="value">${orden.clients?.name}</span><span class="value" style="font-size: 9pt;">${orden.clients?.phone || '---'}</span></div>
              <div style="text-align: right;"><span class="label">Patente / VIN</span><span class="value">${orden.vehicles?.plate}</span><span class="vin">${orden.vehicles?.matricula || ''}</span></div>
            </div>
            <div class="row" style="border-top: 1px dashed #000; padding-top: 2mm;">
              <div><span class="label">Kilometraje Actual</span><span class="value">${kmActual} KM</span></div>
              <div style="text-align: right;"><span class="label">Fecha</span><span class="value">${fechaActual}</span></div>
            </div>
            <div class="service-banner">
              <span>${tipo}</span>
              ${tipo === 'ACEITE' ? `<span>|</span><span>${tipoAceite}</span>` : ''}
            </div>
            <div class="footer">
              <div class="footer-title">PRÓXIMO CONTROL</div>
              <div class="row">
                <div><span class="label">Kilometraje</span><span class="big">${proxKm}</span></div>
                <div style="text-align: right;"><span class="label">Fecha</span><span class="big">${fechaProx.toLocaleDateString()}</span></div>
              </div>
            </div>
          </div>
          <script>setTimeout(() => { window.print(); window.close(); }, 600);</script>
        </body>
      </html>
    `);
    ventana?.document.close();
  };

  return (
    <div className="p-6 bg-[#0B0F1A] min-h-screen text-slate-200">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* BUSCADOR */}
        <div className="bg-slate-800/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-700/50 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-700 rounded-3xl flex items-center justify-center shadow-lg">
              <Printer size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black italic uppercase text-white leading-none">Impresión</h1>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.3em] mt-2">Upton's Garage</p>
            </div>
          </div>
          <div className="relative w-full md:w-96">
            <input 
              className="w-full bg-[#0B0F1A]/80 border border-slate-700 py-4 pl-12 pr-4 rounded-2xl outline-none focus:border-orange-500/50 text-sm font-medium"
              placeholder="Buscar cliente..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && buscarOrdenes()}
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          </div>
        </div>

        {/* LISTADO DE RESULTADOS */}
        <div className="grid grid-cols-1 gap-6">
          {ordenes.map((o) => (
            <div key={o.id} className="bg-slate-800/30 backdrop-blur-sm p-6 rounded-[2.5rem] border border-slate-700/50 flex flex-col lg:flex-row items-center justify-between gap-8 hover:border-orange-500/30 transition-all">
              <div className="flex items-center gap-8">
                <div className="bg-[#0B0F1A] px-8 py-5 rounded-[2rem] border border-slate-700 text-center shadow-inner">
                  <p className="text-2xl font-black text-white tracking-tighter leading-none">{o.vehicles?.plate}</p>
                  <p className="text-[10px] font-black text-orange-500 uppercase mt-2">{o.vehicles?.matricula || 'SIN VIN'}</p>
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase text-white mb-1 leading-none">{o.clients?.name}</h3>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{o.clients?.phone || 'Sin Teléfono'}</p>
                </div>
              </div>

              {/* OPCIONES DE IMPRESIÓN RESTAURADAS */}
              <div className="flex flex-wrap gap-3">
                <PrintChip onClick={() => imprimirEtiqueta(o, 'ACEITE')} icon={<Droplets className="text-orange-500"/>} label="Aceite" color="hover:bg-orange-600/20" />
                <PrintChip onClick={() => imprimirEtiqueta(o, 'DISTR.')} icon={<Wrench className="text-blue-500"/>} label="Distr." color="hover:bg-blue-600/20" />
                <PrintChip onClick={() => imprimirEtiqueta(o, 'FRENOS')} icon={<CircleDot className="text-red-500"/>} label="Frenos" color="hover:bg-red-600/20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PrintChip({ onClick, icon, label, color }: any) {
  return (
    <button onClick={onClick} className={`flex items-center gap-4 bg-slate-900/60 border border-slate-700 p-4 rounded-[1.8rem] transition-all min-w-[150px] group active:scale-95 ${color}`}>
      <div className="p-2 bg-slate-800 rounded-xl group-hover:bg-slate-700">{icon}</div>
      <div className="text-left">
        <p className="text-xs font-black text-white uppercase tracking-widest leading-none">{label}</p>
        <p className="text-[9px] font-bold text-slate-500 uppercase">Imprimir</p>
      </div>
    </button>
  );
}