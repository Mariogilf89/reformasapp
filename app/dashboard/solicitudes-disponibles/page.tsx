import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import { CATEGORIAS, isCategoria, type Categoria } from "@/lib/profesionales";
import { PROVINCIAS, isProvincia } from "@/lib/provincias";
import { obtenerHuecosDisponibles } from "@/app/actions/citas";
import { fechaISO, sumarDias } from "@/lib/fechas";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IconCampana } from "@/components/ui/icon-campana";
import { IconUbicacion } from "@/components/ui/icon-ubicacion";
import { FiltrosSolicitudesDisponibles } from "./filtros-form";
import { GuardarAlertaBoton } from "./guardar-alerta-boton";

type SolicitudDisponible = {
  id: string;
  categoria: Categoria;
  zona: string;
  descripcion: string;
  provincia: string | null;
  modo_tiempo: "lo_antes_posible" | "indiferente" | "dia_hora" | null;
  creado_en: string;
};

const ETIQUETAS_MODO_TIEMPO: Record<string, string> = {
  lo_antes_posible: "Lo antes posible",
  dia_hora: "Fecha y hora concreta",
  indiferente: "Disponibilidad total",
};

function formatearFechaCorta(fecha: string) {
  return new Date(fecha).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

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
    .select("id, categorias, provincias")
    .eq("user_id", user.id)
    .maybeSingle<{ id: string; categorias: Categoria[]; provincias: string[] }>();

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

  let solicitudes: SolicitudDisponible[] = [];
  const contactadas = new Set<string>();

  // RLS ya limita el resultado a solicitudes abiertas que coinciden con
  // alguna de las categorías del perfil del profesional autenticado, así
  // que la búsqueda se ejecuta siempre (incluida la primera visita, para
  // cumplir el "que coinciden con tus categorías" del subtítulo desde el
  // primer render). En la primera visita, antes de que el profesional
  // pulse "Filtrar" y mande su propio criterio de provincia, se acota
  // además a sus provincias de cobertura (RLS no cubre eso); en cuanto hay
  // un filtro explícito de provincia, manda ese.
  let query = supabase
    .from("solicitudes")
    .select("id, categoria, zona, descripcion, provincia, modo_tiempo, creado_en")
    .eq("estado", "abierta");

  if (categoria) query = query.eq("categoria", categoria);
  if (modo) query = query.eq("modo_tiempo", modo);

  if (formularioEnviado) {
    if (provincia) query = query.eq("provincia", provincia);
  } else if (profesional?.provincias?.length) {
    query = query.in("provincia", profesional.provincias);
  }

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
        {solicitudes.length === 0 && (
          <Card className="flex flex-col items-center gap-3 p-10 text-center">
            <IconCampana className="h-9 w-9 text-neutral-300" />
            <div>
              <p className="font-medium text-neutral-900">
                No hay solicitudes que coincidan ahora mismo
              </p>
              <p className="mt-1 text-sm text-neutral-600">
                Guarda esta búsqueda y te avisamos por email en cuanto entre una que encaje.
              </p>
            </div>
            <GuardarAlertaBoton categoria={categoria} provincia={provincia} modo={modo} />
          </Card>
        )}

        {solicitudes.map((solicitud) => (
          <Link key={solicitud.id} href={`/dashboard/solicitudes/${solicitud.id}`}>
            <Card className="flex flex-col gap-3 p-6 transition-colors hover:border-primary-300">
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold text-neutral-900">
                  {CATEGORIAS.find((c) => c.value === solicitud.categoria)?.label ??
                    solicitud.categoria}
                </p>
                {contactadas.has(solicitud.id) && <Badge status="cerrada">Ya contactada</Badge>}
              </div>

              <p className="flex items-center gap-1.5 text-sm text-neutral-600">
                <IconUbicacion className="h-4 w-4 shrink-0 text-neutral-400" />
                {solicitud.zona}
                {solicitud.provincia && (
                  <>
                    {" · "}
                    {PROVINCIAS.find((p) => p.value === solicitud.provincia)?.label ??
                      solicitud.provincia}
                  </>
                )}
              </p>

              <p className="text-sm text-neutral-600">{solicitud.descripcion}</p>

              <div className="flex items-center justify-between gap-3 border-t border-neutral-100 pt-3 text-xs text-neutral-500">
                <span>
                  {solicitud.modo_tiempo
                    ? ETIQUETAS_MODO_TIEMPO[solicitud.modo_tiempo]
                    : "Cualquier momento"}
                </span>
                <span>{formatearFechaCorta(solicitud.creado_en)}</span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
