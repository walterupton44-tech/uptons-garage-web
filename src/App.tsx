import { useEffect, useState } from "react";
import { useRoutes, Navigate } from "react-router-dom";
import { supabase } from "./supabase";
import { Toaster } from "sonner"; // 👈 No olvides el Toaster para los mensajes

// Importación de Componentes
import DashboardLayout from "./components/DashboardLayout";
import ClientsList from "./components/ClientsList";
import VehiclesList from "./components/VehiclesList";
import ServiceOrders from "./components/ServiceOrders";
import CertificatesPage from "./components/ImpresionEtiquetas";
import QuotesPage from "./components/quotesPage";
import Facturacion from "./components/invoicesPage"; 
import AppointmentsCalendar from "./components/AppointmentsCalendar";
import Dashboard from "./components/Dashboard"; 
import Mantenimiento from "./components/CentroControl"; 
import ExpensesPage from "./components/ExpensesPage";
import BalancePage from "./components/BalancePage";
import CajaGestion from "./components/CajaGestion";
import Login from "./components/Login";
import CustomerDashboard from "./components/CustomerDashboard";

function App() {
  const [session, setSession] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getRole = async (userId: string) => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .single();
        setRole(data?.role || 'cliente');
      } catch (e) {
        setRole('cliente');
      } finally {
        setLoading(false);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        getRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        getRole(session.user.id);
      } else {
        setRole(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Definición de Rutas
  const routes = useRoutes([
    {
      // 1. PASAMOS EL ROLE AL LAYOUT (Soluciona el error de TS)
      element: session ? <DashboardLayout role={role} /> : <Navigate to="/login" replace />, 
      children: [
        // RUTA RAIZ: La ponemos primero para que mande al usuario a su sitio de inmediato
        { 
          path: "/", 
          element: <Navigate to={role === 'cliente' ? "/mis-reparaciones" : "/dashboard"} replace /> 
        },
        { 
          path: "/dashboard", 
          element: role === 'cliente' ? <Navigate to="/mis-reparaciones" replace /> : <Dashboard /> 
        },
        { path: "/clients", element: <ClientsList />},
        { path: "/vehicles", element: <VehiclesList /> },
        { path: "/orders", element: <ServiceOrders  /> },
        { path: "/agenda", element: <AppointmentsCalendar />  },
        { path: "/mantenimiento", element: <Mantenimiento /> },
        
        // --- SECCIÓN ADMINISTRACIÓN ---
        { path: "/quotes", element: <QuotesPage /> },
        { path: "/invoices", element: <Facturacion /> },
        { path: "/gastos", element: <ExpensesPage /> },
        { path: "/balance", element: <BalancePage /> },
        { path: "/caja", element: <CajaGestion /> },
        { path: "/certificates", element: <CertificatesPage /> },
        
        // --- VISTA EXCLUSIVA CLIENTE ---
        { path: "/mis-reparaciones", element: <CustomerDashboard /> },
      ],
    },
    { 
      path: "/login", 
      element: !session ? <Login /> : <Navigate to="/" replace /> 
    },
    { path: "*", element: <Navigate to={session ? "/" : "/login"} replace /> }
  ]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">
            Upton's Garage <span className="text-orange-500">Security</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" richColors theme="dark" />
      {routes}
    </>
  );
}

export default App;