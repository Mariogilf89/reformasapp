import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase";
import { propioProfesionalId } from "@/app/actions/citas";
import { construirUrlAutorizacionGoogle } from "@/lib/google-calendar";
import { marcarCalendarioGoogleOfrecido } from "@/lib/supabase-admin";
import { esRutaInternaSegura } from "@/lib/rutas";

const STATE_COOKIE = "google_calendar_oauth_state";
const NEXT_COOKIE = "google_calendar_oauth_next";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", url.origin));
  }

  const profesionalId = await propioProfesionalId(supabase, user.id);
  if (!profesionalId) {
    return NextResponse.redirect(new URL("/dashboard/perfil/calendario-google", url.origin));
  }

  const nextParam = url.searchParams.get("next");
  const cookieStore = await cookies();

  // Presente cuando este flujo se auto-dispara justo tras el login o tras
  // crear el perfil por primera vez (ver app/auth/callback/route.ts y
  // app/actions/profesionales.ts): permite que el callback vuelva al
  // destino original en vez de aterrizar siempre en los ajustes de
  // Calendar, que es lo que corresponde cuando se pulsa "Conectar" a mano.
  if (nextParam && esRutaInternaSegura(nextParam)) {
    cookieStore.set(NEXT_COOKIE, nextParam, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });
  }

  // Se marca aquí, no en el callback: lo que importa es que ya se le ha
  // enseñado la pantalla de consentimiento, sin importar si la completa o
  // la cancela — así el auto-conectar del login/primer perfil no vuelve a
  // insistir en el futuro.
  await marcarCalendarioGoogleOfrecido(profesionalId);

  const state = crypto.randomUUID();
  cookieStore.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return NextResponse.redirect(construirUrlAutorizacionGoogle(state, url.origin));
}
