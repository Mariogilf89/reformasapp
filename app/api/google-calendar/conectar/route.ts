import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase";
import { propioProfesionalId } from "@/app/actions/citas";
import { construirUrlAutorizacionGoogle } from "@/lib/google-calendar";

const STATE_COOKIE = "google_calendar_oauth_state";

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

  const state = crypto.randomUUID();
  const cookieStore = await cookies();
  cookieStore.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return NextResponse.redirect(construirUrlAutorizacionGoogle(state, url.origin));
}
