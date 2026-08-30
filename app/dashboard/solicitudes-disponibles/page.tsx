import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import { CATEGORIAS, isCategoria, type Categoria } from "@/lib/profesionales";
import { isProvincia } from "@/lib/provincias";
import { obtenerHuecosDisponibles } from "@/app/actions/citas";
import { fechaISO, sumarDias } from "@/lib/fechas";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FiltrosSolicitudesDisponibles } from "./filtros-form";

type SolicitudDisponible = {
  id: string;
  categoria: Categoria;
  zona: string;
  descripcion: string;
  provincia: string | null;
  modo_tiempo: "lo_antes_posible" | "indiferente" | "dia_hora" | null;
  creado_en: string;
};

const DIAS_VENTANA_ENCAJE = 14;

/**
 * ¿Tiene el profesional algún hueco libre en los próximos
 * DIAS_VENTANA_ENCAJE días? Reutiliza obtenerHuecosDisponibles (la misma
 * fuente de verdad que usa la búsqueda de /profesionales) mes a mes, porque
 * esa función siempre devuelve un mes calendario completo.
 */
async function tieneHuecosProximos(profesionalId: string): Promise<boolean> {
  const hoy = new Date();
  const limite = sumarDias(hoy, DIAS_VENTANA_ENCAJE);
  const hoyISO = fechaISO(hoy);
  const limiteISO = fechaISO(limite);

  const meses = new Set([
    `${hoy.getFullYear()}-${hoy.getMonth() + 1}`,
    `${limite.getFullYear()}-${limite.getMonth() + 1}`,
  ]);

  for (const clave of meses) {
    const [anio, mes] = clave.split("-").map(Number);
    const dias = await obtenerHuecosDisponibles(profesionalId, anio, mes);
    const hayHueco = dias.some(
      (dia) => dia.fecha >= hoyISO && dia.fecha <= limiteISO && dia.horas.length > 0
    );
    if (hayHueco) return true;
  }

  return false;
}

/**
 * "Mejor encaje con tu disponibilidad": las solicitudes no llevan una fecha
 * concreta (solo modo_tiempo), así que el encaje real solo se puede juzgar
 * por si el profesional tiene hueco pronto y cuánta prisa tiene el cliente.
 * Si no hay huecos próximos no hay nada que priorizar y se deja el orden
 * por fecha de creación.
 */
function prioridadModoTiempo(modo: SolicitudDisponible["modo_tiempo"]) {
  if (modo === "lo_antes_posible") return 0;
  if (modo === "dia_hora") return 1;
  if (modo === "indiferente") return 2;
  return 3;
}

export default async function SolicitudesDisponiblesPage(
  props: PageProps<"/dashboard/solicitudes-disponibles">
) {
  const searchParams = await props.searchParams;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (user.user_metadata?.role !== "profesional") {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-16 text-center">
        <p className="text-neutral-600">
          Esta página es solo para cuentas de tipo profesional.
        </p>
      </div>
    );
  }

  const { data: profesional } = await supabase
    .from("profesionales")
    .select("id, categorias")
    .eq("user_id", user.id)
    .maybeSingle<{ id: string; categorias: Categoria[] }>();

  const categoriaParam = typeof searchParams.categoria === "string" ? searchParams.categoria : "";
  const categoria = categoriaParam && isCategoria(categoriaParam) ? categoriaParam : "";

  const provinciaParam = typeof searchParams.provincia === "string" ? searchParams.provincia : "";
  const provincia = provinciaParam && isProvincia(provinciaParam) ? provinciaParam : "";

  const modoParam = typeof searchParams.modo === "string" ? searchParams.modo : "";
  const modo =
    modoParam === "lo_antes_posible" || modoParam === "indiferente" || modoParam === "dia_hora"
      ? modoParam
      : "";

  const ordenParam = typeof searchParams.orden === "string" ? searchParams.orden : "recientes";
  const orden = ordenParam === "encaje" ? "encaje" : "recientes";

  // Ver la nota en filtros-form.tsx: "f" marca que el formulario ya se ha
  // enviado, para distinguir "checkbox desmarcado" de "primera visita".
  const formularioEnviado = searchParams.f === "1";
  const ocultarContactadas = formularioEnviado
    ? searchParams.ocultar_contactadas === "1"
    : true;

  // No se busca nada hasta que el profesional pulse "Filtrar" al menos una
  // vez (formularioEnviado): la primera visita a la página no debe mostrar
  // todas las solicitudes por defecto.
  let solicitudes: SolicitudDisponible[] = [];
  const contactadas = new Set<string>();

  if (formularioEnviado) {
    // RLS ya limita el resultado a solicitudes abiertas que coinciden con
    // alguna de las categorías del perfil del profesional autenticado.
    let query = supabase
      .from("solicitudes")
      .select("id, categoria, zona, descripcion, provincia, modo_tiempo, creado_en")
      .eq("estado", "abierta");

    if (categoria) query = query.eq("categoria", categoria);
    if (provincia) query = query.eq("provincia", provincia);
    if (modo) query = query.eq("modo_tiempo", modo);

    const { data } = await query
      .order("creado_en", { ascending: false })
      .returns<SolicitudDisponible[]>();

    solicitudes = data ?? [];

    // Solicitudes que este profesional ya ha contactado: al menos un mensaje
    // propio (remitente_id = yo) en esa solicitud.
    const solicitudIds = solicitudes.map((s) => s.id);
    const { data: mensajesPropios } = solicitudIds.length
      ? await supabase
          .from("mensajes")
          .select("solicitud_id")
          .eq("remitente_id", user.id)
          .in("solicitud_id", solicitudIds)
          .returns<{ solicitud_id: string }[]>()
      : { data: [] as { solicitud_id: string }[] };

    (mensajesPropios ?? []).forEach((m) => contactadas.add(m.solicitud_id));

    if (ocultarContactadas) {
      solicitudes = solicitudes.filter((s) => !contactadas.has(s.id));
    }

    if (orden === "encaje" && profesional) {
      const huecosProximos = await tieneHuecosProximos(profesional.id);
      if (huecosProximos) {
        solicitudes = [...solicitudes].sort((a, b) => {
          const diff = prioridadModoTiempo(a.modo_tiempo) - prioridadModoTiempo(b.modo_tiempo);
          if (diff !== 0) return diff;
          return b.creado_en.localeCompare(a.creado_en);
        });
      }
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center gap-6 px-4 py-16">
      <div className="w-full max-w-lg">
        <h1 className="text-2xl font-semibold text-neutral-900">
          Solicitudes disponibles
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Solicitudes abiertas que coinciden con tus categorías.
        </p>
      </div>

      <FiltrosSolicitudesDisponibles
        categoriasProfesional={profesional?.categorias ?? []}
        categoriaInicial={categoria}
        provinciaInicial={provincia}
        modoInicial={modo}
        ordenInicial={orden}
        ocultarContactadasInicial={ocultarContactadas}
      />

      <div className="w-full max-w-lg flex flex-col gap-4">
        {!formularioEnviado && (
          <p className="text-neutral-600">
            Usa los filtros para buscar solicitudes.
          </p>
        )}

        {formularioEnviado && solicitudes.length === 0 && (
          <p className="text-neutral-600">
            No hay solicitudes disponibles con estos filtros por ahora.
          </p>
        )}

        {solicitudes.map((solicitud) => (
          <Link key={solicitud.id} href={`/dashboard/solicitudes/${solicitud.id}`}>
            <Card className="flex flex-col gap-2 p-6 transition-colors hover:border-primary-300">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium text-neutral-900">
                  {CATEGORIAS.find((c) => c.value === solicitud.categoria)?.label ??
                    solicitud.categoria}
                  {" · "}
                  {solicitud.zona}
                </p>
                {contactadas.has(solicitud.id) && <Badge status="cerrada">Ya contactada</Badge>}
              </div>
              <p className="text-sm text-neutral-600">
                {solicitud.descripcion}
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
