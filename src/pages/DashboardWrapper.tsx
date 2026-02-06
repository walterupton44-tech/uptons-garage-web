import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { useAuth } from "../contexts/AuthContext";
import Dashboard from '../components/Dashboard';
import CustomerDashboard from '../components/CustomerDashboard';

const DashboardWrapper: React.FC = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ orders: [], vehicles: [], appointments: [], clients: [] });

  useEffect(() => {
    if (authLoading) return;

    const fetchData = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        const role = currentUser.role?.toLowerCase();
        const cid = currentUser.client_id;

        // Consultas base
        let oQ = supabase.from("service_orders").select("*");
        let vQ = supabase.from("vehicles").select("*");

        // Aplicamos el filtro si es cliente (usando el ID que ya confirmamos que tienes)
        if (role === 'cliente' && cid) {
          oQ = oQ.eq("client_id", cid);
          vQ = vQ.eq("client_id", cid);
        }

        const [resO, resV] = await Promise.all([oQ, vQ]);

        setData(prev => ({
          ...prev,
          orders: resO.data || [],
          vehicles: resV.data || []
        }));
      } catch (err) {
        console.error("Error cargando tablas:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0B0F1A]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-orange-500"></div>
      </div>
    );
  }

  // Si el rol es cliente o CLIENT, mostramos el Dashboard de cliente
  if (currentUser?.role?.toLowerCase() === 'cliente' || currentUser?.role === 'CLIENT') {
    return (
      <CustomerDashboard 
        stats={{
          vehicles: data.vehicles.length,
          orders: data.orders.filter((o: any) => o.status !== 'FINALIZADO').length
        }} 
      />
    );
  }

  return (
    <Dashboard 
     
     
     
     
    />
  );
};

export default DashboardWrapper;