import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, Users, Car, ClipboardList, CalendarDays, 
  FileCheck2, ChevronRight, Settings, LogOut, Menu, X,
  DollarSign, Receipt, Wallet, Scale, ChevronDown
} from "lucide-react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import logo from "../assets/Logo.png";
import UserAccountModal from "./UserAccountModal";

const lang = "es";

interface DashboardLayoutProps {
  role: string | null;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ role: initialRole }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Por defecto cerrado en móvil
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const [userData, setUserData] = useState<{ id: string; avatar_url?: string; name?: string } | null>(null);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  
  const [role, setRole] = useState<string | null>(initialRole);
  const location = useLocation();
  const navigate = useNavigate();

  // Control de tamaño de pantalla
  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      if (desktop) setSidebarOpen(true);
      else setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Ejecutar al inicio
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role, avatar_url, full_name')
          .eq('id', user.id)
          .single();
        
        if (!error && profile) {
          setRole(profile.role);
          setUserData({
            id: user.id,
            avatar_url: profile.avatar_url,
            name: profile.full_name
          });
        }
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };
  
  useEffect(() => { fetchUserData(); }, [initialRole]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const labels = {
    es: {
      inicio: "Inicio", dashboard: "Dashboard", clientes: "Clientes", vehiculos: "Vehículos",
      ordenes: "Órdenes", agenda: "Agenda", certificados: "Certificados",
      mantenimiento: "Centro de Control", administracion: "Administración",
      presupuestos: "Presupuestos", facturacion: "Facturación", gastos: "Gastos",
      balance: "Balance Mensual", caja: "Caja Diaria", salir: "Cerrar Sesión"
    }
  };

  const menuItems = [  
    { id: "inicio", label: labels[lang].inicio, icon: LayoutDashboard, path: "/mis-reparaciones", roles: ['cliente'] },
    { id: "dashboard", label: labels[lang].dashboard, icon: LayoutDashboard, path: "/dashboard", roles: ['admin', 'mecanico'] }, 
    { id: "clientes", label: labels[lang].clientes, icon: Users, path: "/clients", roles: ['admin', 'mecanico'] }, 
    { id: "vehiculos", label: labels[lang].vehiculos, icon: Car, path: "/vehicles", roles: ['admin', 'mecanico', 'cliente'] },  
    { id: "ordenes", label: labels[lang].ordenes, icon: ClipboardList, path: "/orders", roles: ['admin', 'mecanico', 'cliente'] },
    { id: "agenda", label: labels[lang].agenda, icon: CalendarDays, path: "/agenda", roles: ['admin', 'mecanico', 'cliente'] },  
    { id: "certificados", label: labels[lang].certificados, icon: FileCheck2, path: "/certificates", roles: ['admin', 'mecanico'] }, 
    { id: "mantenimiento", label: labels[lang].mantenimiento, icon: Settings, path: "/mantenimiento", roles: ['admin'] },
  ];

  const adminSubItems = [
    { id: "presupuestos", label: labels[lang].presupuestos, icon: DollarSign, path: "/quotes" },
    { id: "facturacion", label: labels[lang].facturacion, icon: Receipt, path: "/invoices" },
    { id: "gastos", label: labels[lang].gastos, icon: Wallet, path: "/gastos" },
    { id: "balance", label: labels[lang].balance, icon: Scale, path: "/balance" },
    { id: "Caja", label: labels[lang].caja, icon: Wallet, path: "/caja" },
  ];

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden text-slate-200 font-sans">
      
       {/* OVERLAY PARA MÓVIL CON ESTILO UPTON GARAGE */}
{!isDesktop && sidebarOpen && (
  <div 
    className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-30 transition-opacity duration-500 animate-in fade-in"
    onClick={() => setSidebarOpen(false)}
  >
    {/* Efecto de brillo naranja en el fondo del overlay */}
    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent pointer-events-none" />
  </div>
)} 

      {/* ASIDE RESPONSIVO */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 lg:relative
        ${sidebarOpen ? "w-72 translate-x-0" : "w-0 -translate-x-full lg:w-24 lg:translate-x-0"}
        bg-slate-900 border-r border-slate-800 transition-all duration-300 flex flex-col
      `}> 
        <div className="p-6 flex items-center justify-between h-20 md:h-24 border-b border-slate-800/50"> 
          <img src={logo} alt="Logo" className={`${sidebarOpen ? "h-12" : "h-8"} w-auto mx-auto`} />
          {!isDesktop && (
            <button onClick={() => setSidebarOpen(false)} className="text-slate-500"><X /></button>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto mt-4 space-y-1 px-4">
          {menuItems
            .filter(item => item.id === 'inicio' ? role === 'cliente' : (role === 'admin' || item.roles.includes(role || '')))
            .map((item) => (
              <Link 
                key={item.id} 
                to={item.path} 
                onClick={() => !isDesktop && setSidebarOpen(false)}
                className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                  location.pathname === item.path 
                  ? "bg-orange-600/10 text-orange-500 border border-orange-500/20" 
                  : "text-slate-500 hover:text-slate-200"
                }`}
              >
                <item.icon size={22} className="shrink-0" />
                {sidebarOpen && <span className="uppercase text-[11px] font-black tracking-widest truncate">{item.label}</span>}
              </Link>
            ))}

          {role === 'admin' && sidebarOpen && (
            <div className="mt-4">
              <button onClick={() => setAdminMenuOpen(!adminMenuOpen)} className="w-full flex items-center justify-between p-4 text-slate-400 text-[11px] font-black tracking-widest uppercase">
                <span>{labels[lang].administracion}</span>
                <ChevronDown size={14} className={adminMenuOpen ? "rotate-180" : ""} />
              </button>
              {adminMenuOpen && (
                <div className="ml-4 border-l border-slate-800 space-y-1">
                  {adminSubItems.map((sub) => (
                    <Link key={sub.id} to={sub.path} onClick={() => !isDesktop && setSidebarOpen(false)} className="flex items-center gap-3 p-3 text-slate-500 hover:text-white">
                      <sub.icon size={16} />
                      <span className="text-[10px] font-bold uppercase">{sub.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-slate-800/50 space-y-2">
          <button onClick={handleLogout} className="w-full flex items-center gap-4 p-4 rounded-xl text-red-500 hover:bg-red-500/10 transition-all">
            <LogOut size={22} />
            {sidebarOpen && <span className="uppercase text-[11px] font-black tracking-widest">Salir</span>}
          </button>
          {isDesktop && (
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-full p-2 text-slate-600 hover:text-orange-500 flex justify-center">
              <ChevronRight className={sidebarOpen ? "rotate-180" : ""} />
            </button>
          )}
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 overflow-y-auto flex flex-col bg-[#0B0F1A] relative">
        <header className="h-20 md:h-24 flex items-center justify-between px-4 md:px-10 border-b border-slate-800/30 bg-slate-900/40 backdrop-blur-xl sticky top-0 z-10">
          <div className="flex items-center gap-4">
            {!isDesktop && (
              <button onClick={() => setSidebarOpen(true)} className="p-2 text-slate-400 bg-slate-800 rounded-lg"><Menu size={20} /></button>
            )}
            <div className="text-left">
              <h2 className="text-lg md:text-2xl font-black text-white uppercase italic tracking-tighter">
                Upton's <span className="text-orange-500">Garage</span>
              </h2>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="text-right hidden sm:block">
                <p className="text-[9px] font-black text-white uppercase tracking-tighter leading-none">Conectado como</p>
                <p className="text-[10px] font-bold text-orange-500 uppercase truncate max-w-[100px]">{userData?.name || role}</p>
             </div>
             
             <button 
                onClick={() => setShowAccountModal(true)}
                className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-orange-500 border-2 border-orange-400 overflow-hidden hover:scale-105 transition-transform shrink-0"
             >
              {userData?.avatar_url ? (
                <img src={userData.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-orange-600 text-white font-bold">
                  {userData?.name?.charAt(0) || 'U'}
                </div>
              )}  
             </button>
          </div>
        </header>

        {/* CONTENEDOR DE PÁGINAS */}
        <div className="p-4 md:p-8 lg:p-12 w-full max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      <UserAccountModal 
        isOpen={showAccountModal} 
        onClose={() => { setShowAccountModal(false); fetchUserData(); }} 
        userId={userData?.id || ""} 
      />
    </div>
  );
};

export default DashboardLayout;