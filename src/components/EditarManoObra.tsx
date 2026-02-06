import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { Save, Edit2, X, Search, Filter, DollarSign } from "lucide-react";

export default function EditarManoObra() {
  const [trabajos, setTrabajos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [tempData, setTempData] = useState<any>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGrupo, setFilterGrupo] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: c } = await supabase.from("categorias_hora").select("*").order("nombre");
    const { data: t } = await supabase.from("mano_de_obra").select("*").order("grupo");
    setCategorias(c || []);
    setTrabajos(t || []);
  };

  const getPrecioProyectado = (idCat: string, horas: any) => {
    const cat = categorias.find(c => c.id === idCat);
    if (!cat) return 0;
    return (cat.valor_hora * parseFloat(horas)) || 0;
  };

  const startEdit = (trabajo: any) => {
    setEditId(trabajo.id);
    setTempData({ ...trabajo });
  };

  const handleSave = async () => {
    const dataToSave = { 
      ...tempData, 
      horas_estimadas: parseFloat(tempData.horas_estimadas).toString() 
    };
    const { error } = await supabase.from("mano_de_obra").update(dataToSave).eq("id", editId);
    if (!error) {
      setEditId(null);
      fetchData();
    }
  };

  const trabajosFiltrados = trabajos.filter(t => {
    const matchSearch = t.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        t.grupo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchGrupo = filterGrupo === "" || t.grupo === filterGrupo;
    return matchSearch && matchGrupo;
  });

  const gruposUnicos = Array.from(new Set(trabajos.map(t => t.grupo)));

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-2xl">
      {/* HEADER DE HERRAMIENTAS */}
      <div className="p-4 bg-slate-700/50 border-b border-slate-600 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por descripción o grupo..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm outline-none focus:border-amber-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="bg-slate-900 border border-slate-600 p-2 rounded-lg text-sm outline-none"
          value={filterGrupo}
          onChange={(e) => setFilterGrupo(e.target.value)}
        >
          <option value="">Todos los Grupos</option>
          {gruposUnicos.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      {/* TABLA */}
      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
        <table className="w-full text-left text-sm border-separate border-spacing-0">
          <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] sticky top-0 z-10">
            <tr>
              <th className="p-4 border-b border-slate-700">Grupo / Trabajo</th>
              <th className="p-4 border-b border-slate-700">Categoría</th>
              <th className="p-4 border-b border-slate-700 text-center">Horas</th>
              <th className="p-4 border-b border-slate-700 text-right">Precio Actual</th>
              <th className="p-4 border-b border-slate-700 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {trabajosFiltrados.map((t) => {
              const precio = getPrecioProyectado(t.id_categoria, t.horas_estimadas);
              const precioEdit = editId === t.id ? getPrecioProyectado(tempData.id_categoria, tempData.horas_estimadas) : 0;

              return (
                <tr key={t.id} className={`transition-colors ${editId === t.id ? 'bg-amber-900/20' : 'hover:bg-slate-700/20'}`}>
                  {editId === t.id ? (
                    <>
                      <td className="p-3">
                        <div className="space-y-1">
                          <input className="bg-slate-900 p-2 w-full rounded border border-amber-500 text-xs text-amber-500 font-bold" value={tempData.grupo} onChange={e => setTempData({...tempData, grupo: e.target.value})} />
                          <input className="bg-slate-900 p-2 w-full rounded border border-amber-500 text-sm" value={tempData.descripcion} onChange={e => setTempData({...tempData, descripcion: e.target.value})} />
                        </div>
                      </td>
                      <td className="p-3">
                        <select className="bg-slate-900 p-2 w-full rounded border border-amber-500 text-xs" value={tempData.id_categoria} onChange={e => setTempData({...tempData, id_categoria: e.target.value})}>
                          {categorias.map(cat => <option key={cat.id} value={cat.id}>Cat {cat.nombre}</option>)}
                        </select>
                      </td>
                      <td className="p-3">
                        <input type="number" step="0.1" className="bg-slate-900 p-2 w-16 mx-auto text-center rounded border border-amber-500 font-mono" value={tempData.horas_estimadas} onChange={e => setTempData({...tempData, horas_estimadas: e.target.value})} />
                      </td>
                      <td className="p-3 text-right">
                        <div className="text-green-400 font-bold font-mono">${precioEdit.toLocaleString()}</div>
                        <div className="text-[10px] text-slate-500 italic">Cálculo en vivo</div>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={handleSave} className="bg-green-600 p-2 rounded hover:bg-green-700"><Save size={16}/></button>
                          <button onClick={() => setEditId(null)} className="bg-slate-600 p-2 rounded hover:bg-slate-500"><X size={16}/></button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-4">
                        <div className="text-[10px] text-amber-500 font-bold uppercase mb-1">{t.grupo}</div>
                        <div className="text-slate-200 font-medium">{t.descripcion}</div>
                      </td>
                      <td className="p-4">
                        <span className="bg-blue-900/30 text-blue-400 px-2 py-1 rounded text-xs border border-blue-800/50">
                          Cat {categorias.find(c => c.id === t.id_categoria)?.nombre}
                        </span>
                      </td>
                      <td className="p-4 text-center font-mono text-slate-400">{t.horas_estimadas} hs</td>
                      <td className="p-4 text-right">
                        <div className="text-green-400 font-bold font-mono">${precio.toLocaleString()}</div>
                      </td>
                      <td className="p-4 text-right">
                        <button onClick={() => startEdit(t)} className="p-2 text-slate-500 hover:text-white hover:bg-slate-700 rounded-lg transition-all">
                          <Edit2 size={16}/>
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
