import "server-only";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY!;

function createAdminSupabaseClient() {
  return createClient(supabaseUrl, supabaseSecretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Resuelve el email de un usuario a partir de su user_id usando la
 * service role key. Solo debe llamarse desde server actions, nunca
 * desde código que pueda acabar en el bundle de cliente.
 */
export async function obtenerEmailUsuario(userId: string): Promise<string | null> {
  const supabaseAdmin = createAdminSupabaseClient();
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);

  if (error || !data.user?.email) {
    console.error("No se pudo resolver el email del usuario", userId, error);
    return null;
  }

  return data.user.email;
}
