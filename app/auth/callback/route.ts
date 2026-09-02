import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { esRutaInternaSegura, destinoTrasLogin } from "@/lib/rutas";

/**
 * Vuelta del login OAuth (Google/Facebook vía signInWithOAuth). Supabase
 * redirige aquí con ?code=..., que se canjea por la sesión; "next" y "role"
 * viajan como query params propios desde el origen del login (ver
 * components/oauth-buttons.tsx) y sobreviven el viaje de ida y vuelta al
 * proveedor porque Supabase solo añade su propio "code" a la URL que le
 * pasamos, sin tocar el resto de parámetros.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextParam = url.searchParams.get("next");
  const next = nextParam && esRutaInternaSegura(nextParam) ? nextParam : null;
  const roleParam = url.searchParams.get("role");

  if (!code) {
    return NextResponse.redirect(new URL("/login", url.origin));
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    // No hay forma de saber desde aquí si el proyecto tiene activada la
    // vinculación automática de identidades por email; si Supabase la
    // bloquea, este es el error típico. En cualquier otro caso, mensaje
    // genérico: nunca se crea ni se fusiona nada por código.
    const emailDuplicado = /already regist|already exist|identity/i.test(error.message);
    const mensaje = emailDuplicado
      ? "Ya existe una cuenta con este email. Inicia sesión con tu contraseña."
      : "No se pudo completar el inicio de sesión. Inténtalo de nuevo.";
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(mensaje)}`, url.origin)
    );
  }

  // Primer login de este usuario (por contraseña o por OAuth): todavía no
  // tiene "role" en sus metadatos, así que se fija aquí una única vez. En
  // logins posteriores el role ya existe y no se vuelve a tocar, aunque la
  // URL llevara un "role" distinto.
  let role: string | undefined = data.user?.user_metadata?.role;
  if (data.user && !role) {
    role = roleParam === "profesional" ? "profesional" : "cliente";
    await supabase.auth.updateUser({ data: { role } });
  }

  return NextResponse.redirect(new URL(next ?? destinoTrasLogin(role), url.origin));
}
