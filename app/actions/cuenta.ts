"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase";
import { TIPOS_NOTIFICACION } from "@/lib/notificaciones";

export type CuentaFormState = { error?: string; success?: boolean } | undefined;

export async function cambiarEmail(
  _prevState: CuentaFormState,
  formData: FormData
): Promise<CuentaFormState> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado." };
  }

  const nuevoEmail = formData.get("nuevo_email")?.toString().trim();
  const confirmarEmail = formData.get("confirmar_email")?.toString().trim();

  if (!nuevoEmail || !confirmarEmail) {
    return { error: "Rellena los dos campos." };
  }
  if (nuevoEmail !== confirmarEmail) {
    return { error: "Los correos no coinciden." };
  }
  if (nuevoEmail === user.email) {
    return { error: "Ese ya es tu correo actual." };
  }

  const { error } = await supabase.auth.updateUser({ email: nuevoEmail });
  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function cambiarContrasena(
  _prevState: CuentaFormState,
  formData: FormData
): Promise<CuentaFormState> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { error: "No autorizado." };
  }

  const actual = formData.get("contrasena_actual")?.toString();
  const nueva = formData.get("contrasena_nueva")?.toString();
  const confirmar = formData.get("confirmar_contrasena")?.toString();

  if (!actual || !nueva || !confirmar) {
    return { error: "Rellena todos los campos." };
  }
  if (nueva.length < 8) {
    return { error: "La nueva contraseña debe tener al menos 8 caracteres." };
  }
  if (nueva !== confirmar) {
    return { error: "Las contraseñas nuevas no coinciden." };
  }

  // updateUser no valida la contraseña actual por sí solo: hay que
  // reautenticar primero para confirmar que quien pide el cambio la conoce.
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: actual,
  });
  if (signInError) {
    return { error: "La contraseña actual no es correcta." };
  }

  const { error } = await supabase.auth.updateUser({ password: nueva });
  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function guardarPreferenciasNotificacion(
  _prevState: CuentaFormState,
  formData: FormData
): Promise<CuentaFormState> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado." };
  }

  const preferencias = Object.fromEntries(
    TIPOS_NOTIFICACION.map((tipo) => [`notif_${tipo}`, formData.get(`notif_${tipo}`) === "on"])
  );

  const { error } = await supabase.auth.updateUser({ data: preferencias });
  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/perfil/notificaciones");
  return { success: true };
}
