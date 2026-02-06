import React from "react";
import { Trash2, CheckCircle2, FileText } from "lucide-react";
import { ServiceOrder, Vehicle, Client, ServiceStatus } from "../types";
import { db } from "../db";

interface Props {
  order: ServiceOrder;
  vehicles: Vehicle[];
  clients: Client[];
  canManage: boolean;
  onSendWhatsAppUpdate: (order: ServiceOrder) => void;
  onPrintOrder: (order: ServiceOrder) => void;
  onUpdateStatus: (id: string, status: ServiceStatus) => void;
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
  const vehicle = vehicles.find(v => v.id === order.vehicleId);
  const client = clients.find(c => c.id === order.clientId);

  const handleDelete = async () => {
    if (confirm("¿Eliminar orden?")) {
      await db.deleteOrder(order.id);
    }
  };

  return (
    <div className="glass-panel p-6 rounded-[32px] border border-slate-800 shadow-lg">
      <h4 className="text-lg font-black text-white italic">{order.description}</h4>
      <p className="text-slate-400 text-sm">Cliente: {client?.name || "Desconocido"}</p>
      <p className="text-slate-400 text-sm">Vehículo: {vehicle?.brand} {vehicle?.model}</p>
      <p className="text-slate-500 text-xs">Estado: {order.status}</p>
      <p className="text-slate-500 text-xs">Total: ${order.total}</p>

      <div className="flex gap-3 mt-4">
        <button onClick={() => onPrintOrder(order)} className="text-amber-500 flex items-center gap-2">
          <FileText size={16} /> Imprimir
        </button>
        <button onClick={() => onSendWhatsAppUpdate(order)} className="text-green-500 flex items-center gap-2">
          <CheckCircle2 size={16} /> WhatsApp
        </button>
        {canManage && (
          <>
            <button onClick={() => onUpdateStatus(order.id, ServiceStatus.COMPLETED)} className="text-blue-500">
              Marcar Completada
            </button>
            {order.status === ServiceStatus.BUDGET && (
              <button onClick={() => onConvertToOrder(order.id)} className="text-purple-500">
                Convertir a Orden
              </button>
            )}
            <button onClick={handleDelete} className="text-red-500 flex items-center gap-2">
              <Trash2 size={16} /> Eliminar
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default OrderCard;
