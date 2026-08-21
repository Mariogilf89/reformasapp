"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";

export type UserRole = "profesional" | "cliente" | "admin";

export type AuthFormState = {
  error?: string;
} | undefined;

// El rol "admin" nunca se acepta aquí: no hay autorregistro para ese rol,
// se asigna manualmente en base de datos.
function isRoleRegistrable(
  value: FormDataEntryValue | null
): value is "profesional" | "cliente" {
  return value === "profesional" || value === "cliente";
}

// Solo se sigue un "redirect" si es una ruta interna (empieza por "/" y no
// por "//" o "/\", que un navegador podría interpretar como otro host),
// para evitar redirigir a un sitio externo controlado por el parámetro.
function esRutaInternaSegura(ruta: string): boolean {
  return ruta.startsWith("/") && !ruta.startsWith("//") && !ruta.startsWith("/\\");
}

export async function signUp(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const name = formData.get("name")?.toString().trim();
  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();
  const role = formData.get("role");
  const acceptTerms = formData.get("acceptTerms");

  if (!name || !email || !password) {
    return { error: "Rellena todos los campos." };
  }
  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }
  if (!isRoleRegistrable(role)) {
    return { error: "Selecciona un tipo de cuenta válido." };
  }
  if (acceptTerms !== "on") {
    return { error: "Debes aceptar los Términos y la Política de Privacidad." };
  }

  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name, role },
    },
  });

  if (error) {
    return { error: error.message };
  }

  const redirectTo = formData.get("redirect")?.toString();
  const loginUrl =
    redirectTo && esRutaInternaSegura(redirectTo)
      ? `/login?registered=1&redirect=${encodeURIComponent(redirectTo)}`
      : "/login?registered=1";

  redirect(loginUrl);
}

export async function signIn(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    return { error: "Rellena todos los campos." };
  }

  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "Email o contraseña incorrectos." };
  }

  const redirectTo = formData.get("redirect")?.toString();
  redirect(redirectTo && esRutaInternaSegura(redirectTo) ? redirectTo : "/dashboard");
}

export async function signOut() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login");
}
