import { supabase } from "../supabase";
import { AppUser } from "../types";

export const getCurrentAppUser = async (): Promise<AppUser | null> => {
  try {
    // 1. Obtener la sesión actual con reintento automático de Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.warn("No hay sesión activa de usuario.");
      return null;
    }

    const basicUser: AppUser = {
      id: user.id,
      email: user.email || "",
      role: "cliente",
      client_id: null,
    };

    // 2. Traer el perfil. Sin el 'limit(1)' para evitar conflictos de caché
    const { data: profile, error: dbError } = await supabase
      .from("profiles")
      .select("role, client_id")
      .eq("id", user.id)
      .maybeSingle();

    if (dbError) {
      console.error("Error al acceder a la tabla profiles:", dbError.message);
      return basicUser;
    }

    return {
      ...basicUser,
      role: profile?.role?.toLowerCase() || "cliente",
      client_id: profile?.client_id || null,
    };
  } catch (err) {
    console.error("Error crítico en userMapper:", err);
    return null;
  }
};