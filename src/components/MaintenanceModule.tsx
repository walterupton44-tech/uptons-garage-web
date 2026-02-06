

import { useState } from "react";
import { Wrench, Car, UserCog, Settings, ArrowLeft, ClipboardList, Building2 } from "lucide-react";
import AdminCategorias from "./AdminCategorias"; 
import CatalogAutos from "./CatalogAutos";
import EditarManoObra from "./EditarManoObra";
import ConfigTaller from "./ConfigTaller"; // El nuevo componente que te pasé antes

export default function MaintenanceModule() {
  // Añadimos 'config' a los estados posibles
  const [activeSubModule, setActiveSubModule] = useState<null | 'categorias' | 'autos' | 'editar_mano_obra' | 'config'>(null);

  // --- LÓGICA PARA MOSTRAR LOS SUB-MODULOS ---
  if (activeSubModule === 'categorias') {
    return (
      <div className="p-8 bg-slate-900 min-h-screen">
        <button onClick={() => setActiveSubModule(null)} className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={20} /> Volver
        </button>
        <AdminCategorias />
      </div>
    );
  }

  if (activeSubModule === 'editar_mano_obra') {
    return (
      <div className="p-8 bg-slate-900 min-h-screen">
        <button onClick={() => setActiveSubModule(null)} className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={20} /> Volver
        </button>
        <EditarManoObra />
      </div>
    );
  }

  if (activeSubModule === 'config') {
    return (
      <div className="p-8 bg-slate-900 min-h-screen">
        <button onClick={() => setActiveSubModule(null)} className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={20} /> Volver
        </button>
        <ConfigTaller /> 
      </div>
    );
  }

  // --- MENÚ PRINCIPAL DE TARJETAS ---
  return (
    <div className="p-8 bg-slate-900 min-h-screen text-white">
      <header className="mb-10">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Settings className="text-amber-500" /> Módulo de Mantenimiento
        </h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* TARJETA 1: PRECIOS HORA */}
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 hover:border-blue-500 transition-all">
          <UserCog className="text-blue-500 mb-4" size={32} />
          <h2 className="text-xl font-bold mb-2">Precios por Hora</h2>
          <button onClick={() => setActiveSubModule('categorias')} className="w-full bg-blue-600 p-2 rounded font-bold mt-4">
            Gestionar Categorías
          </button>
        </div>

        {/* TARJETA 2: LISTADO MANO DE OBRA (LO QUE EDITAMOS RECIÉN) */}
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 hover:border-green-500 transition-all">
          <ClipboardList className="text-green-500 mb-4" size={32} />
          <h2 className="text-xl font-bold mb-2">Mano de Obra</h2>
          <button onClick={() => setActiveSubModule('editar_mano_obra')} className="w-full bg-green-600 p-2 rounded font-bold mt-4">
            Editar Trabajos
          </button>
        </div>

        {/* TARJETA 3: DATOS DEL TALLER (EL NUEVO MÓDULO) */}
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 hover:border-purple-500 transition-all">
          <Building2 className="text-purple-500 mb-4" size={32} />
          <h2 className="text-xl font-bold mb-2">Datos del Taller</h2>
          <p className="text-slate-400 text-sm">Configura el logo y datos que aparecen en el PDF.</p>
          <button onClick={() => setActiveSubModule('config')} className="w-full bg-purple-600 p-2 rounded font-bold mt-4">
            Configurar PDF
          </button>
        </div>

      </div>
    </div>
  );
}