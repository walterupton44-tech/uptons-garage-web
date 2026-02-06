import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { JSX } from "react";

interface Props {
  children: JSX.Element;
  allowedRoles?: string[];
}

export const ProtectedRoute = ({ children, allowedRoles }: Props) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  // Log de diagnóstico
  console.log("🛡️ ProtectedRoute:", { loading, userRole: currentUser?.role, email: currentUser?.email });

  if (currentUser && loading) {
    return (
      <div className="h-screen w-screen bg-[#0B0F1A] flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-orange-500 mb-4" size={48} />
        <p className="text-slate-500 text-xs font-black uppercase tracking-[0.3em]">Verificando Credenciales...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Normalizamos la comparación de roles a minúsculas
  if (allowedRoles) {
    const userRoleLower = currentUser.role.toLowerCase();
    const allowedLower = allowedRoles.map(r => r.toLowerCase());

    if (!allowedLower.includes(userRoleLower)) {
      console.warn("🚫 Acceso denegado. Rol necesario:", allowedRoles, "Rol actual:", currentUser.role);
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};