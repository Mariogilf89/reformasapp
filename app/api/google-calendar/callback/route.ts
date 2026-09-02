import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase";
import { propioProfesionalId } from "@/app/actions/citas";
import {
  intercambiarCodigoPorTokens,
  crearCalendarioFaenia,
  obtenerEmailCuentaGoogle,
} from "@/lib/google-calendar";
import { guardarConexionGoogleCalendar } from "@/lib/supabase-admin";

const STATE_COOKIE = "google_calendar_oauth_state";
const DESTINO = "/dashboard/perfil/calendario-google";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error"); // el usuario canceló el consentimiento

  const cookieStore = await cookies();
  const stateCookie = cookieStore.get(STATE_COOKIE)?.value;
  cookieStore.delete(STATE_COOKIE);

  const conError = (mensaje: string) =>
    NextResponse.redirect(new URL(`${DESTINO}?error=${encodeURIComponent(mensaje)}`, url.origin));

  if (errorParam) {
    return conError("Has cancelado la conexión con Google Calendar.");
  }
  // El "state" debe coincidir con el guardado en la cookie httpOnly al
  // iniciar el flujo (ver app/api/google-calendar/conectar/route.ts): sin
  // esto, cualquiera podría forzar el canje de un "code" propio contra la
  // sesión de otro usuario simplemente enviándole este enlace de vuelta.
  if (!code || !state || !stateCookie || state !== stateCookie) {
    return conError("No se pudo verificar la solicitud. Inténtalo de nuevo.");
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", url.origin));
  }

  const profesionalId = await propioProfesionalId(supabase, user.id);
  if (!profesionalId) {
    return conError("No autorizado.");
  }

  try {
    const tokens = await intercambiarCodigoPorTokens(code, url.origin);
    if (!tokens.refreshToken) {
      // No debería pasar con access_type=offline&prompt=consent, pero sin
      // refresh_token no se puede mantener la conexión.
      return conError("Google no concedió permiso permanente. Vuelve a intentarlo.");
    }

    const calendarId = await crearCalendarioFaenia(tokens.accessToken);
    const googleEmail = await obtenerEmailCuentaGoogle(tokens.accessToken);

    await guardarConexionGoogleCalendar(profesionalId, {
      refreshToken: tokens.refreshToken,
      accessToken: tokens.accessToken,
      accessTokenExpiraEn: tokens.expiraEn.toISOString(),
      googleCalendarId: calendarId,
      googleEmail,
    });
  } catch (error) {
    console.error("Error al conectar Google Calendar:", error);
    return conError("No se pudo completar la conexión con Google Calendar.");
  }

  return NextResponse.redirect(new URL(`${DESTINO}?conectado=1`, url.origin));
}
