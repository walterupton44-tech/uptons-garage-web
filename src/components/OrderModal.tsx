import React from "react";
import { Vehicle } from "../types";

interface Props {
  newOrder: { vehicleId: string; description: string; items: any[]; notes: string; isBudget: boolean };
  setNewOrder: React.Dispatch<React.SetStateAction<any>>;
  newItem: { description: string; quantity: number; unitPrice: number };
  setNewItem: React.Dispatch<React.SetStateAction<any>>;
  addItem: () => void;
  removeItem: (id: string) => void;
  onSaveOrder: () => void;
  onClose: () => void;
}

const OrderModal: React.FC<Props> = ({
  newOrder,
  setNewOrder,
  newItem,
  setNewItem,
  addItem,
  removeItem,
  onSaveOrder,
  onClose
}) => {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6 backdrop-blur-md">
      <div className="glass-panel rounded-[40px] max-w-lg w-full p-10 shadow-3xl border border-slate-700">
        <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-8">
          {newOrder.isBudget ? "Nuevo Presupuesto" : "Nueva Work Order"}
        </h3>

        <div className="space-y-6">
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase mb-2">Descripción</label>
            <input
              type="text"
              className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl p-4 text-white font-bold"
              value={newOrder.description}
              onChange={e => setNewOrder({ ...newOrder, description: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-500 uppercase mb-2">Notas</label>
            <textarea
              className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl p-4 text-white font-bold"
              value={newOrder.notes}
              onChange={e => setNewOrder({ ...newOrder, notes: e.target.value })}
            />
          </div>

          <div>
            <h4 className="text-white font-black mb-2">Items</h4>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Descripción"
                className="flex-1 bg-slate-950 border-2 border-slate-800 rounded-2xl p-2 text-white"
                value={newItem.description}
                onChange={e => setNewItem({ ...newItem, description: e.target.value })}
              />
              <input
                type="number"
                placeholder="Cantidad"
                className="w-20 bg-slate-950 border-2 border-slate-800 rounded-2xl p-2 text-white"
                value={newItem.quantity}
                onChange={e => setNewItem({ ...newItem, quantity: parseInt(e.target.value) })}
              />
              <input
                type="number"
                placeholder="Precio"
                className="w-24 bg-slate-950 border-2 border-slate-800 rounded-2xl p-2 text-white"
                value={newItem.unitPrice}
                onChange={e => setNewItem({ ...newItem, unitPrice: parseFloat(e.target.value) })}
              />
              <button onClick={addItem} className="bg-amber-500 px-4 rounded-xl text-slate-950 font-black">
                Agregar
              </button>
            </div>

            <ul className="space-y-2">
              {newOrder.items.map(item => (
                <li key={item.id} className="flex justify-between text-slate-400">
                  <span>{item.description} x{item.quantity} (${item.unitPrice})</span>
                  <button onClick={() => removeItem(item.id)} className="text-red-500">Eliminar</button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex gap-4">
          <button onClick={onClose} className="flex-1 px-6 py-4 bg-slate-800 text-white rounded-2xl font-black uppercase italic tracking-widest hover:bg-slate-700 transition-all">
            Cancelar
          </button>
          <button onClick={onSaveOrder} className="flex-1 px-6 py-4 bg-amber-500 text-slate-950 rounded-2xl font-black uppercase italic tracking-widest hover:bg-amber-400 transition-all">
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderModal;
