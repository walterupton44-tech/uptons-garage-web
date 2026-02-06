import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,       // 👈 Evita que el SDK busque sesiones en el navegador
    autoRefreshToken: false,     // 👈 No intenta refrescar tokens inexistentes
    detectSessionInUrl: false,   // 👈 Ignora parámetros de auth en la URL
  }
});