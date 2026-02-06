import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../supabase";
import { AppUser } from "../types";
import { getCurrentAppUser } from "../utils/userMapper";

interface AuthContextType {
  currentUser: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      // No ponemos setLoading(true) aquí para evitar parpadeos infinitos
      const appUser = await getCurrentAppUser();
      setCurrentUser(appUser);
    } catch (err) {
      console.error("Error en AuthContext fetchUser:", err);
      setCurrentUser(null);
    } finally {
      // ESTA LÍNEA ES LA QUE QUITA EL SPINNER
      setLoading(false); 
    }
  };

useEffect(() => {
  let isMounted = true;

  // 1. Definimos una función para manejar la carga del usuario
  const updateUserData = async (session: any) => {
    if (!session) {
      if (isMounted) {
        setCurrentUser(null);
        setLoading(false);
      }
      return;
    }

    try {
      const appUser = await getCurrentAppUser();
      if (isMounted) setCurrentUser(appUser);
    } catch (err) {
      console.error("Error cargando usuario:", err);
    } finally {
      if (isMounted) setLoading(false);
    }
  };

  // 2. Ejecución inicial inmediata para obtener la sesión actual
  // Esto ayuda a que no dependamos solo del evento de cambio
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (isMounted) updateUserData(session);
  });

  // 3. Escuchar cambios de estado
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
    updateUserData(session);
  });

  // 4. Timeout de emergencia (opcional, podrías subirlo a 6-8 segundos)
  const timer = setTimeout(() => {
    if (isMounted && loading) {
      console.warn("⚠️ Timeout: La sesión de Supabase tardó demasiado en responder.");
      setLoading(false);
    }
  }, 6000); 

  // Limpieza
  return () => {
    isMounted = false;
    subscription.unsubscribe();
    clearTimeout(timer);
  };
}, []); // Quitamos 'loading' de las dependencias si estuviera, para evitar bucles

  // ... resto de login/logout igual ...
  const login = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // El onAuthStateChange se encargará de disparar fetchUser
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
    } finally {
      setCurrentUser(null);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);