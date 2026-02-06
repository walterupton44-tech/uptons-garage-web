import { useEffect, useState } from "react";
import { supabase } from "../supabase";

export default function FormManoObra() {
  const [categorias, setCategorias] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    grupo: "",
    descripcion: "",
    id_categoria: "",
    horas_estimadas: 0
  });

  useEffect(() => {
    const getCats = async () => {
      const { data } = await supabase.from("categorias_hora").select("*");
      setCategorias(data || []);
    };
    getCats();
  }, []);

  const selectedCat = categorias.find(c => c.id === formData.id_categoria);
  const precioSugerido = selectedCat ? (selectedCat.valor_hora * formData.horas_estimadas) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("mano_de_obra").insert([formData]);
    if (!error) alert("Trabajo guardado exitosamente");
  };

  return (
    <div className="max-w-md mx-auto bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl">
      <h2 className="text-xl font-bold text-white mb-6 uppercase tracking-wider">Nuevo Trabajo de Mano de Obra</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs text-slate-400 block mb-1">Grupo / Sistema</label>
          <input 
            type="text" placeholder="Ej: Frenos, Motor..." 
            className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white"
            onChange={e => setFormData({...formData, grupo: e.target.value})}
          />
        </div>

        <div>
          <label className="text-xs text-slate-400 block mb-1">Descripción del trabajo</label>
          <textarea 
            placeholder="Descripción detallada..." 
            className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white h-24"
            onChange={e => setFormData({...formData, descripcion: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Categoría</label>
            <select 
              className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white"
              onChange={e => setFormData({...formData, id_categoria: e.target.value})}
            >
              <option value="">Seleccionar</option>
              {categorias.map(c => <option key={c.id} value={c.id}>Cat {c.nombre} (${c.valor_hora})</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Horas estimadas</label>
            <input 
              type="number" step="0.1" 
              className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white"
              onChange={e => setFormData({...formData, horas_estimadas: Number(e.target.value)})}
            />
          </div>
        </div>

        <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 mt-4 text-center">
          <span className="text-slate-400 text-xs block uppercase">Precio calculado al cliente</span>
          <span className="text-2xl font-bold text-green-400">${precioSugerido.toLocaleString()}</span>
        </div>

        <button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-lg transition-colors mt-4">
          Guardar en Catálogo
        </button>
      </form>
    </div>
  );
}