import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { Car, ChevronRight, Plus, Trash2 } from "lucide-react";

export default function CatalogAutos() {
  const [marcas, setMarcas] = useState<any[]>([]);
  const [modelos, setModelos] = useState<any[]>([]);
  const [motores, setMotores] = useState<any[]>([]);

  const [selectedMarca, setSelectedMarca] = useState("");
  const [selectedModelo, setSelectedModelo] = useState("");

  const [inputMarca, setInputMarca] = useState("");
  const [inputModelo, setInputModelo] = useState("");
  const [inputMotor, setInputMotor] = useState("");

  useEffect(() => { fetchMarcas(); }, []);

  // --- CARGAS DE DATOS ---
  const fetchMarcas = async () => {
    const { data } = await supabase.from("autos").select("*").order("marcas");
    setMarcas(data || []);
  };

  const fetchModelos = async (marcaId: string) => {
    setSelectedMarca(marcaId);
    setSelectedModelo("");
    setMotores([]);
    const { data } = await supabase.from("modelo").select("*").eq("idmarca", marcaId).order("modelos");
    setModelos(data || []);
  };

  const fetchMotores = async (modeloId: string) => {
    setSelectedModelo(modeloId);
    const { data } = await supabase.from("motores").select("*").eq("idmod", modeloId).order("motor");
    setMotores(data || []);
  };

  // --- ALTAS ---
  const addMarca = async () => {
    if (!inputMarca) return;
    const { error } = await supabase.from("autos").insert([{ marcas: inputMarca.toUpperCase() }]);
    if (!error) { setInputMarca(""); fetchMarcas(); }
  };

  const addModelo = async () => {
    if (!inputModelo || !selectedMarca) return;
    const { error } = await supabase.from("modelo").insert([{ modelos: inputModelo.toUpperCase(), idmarca: selectedMarca }]);
    if (!error) { setInputModelo(""); fetchModelos(selectedMarca); }
  };

  const addMotor = async () => {
    if (!inputMotor || !selectedModelo) return;
    const { error } = await supabase.from("motores").insert([{ motor: inputMotor.toUpperCase(), idmod: selectedModelo }]);
    if (!error) { setInputMotor(""); fetchMotores(selectedModelo); }
  };

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-8 flex items-center gap-2">
        <Car className="text-amber-500" /> Catálogo de Vehículos
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* COLUMNA 1: MARCAS */}
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
          <h2 className="text-sm font-bold text-slate-400 mb-4 uppercase">1. Marcas</h2>
          <div className="flex gap-2 mb-4">
            <input 
              value={inputMarca} onChange={e => setInputMarca(e.target.value)}
              placeholder="Nueva Marca" className="flex-1 bg-slate-900 border border-slate-700 p-2 rounded text-sm"
            />
            <button onClick={addMarca} className="bg-amber-600 p-2 rounded"><Plus size={18}/></button>
          </div>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {marcas.map(m => (
              <button 
                key={m.id} onClick={() => fetchModelos(m.id)}
                className={`w-full text-left p-2 rounded text-sm flex justify-between items-center ${selectedMarca === m.id ? 'bg-amber-600' : 'hover:bg-slate-700'}`}
              >
                {m.marcas} <ChevronRight size={14}/>
              </button>
            ))}
          </div>
        </div>

        {/* COLUMNA 2: MODELOS */}
        <div className={`bg-slate-800 p-4 rounded-xl border border-slate-700 ${!selectedMarca && 'opacity-30 pointer-events-none'}`}>
          <h2 className="text-sm font-bold text-slate-400 mb-4 uppercase">2. Modelos</h2>
          <div className="flex gap-2 mb-4">
            <input 
              value={inputModelo} onChange={e => setInputModelo(e.target.value)}
              placeholder="Nuevo Modelo" className="flex-1 bg-slate-900 border border-slate-700 p-2 rounded text-sm"
            />
            <button onClick={addModelo} className="bg-amber-600 p-2 rounded"><Plus size={18}/></button>
          </div>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {modelos.map(m => (
              <button 
                key={m.idmod} onClick={() => fetchMotores(m.idmod)}
                className={`w-full text-left p-2 rounded text-sm flex justify-between items-center ${selectedModelo === m.idmod ? 'bg-blue-600' : 'hover:bg-slate-700'}`}
              >
                {m.modelos} <ChevronRight size={14}/>
              </button>
            ))}
          </div>
        </div>

        {/* COLUMNA 3: MOTORES */}
        <div className={`bg-slate-800 p-4 rounded-xl border border-slate-700 ${!selectedModelo && 'opacity-30 pointer-events-none'}`}>
          <h2 className="text-sm font-bold text-slate-400 mb-4 uppercase">3. Motores</h2>
          <div className="flex gap-2 mb-4">
            <input 
              value={inputMotor} onChange={e => setInputMotor(e.target.value)}
              placeholder="Nuevo Motor" className="flex-1 bg-slate-900 border border-slate-700 p-2 rounded text-sm"
            />
            <button onClick={addMotor} className="bg-amber-600 p-2 rounded"><Plus size={18}/></button>
          </div>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {motores.map(m => (
              <div key={m.id} className="p-2 bg-slate-900 border border-slate-700 rounded text-sm flex justify-between items-center group">
                {m.motor}
                <button className="text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                   <Trash2 size={14}/>
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}