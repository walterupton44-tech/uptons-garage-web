import { useState } from "react";
import { 
  Wrench, Car, UserCog, Settings, ArrowLeft, 
  ClipboardList, Building2, Package, List  // 👈 Añadido icono 'List'
} from "lucide-react";
import AdminCategorias from "./AdminCategorias"; 
import EditarManoObra from "./EditarManoObra";
import ConfigTaller from "./ConfigTaller";
import Inventory from "./Inventory";
import ListaRepuestos from "./ListaRepuestos";

export default function MaintenanceModule() {
  // 1. Agregamos 'lista_repuestos' a los estados posibles
  const [activeSubModule, setActiveSubModule] = useState<null | 'categorias' | 'editar_mano_obra' | 'config' | 'repuestos' | 'lista_repuestos'>(null);

  // --- LÓGICA PARA MOSTRAR LOS SUB-MODULOS ---
  const renderBackButton = () => (
    <button 
      onClick={() => setActiveSubModule(null)} 
      className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
    >
      <ArrowLeft size={20} /> Volver
    </button>
  );

  if (activeSubModule === 'categorias') {
    return <div className="p-8 bg-slate-900 min-h-screen">{renderBackButton()}<AdminCategorias /></div>;
  }

  if (activeSubModule === 'editar_mano_obra') {
    return <div className="p-8 bg-slate-900 min-h-screen">{renderBackButton()}<EditarManoObra /></div>;
  }

  if (activeSubModule === 'config') {
    return <div className="p-8 bg-slate-900 min-h-screen">{renderBackButton()}<ConfigTaller /></div>;
  }

  if (activeSubModule === 'repuestos') {
    return <div className="p-8 bg-slate-900 min-h-screen">{renderBackButton()}<Inventory /></div>;
  }

  // 2. NUEVA CONDICIÓN PARA EL MÓDULO DE LISTA DE REPUESTOS
if (activeSubModule === 'lista_repuestos') {
  return (
    <div className="p-8 bg-slate-900 min-h-screen">
      <button 
        onClick={() => setActiveSubModule(null)} 
        className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft size={20} /> Volver
      </button>
      <ListaRepuestos /> 
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

        {/* TARJETA 2: LISTADO MANO DE OBRA */}
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 hover:border-green-500 transition-all">
          <ClipboardList className="text-green-500 mb-4" size={32} />
          <h2 className="text-xl font-bold mb-2">Mano de Obra</h2>
          <button onClick={() => setActiveSubModule('editar_mano_obra')} className="w-full bg-green-600 p-2 rounded font-bold mt-4">
            Editar Trabajos
          </button>
        </div>

        {/* TARJETA 3: DATOS DEL TALLER */}
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 hover:border-purple-500 transition-all">
          <Building2 className="text-purple-500 mb-4" size={32} />
          <h2 className="text-xl font-bold mb-2">Datos del Taller</h2>
          <p className="text-slate-400 text-sm">Configura el logo y datos del PDF.</p>
          <button onClick={() => setActiveSubModule('config')} className="w-full bg-purple-600 p-2 rounded font-bold mt-4">
            Configurar PDF
          </button>
        </div>

        {/* TARJETA 4: STOCK REPUESTOS */}
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 hover:border-orange-500 transition-all">
          <Package className="text-orange-500 mb-4" size={32} />
          <h2 className="text-xl font-bold mb-2">Stock Repuestos</h2>
          <p className="text-slate-400 text-sm">Control de inventario, costos y márgenes.</p>
          <button onClick={() => setActiveSubModule('repuestos')} className="w-full bg-orange-600 p-2 rounded font-bold mt-4">
            Ir al Inventario
          </button>
        </div>

        {/* 3. NUEVA TARJETA 5: LISTA DE REPUESTOS */}
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 hover:border-pink-500 transition-all shadow-lg">
          <List className="text-pink-500 mb-4" size={32} />
          <h2 className="text-xl font-bold mb-2">Lista de Repuestos</h2>
          <p className="text-slate-400 text-sm">Visualización rápida y búsqueda de ítems.</p>
          <button 
            onClick={() => setActiveSubModule('lista_repuestos')} 
            className="w-full bg-pink-600 hover:bg-pink-500 p-2 rounded font-bold mt-4 transition-colors"
          >
            Ver Catálogo
          </button>
        </div>

      </div>
    </div>
  );
}