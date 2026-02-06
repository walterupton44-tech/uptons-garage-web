// src/pages/CertificatesPage.tsx
import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";

interface Certificate {
  id: string;
  vehicle_id: string;
  service_order_id: string;
  description: string;
  next_service_date: string | null;
  next_service_km: number | null;
}

const CertificatesPage: React.FC = () => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);

  useEffect(() => {
    const fetchCertificates = async () => {
      const { data, error } = await supabase
        .from("maintenance_labels")
        .select("*")
        .order("next_service_date", { ascending: true });
      if (error) console.error(error);
      else setCertificates(data || []);
    };
    fetchCertificates();
  }, []);

  return (
    <div className="p-10 text-white">
      <h2 className="text-2xl font-black mb-6">Certificados de Mantenimiento</h2>
      {certificates.length > 0 ? (
        <ul className="space-y-4">
          {certificates.map((c) => (
            <li key={c.id} className="p-4 bg-slate-800 rounded-xl">
              <p className="font-bold">{c.description}</p>
              <p className="text-sm text-slate-400">Vehículo: {c.vehicle_id}</p>
              <p className="text-sm text-slate-400">Orden: {c.service_order_id}</p>
              {c.next_service_date && (
                <p className="text-amber-500 font-black">
                  Próximo servicio: {new Date(c.next_service_date).toLocaleDateString()}
                </p>
              )}
              {c.next_service_km && (
                <p className="text-amber-500 font-black">
                  Próximo km: {c.next_service_km}
                </p>
              )}
              <button className="mt-3 px-4 py-2 bg-amber-500 text-black font-bold rounded-lg hover:bg-amber-400 transition">
                Imprimir Etiqueta
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-slate-400 italic">No hay certificados registrados aún.</p>
      )}
    </div>
  );
};

export default CertificatesPage;
