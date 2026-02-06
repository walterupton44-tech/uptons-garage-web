import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { Save, TrendingUp, DollarSign } from "lucide-react";

export default function AdminCategorias() {
  const [categorias, setCategorias] = useState<any[]>([]);
  const [editando, setEditando] = useState<string | null>(null);
  const [nuevoValor, setNuevoValor] = useState<number>(0);
  const [porcentaje, setPorcentaje] = useState<number>(0);

  useEffect(() => {
    fetchCategorias();
  }, []);

  const fetchCategorias = async () => {
    const { data } = await supabase.from("categorias_hora").select("*").order("nombre");
    setCategorias(data || []);
  };

  // Actualizar un valor manual
  const handleUpdateValor = async (id: string) => {
    const { error } = await supabase
      .from("categorias_hora")
      .update({ valor_hora: nuevoValor, updated_at: new Date() })
      .eq("id", id);
    
    if (!error) {
      setEditando(null);
      fetchCategorias();
    }
  };

  // Aumento masivo por porcentaje
  const aplicarAumentoMasivo = async () => {
    if (!confirm(`¿Aplicar un aumento del ${porcentaje}% a TODAS las categorías?`)) return;
    
    // Lo ideal es hacerlo con un RPC en Supabase, pero aquí lo haremos uno a uno para simplificar
    for (const cat of categorias) {
      const valorAumentado = Math.round(cat.valor_hora * (1 + porcentaje / 100));
      await supabase
        .from("categorias_hora")
        .update({ valor_hora: valorAumentado })
        .eq("id", cat.id);
    }
    setPorcentaje(0);
    fetchCategorias();
    alert("Precios actualizados");
  };

  return (
    <div className="p-6 bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <DollarSign className="text-green-400" /> Configuración de Precios por Hora
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* LISTA DE CATEGORÍAS */}
        <div className="space-y-4">
          {categorias.map((cat) => (
            <div key={cat.id} className="bg-slate-900 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
              <div>
                <span className="text-amber-500 font-bold text-lg">Cat {cat.nombre}</span>
                <p className="text-xs text-slate-500">Último cambio: {new Date(cat.updated_at).toLocaleDateString()}</p>
              </div>
              
              {editando === cat.id ? (
                <div className="flex gap-2">
                  <input 
                    type="number" 
                    className="w-24 bg-slate-800 border border-amber-500 rounded px-2 text-sm"
                    defaultValue={cat.valor_hora}
                    onChange={(e) => setNuevoValor(Number(e.target.value))}
                  />
                  <button onClick={() => handleUpdateValor(cat.id)} className="bg-green-600 p-2 rounded hover:bg-green-700">
                    <Save size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <span className="text-xl font-mono font-bold">${cat.valor_hora.toLocaleString()}</span>
                  <button 
                    onClick={() => { setEditando(cat.id); setNuevoValor(cat.valor_hora); }}
                    className="text-xs text-blue-400 hover:underline"
                  >
                    Editar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* HERRAMIENTA DE INFLACIÓN */}
        <div className="bg-amber-600/10 p-6 rounded-xl border border-amber-600/20 self-start">
          <h3 className="text-amber-500 font-bold mb-2 flex items-center gap-2">
            <TrendingUp size={20} /> Ajuste por Inflación
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            Esto aumentará el valor de la hora de todas las categorías simultáneamente.
          </p>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <span className="absolute right-3 top-2 text-slate-500">%</span>
              <input 
                type="number" 
                placeholder="Ej: 15"
                className="w-full bg-slate-900 border border-slate-700 p-2 rounded-lg focus:outline-none focus:border-amber-500"
                value={porcentaje || ""}
                onChange={(e) => setPorcentaje(Number(e.target.value))}
              />
            </div>
            <button 
              onClick={aplicarAumentoMasivo}
              className="bg-amber-600 hover:bg-amber-700 px-4 py-2 rounded-lg font-bold transition-colors"
            >
              Aplicar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}