import React from "react";
import { Trash2, CheckCircle2, FileText } from "lucide-react";
import { ServiceOrder, Vehicle, Client, ServiceStatus } from "../types";
// Asegúrate de que db esté bien configurado para Supabase, 
// si usas Supabase directamente podrías no necesitar esta importación de "../db"
import { db } from "../db"; 

interface Props {
  order: ServiceOrder;
  vehicles: Vehicle[];
  clients: Client[];
  canManage: boolean;
  onSendWhatsAppUpdate: (order: ServiceOrder) => void;
  onPrintOrder: (order: ServiceOrder) => void;
  onUpdateStatus: (id: string, status: any) => void; // Cambiado a any temporalmente para evitar error de enum
  onConvertToOrder: (id: string) => void;
}

const OrderCard: React.FC<Props> = ({
  order,
  vehicles,
  clients,
  canManage,
  onSendWhatsAppUpdate,
  onPrintOrder,
  onUpdateStatus,
  onConvertToOrder
}) => {
  // 1. CORRECCIÓN DE NOMBRES: Usamos vehicle_id y client_id como dice tu types.ts
  const vehicle = vehicles.find(v => v.id === order.vehicle_id);
  const client = clients.find(c => c.id === order.client_id);

  const handleDelete = async () => {
    if (confirm("¿Eliminar orden?")) {
      await db.deleteOrder(order.id);
    }
  };

  return (
    <div className="glass-panel p-6 rounded-[32px] border border-slate-800 shadow-lg bg-slate-900/50">
      <h4 className="text-lg font-black text-white italic">{order.description}</h4>
      <p className="text-slate-400 text-sm">Cliente: {client?.full_name || client?.name || "Desconocido"}</p>
      <p className="text-slate-400 text-sm">Vehículo: {vehicle?.brand} {vehicle?.model}</p>
      <p className="text-slate-500 text-xs">Estado: {order.status}</p>
      <p className="text-slate-500 text-xs">Total: ${order.total}</p>

      <div className="flex flex-wrap gap-3 mt-4">
        <button onClick={() => onPrintOrder(order)} className="text-amber-500 flex items-center gap-2 hover:bg-amber-500/10 p-2 rounded-lg transition-all">
          <FileText size={16} /> Imprimir
        </button>
        <button onClick={() => onSendWhatsAppUpdate(order)} className="text-green-500 flex items-center gap-2 hover:bg-green-500/10 p-2 rounded-lg transition-all">
          <CheckCircle2 size={16} /> WhatsApp
        </button>
        
        {canManage && (
          <>
            {/* 2. CORRECCIÓN DE ENUM: Si COMPLETED no existe, probablemente sea 'finalizado' o similar */}
            <button 
              onClick={() => onUpdateStatus(order.id, 'finalizado')} 
              className="text-blue-500 hover:bg-blue-500/10 p-2 rounded-lg transition-all"
            >
              Marcar Completada
            </button>

            {/* 3. CORRECCIÓN DE ESTADO BUDGET */}
            {order.status as any === 'presupuesto' && (
              <button onClick={() => onConvertToOrder(order.id)} className="text-purple-500 hover:bg-purple-500/10 p-2 rounded-lg transition-all">
                Convertir a Orden
              </button>
            )}
            
            <button onClick={handleDelete} className="text-red-500 flex items-center gap-2 hover:bg-red-500/10 p-2 rounded-lg transition-all">
              <Trash2 size={16} /> Eliminar
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default OrderCard;