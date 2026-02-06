import { useState } from "react";
import { supabase } from "../supabase";
import { Printer, FileText, Activity, Search, Car, X, Edit3, Trash2, PlusCircle, Layout } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logoTaller from "../assets/LogoT3.png"; // Ajusta la ruta si es necesario

interface Vehicle {
  plate: string;
  autos: string;
  modelo: string;
  motores: string;
  clientName: string;
  clientId: string; // Agregar clientId para facilitar la búsqueda
}

export default function ListaRepuestos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [activeListData, setActiveListData] = useState<{ nombre: string, items: string[][] } | null>(null);

  const listasIniciales = {
    motor: [
      ["Sub-Conjunto", "1"], ["Juego de juntas", "1"], ["Retenes de Distribucion", "1"],
      ["Retene de Bancada", "1"], ["Juego de Bulones Tapa de Cilindro", "1"],
      ["Coginetes de Biela y Bancada", "1"], ["Axiales", "1"], ["Bomba de Aceite", "1"],
      ["Kit de Diatribucion + Bomba de Agua", "1"], ["Correa de Accesorios (Poly-V)", "1"],
      ["Kit de embrague", "1"], ["Termosatato", "1"], ["Agua destilada y refrigerante", "1"],
      ["Filtro de Aceite y Aire", "4"], ["Aceite", "4L"], ["Bujias", "4U"], ["Cables de Bujias", "1"]
    ],
    tapa: [
      ["Juego de juntas Descarbonizacion", "1"], ["Juego de Bulones Tapa de Cilindro", "1"],
      ["Kit de Diatribucion + Bomba de Agua", "1"], ["Termosatato", "1"],
      ["Retenes de Distribucion", "1"], ["Correa de Accesorios (Poly-V)", "1"],
      ["Agua destilada y refrigerante", "1"], ["Filtro de Aceite y Aire", "1"],
      ["Aceite", "4L"], ["Bujias", "4U"]
    ],
    distribucion: [
      ["Kit de Diatribucion + Bomba de Agua", "1"], ["Termosatato", "1"],
      ["Correa de Accesorios (Poly-V)", "1"], ["Retenes de Distribucion", "1"],
      ["Agua destilada y refrigerante", "1"]
    ],
    vacio: [["", ""]] 
  };

  // FUNCIÓN DE BÚSQUEDA POR CLIENTE
      
  const buscarVehiculos = async (termino: string) => {
    console.log("Buscando vehículos con término:", termino);
    setSearchTerm(termino.toUpperCase());
    
    if (termino.length < 2) {
        setVehicles([]);
        return;
    }

    try {
        // Buscar clientes que coincidan con el término
        const { data: clientsData, error: clientError } = await supabase
            .from("clients")
            .select("id, name")
            .ilike("name", `%${termino}%`)
            .limit(5);

        if (clientError) {
            console.error("Error al buscar clientes:", clientError);
            throw clientError;
        }

        if (!clientsData || clientsData.length === 0) {
            setVehicles([]);
            return;
        }

        const clientIds = clientsData.map(client => client.id);

        // Buscar vehículos que correspondan a esos client_ids
        const { data: vehiclesData, error: vehicleError } = await supabase
            .from("vehicles")
            .select(`
                plate,
                autos,
                modelo,
                motores,
                client_id,
                clients (name)
            `)
            .in("client_id", clientIds) // Filtrando por client_id
            .limit(5);

        if (vehicleError) {
            console.error("Error al buscar vehículos:", vehicleError);
            throw vehicleError;
        }

        // Limpiamos y traducimos los datos
        const cleanedData = await Promise.all(vehiclesData.map(async v => {
            const client = v.clients[0]; // Accediendo al primer elemento del array

            // Obtener la marca
            const { data: autoData } = await supabase
                .from("autos")
                .select("marcas")
                .eq("id", v.autos) // Suponiendo que v.autos es el ID de la marca
                .single();

            // Obtener el modelo
            const { data: modelData } = await supabase
                .from("modelo")
                .select("modelos")
                .eq("idmod", v.modelo) // Suponiendo que v.modelo es el ID del modelo
                .single();

            // Obtener el motor
            const { data: motorData } = await supabase
                .from("motores")
                .select("motor")
                .eq("id", v.motores) // Suponiendo que v.motores es el ID del motor
                .single();

            return {
                plate: v.plate?.trim(),
                autos: autoData?.marcas || "N/A",
                modelo: modelData?.modelos || "N/A",
                motores: motorData?.motor || "N/A",
                clientName: client ? client.name : "N/A",
                clientId: v.client_id || "N/A"
            };
        }));

        // Eliminamos duplicados por patente
        const uniqueData = cleanedData.filter((v, i, self) => 
            i === self.findIndex((t) => t.plate === v.plate)
        );

        console.log("Datos limpiados:", uniqueData);
        setVehicles(uniqueData);
    } catch (error) {
        console.error("Error en la búsqueda:", error);
    }
};

  
  const handleEditItem = (index: number, col: number, value: string) => {
    if (!activeListData) return;
    const newItems = [...activeListData.items];
    newItems[index][col] = value;
    setActiveListData({ ...activeListData, items: newItems });
  };



const generarPDF = () => {
  // 1. Validación de seguridad
  if (!activeListData || activeListData.items.filter(i => i[0].trim() !== "").length === 0) {
    alert("Agrega al menos un ítem con descripción para imprimir.");
    return;
  }

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // --- 2. LOGO CENTRADO ---
  const logoWidth = 90; // Ancho del logo en mm
  const logoHeight = 40; // Alto del logo en mm
  const xCenter = (pageWidth - logoWidth) / 2;
  const yLogotipo = 2; // Distancia desde el borde superior

  try {
    // Usamos la variable logoTaller que importaste al inicio del archivo
    doc.addImage(logoTaller, 'PNG', xCenter, yLogotipo, logoWidth, logoHeight);
  } catch (e) {
    console.warn("No se pudo cargar el logo centrado:", e);
  }

  // --- 3. ENCABEZADO (Texto Centrado) ---
  const yTitulo = yLogotipo + logoHeight + 2;
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100);
  doc.text("", pageWidth / 2, yTitulo, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text("Gestión Profesional de Repuestos y Mantenimiento", pageWidth / 2, yTitulo + 7, { align: "center" });

  // --- 4. TÍTULO DEL PEDIDO ---
  const ySubtitulo = yTitulo + 5;
  // --- 5. CUADRO DE INFORMACIÓN (VEHÍCULO / CLIENTE) ---
  const yInfo = ySubtitulo + 8;
  
  if (selectedVehicle) {
    // Fondo gris suave para los datos
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, yInfo, pageWidth - 28, 32, 3, 3, 'F');
    
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.setFont("helvetica", "bold");
    doc.text("DATOS DEL SERVICIO", 20, yInfo + 7);

    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.setFont("helvetica", "normal");
    doc.text(`Cliente: ${selectedVehicle.clientName}`, 20, yInfo + 15);
    doc.text(`Vehículo: ${selectedVehicle.autos} ${selectedVehicle.modelo}`, 20, yInfo + 22);
    
    // Derecha del cuadro
    doc.setFont("helvetica", "bold");
    doc.text(`Patente: ${selectedVehicle.plate}`, pageWidth - 20, yInfo + 15, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.text(`Motor: ${selectedVehicle.motores}`, pageWidth - 20, yInfo + 22, { align: "right" });
    
    doc.setFontSize(8);
    doc.text(`Emitido el: ${new Date().toLocaleDateString()} a las ${new Date().toLocaleTimeString()}`, 20, yInfo + 28);
  }

  // --- 6. TABLA DE REPUESTOS ---
  const yTabla = selectedVehicle ? yInfo + 38 : ySubtitulo + 20;

  autoTable(doc, {
    startY: yTabla,
    head: [['DESCRIPCIÓN DEL REPUESTO', 'CANT.']],
    body: activeListData.items.filter(i => i[0].trim() !== ""),
    theme: 'grid',
    headStyles: { 
      fillColor: [245, 158, 11], 
      textColor: [255, 255, 255],
      fontSize: 11,
      fontStyle: 'bold',
      halign: 'center'
    },
    styles: { 
      fontSize: 10,
      cellPadding: 4,
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 35, halign: 'center', fontStyle: 'bold' }
    },
    margin: { left: 14, right: 14 }
  });

  

// --- 7. PIE DE PÁGINA ---
const finalY = (doc as any).lastAutoTable.finalY + 15;

// Línea de firma
doc.setDrawColor(200);
doc.line(pageWidth / 2 - 35, finalY + 20, pageWidth / 2 + 35, finalY + 20);

doc.setFontSize(9);
doc.setFont("helvetica", "bold");
doc.setTextColor(100);
doc.text("Firma Responsable", pageWidth / 2, finalY + 25, { align: "center" });

// --- CONTACTO (Teléfono) ---
doc.setFontSize(10);
doc.setTextColor(30, 41, 59); // Color oscuro para que se vea claro
doc.setFont("helvetica", "bold");

// Reemplaza el número con el real de Upton's Garage
const telefono = "+54 9 2804506498"; 
doc.text(`Tel: ${telefono}`, pageWidth / 2, finalY + 35, { align: "center" });

// Opcional: Una frase de cierre pequeña
doc.setFontSize(7);
doc.setFont("helvetica", "italic");
doc.setTextColor(150);
doc.text("Gracias por confiar en Upton's Garage", pageWidth / 2, finalY + 40, { align: "center" });

  // --- 8. GUARDAR ---
  const filename = `Pedido_${selectedVehicle?.plate || "S-P"}_${new Date().getTime()}.pdf`;
  doc.save(filename);
};
  
                 return (
    <div className="space-y-6 max-w-5xl mx-auto p-4">
      {/* BUSCADOR */}
      <div className="bg-slate-800 p-6 rounded-[2rem] border border-slate-700 shadow-xl">
        <div className="relative">
          <Search className="absolute left-4 top-3.5 text-slate-500" size={20} />
          <input 
            type="text"
            placeholder="Buscar por Patente o Cliente..."
            className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-3 pl-12 pr-4 text-white outline-none focus:border-amber-500 font-bold transition-all"
            value={searchTerm}
            onChange={(e) => buscarVehiculos(e.target.value)}
          />
          {vehicles.length > 0 && !selectedVehicle && (
            <div className="absolute w-full mt-2 bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden z-50 shadow-2xl">
              {vehicles.map((v) => (
                <button key={v.plate} onClick={() => { setSelectedVehicle(v); setSearchTerm(""); setVehicles([]); }}
                  className="w-full p-4 flex justify-between items-center hover:bg-slate-700 border-b border-slate-700 last:border-0 text-white"
                >
                  <div className="text-left">
                    <p className="font-black text-amber-500">{v.plate}</p>
                    <p className="text-xs opacity-70">{v.autos} {v.modelo}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Cliente: {v.clientName}</p>
                  </div>
                  <Car size={18} className="text-slate-500" />
                </button>
              ))}
            </div>
          )}
        </div>
        
        {selectedVehicle && (
          <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex justify-between items-center animate-in fade-in zoom-in">
            <div className="flex items-center gap-4">
              <div className="bg-amber-500 p-2 rounded-xl text-white"><Car size={20} /></div>
              <div>
                <p className="text-[10px] font-black uppercase text-amber-500">Vehículo Vinculado</p>
                <p className="font-bold text-white uppercase italic leading-tight">{selectedVehicle.autos} {selectedVehicle.modelo}</p>
                <p className="text-[10px] text-slate-400 font-bold">{selectedVehicle.plate} - {selectedVehicle.motores}</p>
              </div>
            </div>
            <button onClick={() => { setSelectedVehicle(null); setSearchTerm(""); }} 
            className="p-2 hover:bg-red-500/20 rounded-full text-slate-400 hover:text-red-500 transition-colors">
              <X size={18} />
            </button>
          </div>
        )}
      </div>

      {/* GRID DE BOTONES */}
      {!activeListData ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { id: 'motor', nombre: 'Listado Motor', color: 'amber', icon: FileText },
            { id: 'tapa', nombre: 'Listado Tapa', color: 'blue', icon: FileText },
            { id: 'distribucion', nombre: 'Listado Distribución', color: 'emerald', icon: Activity },
            { id: 'vacio', nombre: 'Listado Libre', color: 'purple', icon: Layout }
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveListData({ 
                nombre: item.nombre, 
                items: JSON.parse(JSON.stringify(listasIniciales[item.id as keyof typeof listasIniciales])) 
              })}
              className="bg-slate-800 p-6 rounded-[2rem] border border-slate-700 flex flex-col items-center group hover:border-amber-500 transition-all shadow-lg"
            >
              <div className={`bg-${item.color}-500/20 p-4 rounded-3xl mb-3 text-${item.color}-500 group-hover:scale-110 transition-transform`}>
                <item.icon size={28} />
              </div>
              <h3 className="font-black uppercase italic text-sm text-white mb-1">{item.nombre}</h3>
              <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Personalizar</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="bg-slate-800 rounded-[2.5rem] border border-slate-700 overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
          <div className="p-6 border-b border-slate-700 bg-slate-900/50 flex justify-between items-center">
            <h3 className="text-xl font-black uppercase italic text-amber-500 flex items-center gap-2">
              <Edit3 size={20} /> {activeListData.nombre}
            </h3>
            <div className="flex gap-4">
              <button onClick={() => setActiveListData(null)} className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white uppercase tracking-widest">Volver</button>
              <button onClick={generarPDF} 
              className="bg-amber-600 hover:bg-amber-500 px-6 py-2 rounded-xl font-black text-xs text-white uppercase tracking-widest flex items-center gap-2 shadow-lg">
                <Printer size={16} /> Imprimir PDF
              </button>
            </div>
          </div>
          
          <div className="max-h-[500px] overflow-y-auto p-4">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-[10px] font-black uppercase text-slate-500 tracking-widest">
                  <th className="p-4 border-b border-slate-700">Descripción del Repuesto</th>
                  <th className="p-4 border-b border-slate-700 w-32">Cant.</th>
                  <th className="p-4 border-b border-slate-700 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50 text-white">
                {activeListData.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-700/30">
                    <td className="p-2">
                      <input 
                        className="bg-transparent w-full p-2 outline-none text-sm font-bold text-slate-200 focus:bg-slate-900 rounded-lg"
                        value={item[0]}
                        onChange={(e) => handleEditItem(idx, 0, e.target.value)}
                      />
                    </td>
                    <td className="p-2">
                      <input 
                        className="bg-transparent w-full p-2 outline-none text-sm font-black text-amber-500 focus:bg-slate-900 rounded-lg text-center"
                        value={item[1]}
                        onChange={(e) => handleEditItem(idx, 1, e.target.value)}
                      />
                    </td>
                    <td className="p-2 text-center">
                      <button onClick={() => {
                        const newItems = activeListData.items.filter((_, i) => i !== idx);
                        setActiveListData({ ...activeListData, items: newItems });
                      }} className="text-slate-600 hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 flex justify-center border-t border-slate-700/50 pt-4">
              <button 
                onClick={() => setActiveListData({ ...activeListData, items: [...activeListData.items, ["", ""]] })}
                className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-6 py-2 rounded-xl text-[10px] font-black text-white uppercase tracking-[0.2em] transition-all"
              >
                <PlusCircle size={16} className="text-amber-500" /> Añadir Repuesto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
