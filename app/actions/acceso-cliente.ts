"use server";

import { generarTokenAccesoCliente } from "@/lib/supabase-admin";
import { enviarEmail, construirCuerpoEnlaceAccesoHtml } from "@/lib/email";
import { obtenerOrigenPeticion } from "@/lib/rutas";

export type ReenviarAccesoState = { error?: string; success?: boolean } | undefined;

/**
 * Reenvía el enlace de acceso a un cliente que ya solicitó un servicio
 * antes (cuenta passwordless, sin contraseña que recuperar) y ha perdido
 * la sesión, p.ej. desde otro dispositivo. Igual que el resto del flujo
 * passwordless, no distingue si el email corresponde a una cuenta
 * existente o no: generateLink crea la cuenta si hiciera falta, con el
 * mismo criterio de "sin fricción" ya acordado para todo este flujo.
 */
export async function reenviarAccesoCliente(
  _prevState: ReenviarAccesoState,
  formData: FormData
): Promise<ReenviarAccesoState> {
  const email = formData.get("email")?.toString().trim();
  if (!email) {
    return { error: "Indica tu email." };
  }

  const tokenHash = await generarTokenAccesoCliente(email);
  if (!tokenHash) {
    return { error: "No se pudo enviar el enlace. Inténtalo de nuevo." };
  }

  const origen = await obtenerOrigenPeticion();
  const enlace = `${origen}/auth/entrar-cliente?token_hash=${encodeURIComponent(tokenHash)}`;

  try {
    await enviarEmail(email, "Accede a tu cuenta de Faenia", construirCuerpoEnlaceAccesoHtml(enlace));
  } catch (error) {
    console.error("No se pudo enviar el email de acceso del cliente:", email, error);
    return { error: "No se pudo enviar el enlace. Inténtalo de nuevo." };
  }

  return { success: true };
}
