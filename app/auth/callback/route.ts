import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { esRutaInternaSegura, destinoTrasLogin } from "@/lib/rutas";
import { propioProfesionalId } from "@/app/actions/citas";
import { debeOfrecerseConectarGoogleCalendar } from "@/lib/supabase-admin";

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
  //
  // Por defecto "profesional", no "cliente": /register siempre manda
  // role=profesional explícito, y los clientes ya no pasan por este flujo
  // en absoluto (se registran con el enlace mágico del formulario de
  // contacto, que fija su role directamente, sin tocar esta ruta). El
  // único caso real que llega aquí sin "role" en la URL es alguien nuevo
  // entrando por Google/Facebook desde /login en vez de /register —hoy
  // eso solo puede ser un profesional despistado, no un cliente.
  let role: string | undefined = data.user?.user_metadata?.role;
  if (data.user && !role) {
    role = roleParam === "cliente" ? "cliente" : "profesional";
    await supabase.auth.updateUser({ data: { role } });
  }

  const destino = next ?? destinoTrasLogin(role);

  // Profesionales: se aprovecha este mismo login para ofrecer conectar
  // Google Calendar, en vez de dejarlo para un paso aparte en ajustes (ver
  // app/api/google-calendar/conectar/route.ts). Solo se dispara si ya
  // existe perfil (un alta recién hecha todavía no tiene fila en
  // "profesionales"; para ese caso el disparo equivalente está en
  // guardarPerfilProfesional, app/actions/profesionales.ts) y si no se le
  // ha ofrecido ya antes.
  if (role === "profesional" && data.user) {
    const profesionalId = await propioProfesionalId(supabase, data.user.id);
    if (profesionalId && (await debeOfrecerseConectarGoogleCalendar(profesionalId))) {
      return NextResponse.redirect(
        new URL(`/api/google-calendar/conectar?next=${encodeURIComponent(destino)}`, url.origin)
      );
    }
  }

  return NextResponse.redirect(new URL(destino, url.origin));
}
