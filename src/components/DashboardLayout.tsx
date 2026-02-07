import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, Users, Car, ClipboardList, CalendarDays, 
  FileCheck2, ChevronRight, Settings, LogOut,
  // 1. IMPORTAMOS LOS ICONOS QUE FALTABAN
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userData, setUserData] = useState<{ id: string; avatar_url?: string; name?: string } | null>(null);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false); // Estado para el acordeón de admin
  
  const [role, setRole] = useState<string | null>(initialRole);
  const location = useLocation();
  const navigate = useNavigate();

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
      console.error("Error al obtener datos de usuario:", err);
    }
  };
  
  useEffect(() => {
    fetchUserData();
  }, [initialRole]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const labels = {
    es: {
      inicio: "Inicio",
      dashboard: "Dashboard",
      clientes: "Clientes",
      vehiculos: "Vehículos",
      ordenes: "Órdenes",
      agenda: "Agenda",
      certificados: "Certificados",
      mantenimiento: "Centro de Control",
      administracion: "Administración",
      presupuestos: "Presupuestos",
      facturacion: "Facturación",
      gastos: "Gastos",
      balance: "Balance Mensual",
      caja: "Caja Diaria",
      salir: "Cerrar Sesión"
    }
  };

  const menuItems = [  
    { id: "inicio", label: labels[lang].inicio, icon: LayoutDashboard, path: "/mis-reparaciones", roles: ['cliente'] },
    { id: "dashboard", label: labels[lang].dashboard, icon: LayoutDashboard, path: "/dashboard", roles: ['admin', 'mecanico'] }, 
    { id: "clientes", label: labels[lang].clientes, icon: Users, path: "/clients", roles: ['admin', 'mecanico'] }, 
    { id: "vehiculos", label: labels[lang].vehiculos, icon: Car, path: "/vehicles", roles: ['admin', 'mecanico', 'cliente'] },  
    { id: "ordenes", label: labels[lang].ordenes, icon: ClipboardList, path: "/orders", roles: ['admin', 'mecanico', 'cliente'] },
    { id: "agenda", label: labels[lang].agenda, icon: CalendarDays, path: "/agenda", roles: ['admin', 'mecanico', 'cliente'] },  
    { id: "certificados", label: labels[lang].certificados, icon: FileCheck2, path: "/certificates", roles: ['admin', 'mecanico'] }, // 👈 Coma añadida
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
      <aside className={`${sidebarOpen ? "w-72" : "w-24"} bg-slate-900 border-r border-slate-800 transition-all duration-500 flex flex-col z-20`}> 
        <div onClick={() => navigate("/")} className="p-6 flex items-center justify-between h-24 border-b border-slate-800/50 cursor-pointer"> 
          <img src={logo} alt="Logo" className={`${sidebarOpen ? "h-max" : "h-10"} w-auto mx-auto`} />
        </div>

        <nav className="flex-1 overflow-y-auto mt-6 space-y-1 px-4 text-left">
          {/* ITEMS NORMALES */}
          {menuItems
    .filter(item => {
      // REGLA DE FILTRADO:
      // 1. Si el item es 'inicio', SOLO se muestra si el rol es 'cliente'
      if (item.id === 'inicio') return role === 'cliente';
      
      // 2. Para el resto de items, se muestra si el usuario es admin o si su rol está incluido
      return role === 'admin' || item.roles.includes(role || '');
    })
    .map((item) => (
      <Link 
        key={item.id} 
        to={item.path} 
        className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
          location.pathname === item.path 
          ? "bg-orange-600/10 text-orange-500 border border-orange-500/20" 
          : "text-slate-500 hover:text-slate-200"
        }`}
      >
        <item.icon size={22} />
        {sidebarOpen && <span className="uppercase text-[11px] font-black tracking-widest">{item.label}</span>}
      </Link>
            
         
              
          ))}

          {/* SECCIÓN ADMINISTRACIÓN (Solo Admin) */}
          {role === 'admin' && sidebarOpen && (
            <div className="mt-4">
              <button 
                onClick={() => setAdminMenuOpen(!adminMenuOpen)}
                className="w-full flex items-center justify-between p-4 text-slate-400 hover:text-white transition-all uppercase text-[11px] font-black tracking-[0.2em]"
              >
                <span>{labels[lang].administracion}</span>
                <ChevronDown size={16} className={`transition-transform ${adminMenuOpen ? "rotate-180" : ""}`} />
              </button>
              
              {adminMenuOpen && (
                <div className="space-y-1 ml-2 border-l border-slate-800">
                  {adminSubItems.map((sub) => (
                    <Link key={sub.id} to={sub.path} className={`flex items-center gap-4 p-3 pl-6 rounded-xl transition-all ${location.pathname === sub.path ? "text-orange-500" : "text-slate-500 hover:text-slate-200"}`}>
                      <sub.icon size={18} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">{sub.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </nav>

        {/* FOOTER SIDEBAR */}
        <div className="p-4 border-t border-slate-800/50">
          <button onClick={handleLogout} className="w-full flex items-center gap-4 p-4 rounded-xl text-red-500 hover:bg-red-500/10 transition-all">
            <LogOut size={22} />
            {sidebarOpen && <span className="uppercase text-[11px] font-black tracking-widest">{labels[lang].salir}</span>}
          </button>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-full p-2 text-slate-600 hover:text-orange-500 flex justify-center">
            <ChevronRight className={sidebarOpen ? "rotate-180" : ""} />
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto flex flex-col bg-[#0B0F1A]">
        <header className="h-24 flex items-center justify-between px-10 border-b border-slate-800/30 bg-slate-900/40 backdrop-blur-xl">
          <div className="flex flex-col text-left">
            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">
              Upton's <span className="text-orange-500">Garage</span>
            </h2>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Panel de {role}</span>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="text-right hidden md:block">
                <p className="text-[10px] font-black text-white uppercase tracking-tighter">Conectado como</p>
                <p className="text-[9px] font-bold text-orange-500 uppercase tracking-widest">{userData?.name || role}</p>
             </div>
             
             <button 
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowAccountModal(true); }}
                className="w-12 h-12 rounded-2xl bg-orange-500 border-2 border-orange-400 flex items-center justify-center text-slate-950 font-black italic hover:scale-105 active:scale-95 transition-all overflow-hidden shadow-lg shadow-orange-500/20"
             >
              {userData?.avatar_url ? (
                <img src={userData.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-orange-600 text-white font-bold uppercase">
                  {userData?.name?.charAt(0) || 'U'}
                </div>
              )}  
             </button>
          </div>
        </header>

        <div className="p-8 lg:p-12">
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