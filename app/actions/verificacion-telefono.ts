"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase";
import { enviarCodigoVerificacion } from "@/lib/sms";

export type VerificacionTelefonoFormState = { error?: string } | undefined;

const EXPIRACION_MINUTOS = 10;

function generarCodigo() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

const PREFIJO_ESPANA = "+34";

function digitosValidos(digitos: string) {
  return /^[0-9]{9}$/.test(digitos);
}

export async function solicitarCodigoTelefono(
  _prevState: VerificacionTelefonoFormState,
  formData: FormData
): Promise<VerificacionTelefonoFormState> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado." };
  }

  const digitos = formData.get("telefono_local")?.toString().trim() ?? "";

  if (!digitosValidos(digitos)) {
    return { error: "Indica los 9 dígitos de tu número de teléfono." };
  }

  const telefono = `${PREFIJO_ESPANA}${digitos}`;

  const codigo = generarCodigo();
  const expiraEn = new Date(Date.now() + EXPIRACION_MINUTOS * 60 * 1000).toISOString();

  await supabase.from("codigos_verificacion_telefono").delete().eq("user_id", user.id);

  const { error: insertError } = await supabase
    .from("codigos_verificacion_telefono")
    .insert({ user_id: user.id, codigo, expira_en: expiraEn });

  if (insertError) {
    return { error: insertError.message };
  }

  const { error: metadataError } = await supabase.auth.updateUser({
    data: { telefono, telefono_verificado: false },
  });

  if (metadataError) {
    return { error: metadataError.message };
  }

  try {
    await enviarCodigoVerificacion(telefono, codigo);
  } catch (error) {
    console.error("Error al enviar el SMS de verificación:", error);
    return { error: "No se pudo enviar el SMS. Inténtalo de nuevo." };
  }

  revalidatePath("/dashboard/verificar-telefono");
  return undefined;
}

export async function verificarCodigoTelefono(
  _prevState: VerificacionTelefonoFormState,
  formData: FormData
): Promise<VerificacionTelefonoFormState> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado." };
  }

  const codigo = formData.get("codigo")?.toString().trim();

  if (!codigo) {
    return { error: "Indica el código recibido." };
  }

  const { data: registro } = await supabase
    .from("codigos_verificacion_telefono")
    .select("id, codigo, expira_en")
    .eq("user_id", user.id)
    .maybeSingle<{ id: string; codigo: string; expira_en: string }>();

  if (!registro) {
    return { error: "No hay ningún código pendiente. Solicita uno nuevo." };
  }

  if (new Date(registro.expira_en).getTime() < Date.now()) {
    await supabase.from("codigos_verificacion_telefono").delete().eq("id", registro.id);
    return { error: "El código ha caducado. Solicita uno nuevo." };
  }

  if (registro.codigo !== codigo) {
    return { error: "El código no es correcto." };
  }

  const { error: metadataError } = await supabase.auth.updateUser({
    data: { telefono_verificado: true },
  });

  if (metadataError) {
    return { error: metadataError.message };
  }

  await supabase.from("codigos_verificacion_telefono").delete().eq("id", registro.id);

  revalidatePath("/dashboard/verificar-telefono");
  revalidatePath("/dashboard/citas");
  return undefined;
}
