// src/utils/signUpAndBootstrap.ts
import { supabase } from '../supabase';
import { UserRole } from '../types';

export const signUpAndBootstrap = async (
  email: string,
  password: string,
  name: string,
  phone?: string,
  address?: string
): Promise<{ success: boolean; error?: string }> => {
  // 1. Crear usuario en Supabase Auth
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError || !signUpData?.user) {
    return { success: false, error: signUpError?.message || 'Error al registrar usuario' };
  }

  const userId = signUpData.user.id;

  // 2. Crear cliente en tabla clients
  const { data: clientData, error: clientError } = await supabase
    .from('clients')
    .insert([
      {
        name,
        email,
        phone,
        address,
        auth_user_id: userId,
      },
    ])
    .select()
    .single();

  if (clientError || !clientData) {
    return { success: false, error: clientError?.message || 'Error al crear cliente' };
  }

  // 3. Crear perfil en tabla profiles
  const { error: profileError } = await supabase
    .from('profiles')
    .insert([
      {
        id: userId,
        role: UserRole.CLIENT,
        client_id: clientData.id,
      },
    ]);

  if (profileError) {
    return { success: false, error: profileError.message || 'Error al crear perfil' };
  }

  return { success: true };
};
