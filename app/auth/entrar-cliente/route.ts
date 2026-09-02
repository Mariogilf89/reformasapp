import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

/**
 * Vuelta del enlace mágico de un cliente passwordless (ver
 * crearOAccederClientePasswordless/generarTokenAccesoCliente en
 * lib/supabase-admin.ts). A diferencia de app/auth/callback/route.ts (que
 * canjea un "code" de OAuth con exchangeCodeForSession), aquí el token ya
 * lo generamos y controlamos nosotros mismos con generateLink, así que se
 * canjea directamente con verifyOtp — sin depender del endpoint hospedado
 * de Supabase ni de configurar redirect URLs adicionales en su dashboard.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");

  if (!tokenHash) {
    return NextResponse.redirect(
      new URL("/login?error=" + encodeURIComponent("Enlace de acceso inválido."), url.origin)
    );
  }

  // "email" (no "magiclink"): ver la nota en crearSolicitudYContactar —
  // generateLink puede devolver verification_type "signup" o "magiclink"
  // según si la cuenta era nueva o ya existía, y "email" es el tipo que
  // verifyOtp acepta para los dos casos por igual.
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: "email",
  });

  if (error || !data.user) {
    return NextResponse.redirect(
      new URL(
        "/login?error=" + encodeURIComponent("El enlace ha caducado o ya se usó. Pide uno nuevo."),
        url.origin
      )
    );
  }

  // Este enlace es siempre para un cliente volviendo a ver sus solicitudes
  // (nunca lo usa un profesional), así que aterriza directo ahí en vez de
  // en destinoTrasLogin (pensado para el login general).
  return NextResponse.redirect(new URL("/dashboard/solicitudes", url.origin));
}
