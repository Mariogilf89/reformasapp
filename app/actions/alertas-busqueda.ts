"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase";
import { CATEGORIAS, isCategoria, type Categoria } from "@/lib/profesionales";
import { isProvincia } from "@/lib/provincias";
import { obtenerEmailUsuario, buscarAlertasBusquedaCoincidentes } from "@/lib/supabase-admin";
import { enviarEmail } from "@/lib/email";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

function esModoTiempoValido(value: string): value is "lo_antes_posible" | "indiferente" | "dia_hora" {
  return value === "lo_antes_posible" || value === "indiferente" || value === "dia_hora";
}

function escapeHtml(texto: string) {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function propioProfesionalId(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>, userId: string) {
  const { data } = await supabase
    .from("profesionales")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle<{ id: string }>();
  return data?.id ?? null;
}

export type AlertaBusquedaFormState = { error?: string } | undefined;

/**
 * Guarda la búsqueda actual (categoría/provincia/modo de tiempo de los
 * filtros de solicitudes disponibles) como alerta. Se llama desde el botón
 * "Guardar esta búsqueda y avisarme" vía formAction, dentro del mismo
 * &lt;form method="get"&gt; que filtra la lista.
 */
export async function guardarAlertaBusqueda(formData: FormData): Promise<AlertaBusquedaFormState> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== "profesional") {
    return { error: "No autorizado." };
  }

  const profesionalId = await propioProfesionalId(supabase, user.id);
  if (!profesionalId) {
    return { error: "No autorizado." };
  }

  const categoriaRaw = formData.get("categoria")?.toString() || null;
  const provinciaRaw = formData.get("provincia")?.toString() || null;
  const modoRaw = formData.get("modo")?.toString() || null;

  const categoria = categoriaRaw && isCategoria(categoriaRaw) ? categoriaRaw : null;
  const provincia = provinciaRaw && isProvincia(provinciaRaw) ? provinciaRaw : null;
  const modo_tiempo = modoRaw && esModoTiempoValido(modoRaw) ? modoRaw : null;

  const { error } = await supabase.from("alertas_busqueda_trabajos").insert({
    profesional_id: profesionalId,
    categoria,
    provincia,
    modo_tiempo,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/alertas-busqueda");
  return undefined;
}

/**
 * Borra una alerta propia. La RLS ("alertas_busqueda_trabajos_delete_own")
 * ya restringe el borrado al profesional dueño.
 */
export async function borrarAlertaBusqueda(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const id = formData.get("id")?.toString();
  if (!id) {
    return;
  }

  await supabase.from("alertas_busqueda_trabajos").delete().eq("id", id);
  revalidatePath("/dashboard/alertas-busqueda");
}

function construirCuerpoAlertaHtml(categoria: Categoria, zona: string) {
  const etiquetaCategoria = CATEGORIAS.find((c) => c.value === categoria)?.label ?? categoria;

  return `
    <div style="font-family: sans-serif; line-height: 1.5; color: #1a1a1a;">
      <h2>Nueva solicitud que podría interesarte</h2>
      <p>Ha entrado una solicitud de <strong>${escapeHtml(etiquetaCategoria)}</strong> en ${escapeHtml(zona)} que coincide con una de tus búsquedas guardadas.</p>
      <p><a href="${BASE_URL}/dashboard/solicitudes-disponibles">Ver solicitudes disponibles</a></p>
    </div>
  `;
}

/**
 * Comprueba las alertas guardadas que encajan con una solicitud recién
 * creada (campos NULL en la alerta = cualquiera) y avisa por email a cada
 * profesional. Best-effort: nunca deja que un fallo aquí haga fallar la
 * creación de la solicitud, igual que notificarCambioCita en citas.ts.
 */
export async function notificarAlertasBusquedaTrabajos(solicitud: {
  categoria: Categoria;
  zona: string;
  provincia: string | null;
  modoTiempo: string | null;
}) {
  try {
    const coincidencias = await buscarAlertasBusquedaCoincidentes({
      categoria: solicitud.categoria,
      provincia: solicitud.provincia,
      modoTiempo: solicitud.modoTiempo,
    });

    const cuerpo = construirCuerpoAlertaHtml(solicitud.categoria, solicitud.zona);

    for (const { userId } of coincidencias) {
      const email = await obtenerEmailUsuario(userId);
      if (!email) {
        console.error("No se pudo enviar la alerta de búsqueda: profesional sin email resoluble.");
        continue;
      }
      try {
        await enviarEmail(email, "Nueva solicitud que podría interesarte", cuerpo);
      } catch (error) {
        console.error("Error al enviar el email de alerta de búsqueda de trabajos:", error);
      }
    }
  } catch (error) {
    console.error("Error al comprobar alertas de búsqueda de trabajos:", error);
  }
}
