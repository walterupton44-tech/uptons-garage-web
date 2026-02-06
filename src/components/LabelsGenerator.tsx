
import React, { useState } from 'react';
import { Tag, Printer, Save, Zap } from 'lucide-react';
import { Vehicle, MaintenanceLabel } from '../types';

interface Props {
  vehicles: Vehicle[];
}

const LabelsGenerator: React.FC<Props> = ({ vehicles }) => {
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [labelData, setLabelData] = useState<MaintenanceLabel>({
    date: new Date().toISOString().split('T')[0],
    currentMileage: 0,
    nextMileage: 0,
    oilType: '',
    nextDate: ''
  });

  const printLabel = () => {
    window.print();
  };

  const vehicle = vehicles.find(v => v.id === selectedVehicle);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center no-print">
        <div className="flex flex-col">
          <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tight">Etiquetas de Mantenimiento</h3>
          <div className="h-1 w-12 bg-yellow-400 -mt-1"></div>
        </div>
        <button 
          onClick={printLabel}
          disabled={!selectedVehicle}
          className="bg-slate-950 hover:bg-black text-white px-6 py-3 rounded-xl flex items-center gap-3 font-black uppercase italic tracking-widest disabled:opacity-50 transition-all shadow-lg hover:shadow-yellow-400/20"
        >
          <Printer size={18} /> Imprimir Etiqueta
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 no-print">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h4 className="font-black mb-6 text-slate-900 uppercase italic tracking-tight">Configurar Registro</h4>
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Vehículo</label>
              <select 
                className="w-full border-2 border-slate-100 rounded-xl p-3 font-bold text-slate-700 focus:border-yellow-400 focus:outline-none transition-all"
                value={selectedVehicle}
                onChange={e => setSelectedVehicle(e.target.value)}
              >
                <option value="">SELECCIONAR VEHÍCULO</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate} - {v.brand} {v.model}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Kilometraje Actual</label>
                <input 
                  type="number" 
                  className="w-full border-2 border-slate-100 rounded-xl p-3 font-bold text-slate-700 focus:border-yellow-400 focus:outline-none transition-all"
                  value={labelData.currentMileage}
                  onChange={e => setLabelData({...labelData, currentMileage: parseInt(e.target.value) || 0, nextMileage: (parseInt(e.target.value) || 0) + 10000})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Próximo Service (KM)</label>
                <input 
                  type="number" 
                  className="w-full border-2 border-slate-100 rounded-xl p-3 font-bold text-slate-700 focus:border-yellow-400 focus:outline-none transition-all"
                  value={labelData.nextMileage}
                  onChange={e => setLabelData({...labelData, nextMileage: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Aceite / Insumos</label>
              <input 
                type="text" 
                placeholder="EJ: 5W-30 SINTÉTICO + FILTROS"
                className="w-full border-2 border-slate-100 rounded-xl p-3 font-bold text-slate-700 focus:border-yellow-400 focus:outline-none transition-all placeholder:text-slate-300"
                value={labelData.oilType}
                onChange={e => setLabelData({...labelData, oilType: e.target.value.toUpperCase()})}
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Próxima Fecha Sugerida</label>
              <input 
                type="date" 
                className="w-full border-2 border-slate-100 rounded-xl p-3 font-bold text-slate-700 focus:border-yellow-400 focus:outline-none transition-all"
                value={labelData.nextDate}
                onChange={e => setLabelData({...labelData, nextDate: e.target.value})}
              />
            </div>
          </div>
        </div>

        <div className="bg-slate-200 p-12 rounded-3xl flex items-center justify-center border-4 border-dashed border-slate-300">
           {selectedVehicle ? (
             <div className="bg-white w-72 p-8 border-4 border-slate-950 rounded-lg shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
               {/* Decorative diagonal lines */}
               <div className="absolute top-0 left-0 w-full h-2 bg-yellow-400"></div>
               <div className="flex flex-col items-center gap-1 mb-6 w-full">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">UPTON'S</span>
                 <h2 className="text-3xl font-black text-slate-950 italic tracking-tighter flex items-center gap-1">
                    GARAGE <Zap size={24} className="fill-yellow-400 stroke-slate-950" />
                 </h2>
               </div>
               
               <div className="w-full space-y-4 text-left">
                 <div className="border-b-2 border-slate-100 pb-1">
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Patente / Placa</p>
                   <p className="text-xl font-black text-slate-950 italic">{vehicle?.plate}</p>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-2 border-b-2 border-slate-100 pb-2">
                   <div>
                     <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Realizado</p>
                     <p className="text-xs font-bold text-slate-700">{labelData.date}</p>
                   </div>
                   <div>
                     <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">KM Actual</p>
                     <p className="text-xs font-bold text-slate-700">{labelData.currentMileage.toLocaleString()}</p>
                   </div>
                 </div>

                 <div className="bg-slate-950 text-white p-4 rounded-md rotate-[-2deg] shadow-lg border-b-4 border-yellow-400">
                   <p className="text-[10px] font-black uppercase tracking-widest text-yellow-400 mb-1">PRÓXIMO SERVICE</p>
                   <p className="text-3xl font-black italic tracking-tighter">{labelData.nextMileage.toLocaleString()} <span className="text-sm">KM</span></p>
                 </div>
                 
                 <div className="pt-2">
                   <div className="flex justify-between items-end">
                      <div className="flex-1">
                         <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Insumo</p>
                         <p className="text-[10px] font-bold text-slate-800 uppercase">{labelData.oilType || '---'}</p>
                      </div>
                      <div className="text-right">
                         <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Vence</p>
                         <p className="text-[10px] font-bold text-slate-800">{labelData.nextDate || '---'}</p>
                      </div>
                   </div>
                 </div>
               </div>
               <p className="mt-8 text-[8px] font-black text-slate-300 uppercase tracking-[0.5em]">POWERED BY AI</p>
             </div>
           ) : (
             <div className="text-center space-y-4 opacity-30 italic">
                <Tag size={64} className="mx-auto" />
                <p className="font-black uppercase tracking-widest text-slate-500">Vista previa de etiqueta</p>
             </div>
           )}
        </div>
      </div>

      {/* Print Version */}
      <div className="hidden print:block print-only">
        <div className="p-8 border-4 border-black rounded-sm w-80 mx-auto text-center font-sans">
          <p className="text-[10px] font-bold tracking-widest">UPTON'S</p>
          <h2 className="text-4xl font-black italic border-b-4 border-black mb-4">GARAGE</h2>
          <p className="text-2xl font-black mb-2">{vehicle?.plate}</p>
          <div className="my-4 border-y-2 border-black py-2 grid grid-cols-2">
            <div>
              <p className="text-[10px] font-bold">FECHA</p>
              <p className="text-sm font-black">{labelData.date}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold">KM ACTUAL</p>
              <p className="text-sm font-black">{labelData.currentMileage.toLocaleString()}</p>
            </div>
          </div>
          <div className="bg-black text-white p-4 mb-4">
            <p className="text-xs font-bold tracking-widest mb-1">PRÓXIMO SERVICE A LOS:</p>
            <p className="text-4xl font-black italic">{labelData.nextMileage.toLocaleString()} KM</p>
          </div>
          <p className="text-xs font-bold uppercase mb-1">Aceite: {labelData.oilType}</p>
          <p className="text-xs font-bold">Fecha Límite: {labelData.nextDate}</p>
          <p className="mt-8 text-[8px] font-bold border-t border-black pt-2">CALIDAD Y POTENCIA EN CADA KILÓMETRO</p>
        </div>
      </div>
    </div>
  );
};

export default LabelsGenerator;
