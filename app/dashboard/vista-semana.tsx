import type { PointerEvent as ReactPointerEvent, RefObject } from "react";
import type { CitaCalendario } from "@/app/actions/citas";
import {
  ALTURA_HORA_PX,
  ALTURA_UBICACION_COMPACTA_PX,
  ALTURA_UBICACION_COMPLETA_PX,
  estiloCita,
  finEfectivoMinutos,
  horaDesdeMinutos,
  minutosDesdeHora,
  rangoHoraTexto,
  tituloCita,
  type ArrastreEstado,
  type RedimensionEstado,
} from "@/lib/calendario-geometria";
import { fechaISO, inicioSemana, sumarDias } from "@/lib/fechas";
import { IconUbicacion } from "@/components/ui/icon-ubicacion";

const DIAS_CABECERA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

type CitaConFecha = CitaCalendario & { fecha: string; hora_inicio: string };

type BloquePosicionado = CitaConFecha & {
  inicioMin: number;
  finMin: number;
  columna: number;
  totalColumnas: number;
};

/** Última fecha del bloqueo (fecha_fin si es una cita externa de varios días, si no la propia fecha). */
function fechaFinEfectiva(cita: Pick<CitaCalendario, "fecha" | "fecha_fin" | "origen_externo">) {
  return cita.origen_externo && cita.fecha_fin ? cita.fecha_fin : cita.fecha!;
}

/** Agrupa citas solapadas en clusters y les asigna columna (greedy). */
function calcularColumnas(
  citasDelDia: CitaConFecha[],
  minutosInicio: number,
  minutosFin: number
): BloquePosicionado[] {
  const conMinutos = citasDelDia
    .map((cita) => ({
      ...cita,
      inicioMin: Math.max(minutosInicio, minutosDesdeHora(cita.hora_inicio)),
      finMin: Math.min(
        minutosFin,
        Math.max(
          finEfectivoMinutos(cita.hora_inicio, cita.hora_fin),
          minutosDesdeHora(cita.hora_inicio) + 1
        )
      ),
    }))
    .sort((a, b) => a.inicioMin - b.inicioMin);

  const clusters: (typeof conMinutos)[] = [];
  let actual: typeof conMinutos = [];
  let finClusterMax = -Infinity;

  for (const bloque of conMinutos) {
    if (actual.length > 0 && bloque.inicioMin >= finClusterMax) {
      clusters.push(actual);
      actual = [];
      finClusterMax = -Infinity;
    }
    actual.push(bloque);
    finClusterMax = Math.max(finClusterMax, bloque.finMin);
  }
  if (actual.length > 0) {
    clusters.push(actual);
  }

  return clusters.flatMap((cluster) => {
    const finPorColumna: number[] = [];
    const conColumna = cluster.map((bloque) => {
      let indice = finPorColumna.findIndex((fin) => fin <= bloque.inicioMin);
      if (indice === -1) {
        indice = finPorColumna.length;
        finPorColumna.push(bloque.finMin);
      } else {
        finPorColumna[indice] = bloque.finMin;
      }
      return { ...bloque, columna: indice };
    });
    const totalColumnas = finPorColumna.length;
    return conColumna.map((bloque) => ({ ...bloque, totalColumnas }));
  });
}

export function VistaSemana({
  anchor,
  citas,
  horaInicio,
  horaFin,
  diasVisibles,
  gridRef,
  scrollRef,
  arrastre,
  redimension,
  onPointerDownCita,
  onPointerMoveArrastre,
  onPointerUpArrastre,
  onPointerDownRedimensionar,
  onPointerMoveRedimensionar,
  onPointerUpRedimensionar,
}: {
  anchor: Date;
  citas: CitaCalendario[];
  horaInicio: number;
  horaFin: number;
  /** Offsets desde el lunes (0=lunes ... 6=domingo) de los días a mostrar. */
  diasVisibles: number[];
  gridRef: RefObject<HTMLDivElement | null>;
  /** Contenedor con overflow-x-auto: lo usa el auto-scroll durante el arrastre. */
  scrollRef: RefObject<HTMLDivElement | null>;
  arrastre: ArrastreEstado | null;
  redimension: RedimensionEstado | null;
  onPointerDownCita: (e: ReactPointerEvent<HTMLButtonElement>, cita: CitaCalendario) => void;
  onPointerMoveArrastre: (e: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerUpArrastre: (e: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerDownRedimensionar: (
    e: ReactPointerEvent<HTMLDivElement>,
    cita: CitaCalendario,
    borde: "inicio" | "fin"
  ) => void;
  onPointerMoveRedimensionar: (e: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerUpRedimensionar: (e: ReactPointerEvent<HTMLDivElement>) => void;
}) {
  const minutosInicio = horaInicio * 60;
  const minutosFin = horaFin * 60;
  const alturaGridPx = (horaFin - horaInicio) * ALTURA_HORA_PX;

  const lunes = inicioSemana(anchor);
  const dias = diasVisibles.map((offset) => sumarDias(lunes, offset));
  const numDias = dias.length;
  const hoyISO = fechaISO(new Date());

  // El bloque que se está arrastrando (si es uno ya existente del propio
  // calendario, no desde el panel de pendientes) se mantiene en el mismo
  // nodo del árbol/DOM durante todo el gesto: si se le quitara de aquí para
  // dibujarlo aparte, React lo desmontaría justo cuando setPointerCapture lo
  // está reteniendo, y el navegador cortaría el arrastre en ese instante.
  // Por eso solo se le sobrescribe la posición (ver más abajo), nunca se
  // excluye de esta lista.
  const citasConFecha = citas.filter(
    (c): c is CitaConFecha => c.fecha !== null && c.hora_inicio !== null
  );

  // Una cita externa con fecha_fin ocupa el mismo hueco horario en todos los
  // días visibles del rango [fecha, fecha_fin], no solo en "fecha". El resto
  // de tipos de cita siguen siendo de un solo día en esta tanda.
  const citasPorDia = new Map<string, CitaConFecha[]>();
  for (const cita of citasConFecha) {
    const finRango = fechaFinEfectiva(cita);
    if (finRango <= cita.fecha) {
      const lista = citasPorDia.get(cita.fecha) ?? [];
      lista.push(cita);
      citasPorDia.set(cita.fecha, lista);
      continue;
    }
    for (const dia of dias) {
      const fechaDia = fechaISO(dia);
      if (fechaDia >= cita.fecha && fechaDia <= finRango) {
        const lista = citasPorDia.get(fechaDia) ?? [];
        lista.push(cita);
        citasPorDia.set(fechaDia, lista);
      }
    }
  }

  const horas = Array.from({ length: horaFin - horaInicio }, (_, i) => horaInicio + i);

  // El "fantasma" solo hace falta para un arrastre que viene del panel de
  // pendientes: ahí no hay ningún bloque previo en el calendario que reusar.
  const ghost =
    arrastre?.moved && arrastre.origenPanel
      ? {
          className:
            "border-dashed border-neutral-400 bg-neutral-100 text-neutral-700",
        }
      : null;

  return (
    <div ref={scrollRef} className="flex w-full overflow-x-auto">
      <div className="flex min-w-[720px] flex-1">
        <div className="w-12 shrink-0">
          <div className="h-10" />
          {horas.map((h) => (
            <div
              key={h}
              className="relative text-right text-xs text-neutral-500"
              style={{ height: `${ALTURA_HORA_PX}px` }}
            >
              <span className="absolute -top-2 right-1">{h}:00</span>
            </div>
          ))}
        </div>

        <div className="flex-1">
          <div
            className="grid h-10 border-b border-neutral-200"
            style={{ gridTemplateColumns: `repeat(${numDias}, minmax(0, 1fr))` }}
          >
            {dias.map((dia) => {
              const fecha = fechaISO(dia);
              const esHoy = fecha === hoyISO;
              return (
                <div
                  key={fecha}
                  className={`flex flex-col items-center justify-center border-l border-neutral-200 text-xs font-medium first:border-l-0 ${
                    esHoy
                      ? "text-primary-700"
                      : "text-neutral-600"
                  }`}
                >
                  <span>{DIAS_CABECERA[(dia.getDay() + 6) % 7]}</span>
                  <span>{dia.getDate()}</span>
                </div>
              );
            })}
          </div>

          <div
            ref={gridRef}
            className="relative grid"
            style={{ height: `${alturaGridPx}px`, gridTemplateColumns: `repeat(${numDias}, minmax(0, 1fr))` }}
          >
            {dias.map((dia, i) => (
              <div
                key={i}
                className="border-l border-neutral-200 first:border-l-0"
              />
            ))}

            {horas.map((h) => (
              <div
                key={h}
                className="absolute inset-x-0 border-t border-neutral-100"
                style={{ top: `${(h - horaInicio) * ALTURA_HORA_PX}px` }}
              />
            ))}

            {dias.map((dia, diaIndex) => {
              const fecha = fechaISO(dia);
              const bloques = calcularColumnas(citasPorDia.get(fecha) ?? [], minutosInicio, minutosFin);

              return bloques.map((bloque) => {
                const esArrastrada =
                  arrastre?.moved && !arrastre.origenPanel && arrastre.citaId === bloque.id;

                const esMultiDia = fechaFinEfectiva(bloque) > bloque.fecha;
                const esPrimerDia = fecha === bloque.fecha;
                const esUltimoDia = fecha === fechaFinEfectiva(bloque);

                const esRedimensionada =
                  redimension?.moved &&
                  redimension.citaId === bloque.id &&
                  ((redimension.borde === "inicio" && esPrimerDia) ||
                    (redimension.borde === "fin" && esUltimoDia));

                let top: number;
                let height: number;
                let left: number;
                let width: string;

                if (esArrastrada && arrastre) {
                  top = ((arrastre.inicioMin - minutosInicio) / 60) * ALTURA_HORA_PX;
                  height = Math.max(18, (arrastre.duracionMin / 60) * ALTURA_HORA_PX);
                  left = (arrastre.diaIndex / numDias) * 100;
                  width = `calc(${100 / numDias}% - 2px)`;
                } else if (esRedimensionada && redimension) {
                  const inicioLive = redimension.borde === "inicio" ? redimension.inicioMin : bloque.inicioMin;
                  const finLive = redimension.borde === "fin" ? redimension.finMin : bloque.finMin;
                  top = ((inicioLive - minutosInicio) / 60) * ALTURA_HORA_PX;
                  height = Math.max(18, ((finLive - inicioLive) / 60) * ALTURA_HORA_PX);
                  const anchoColumna = 100 / numDias / bloque.totalColumnas;
                  left = (diaIndex / numDias) * 100 + bloque.columna * anchoColumna;
                  width = `calc(${anchoColumna}% - 2px)`;
                } else {
                  top = ((bloque.inicioMin - minutosInicio) / 60) * ALTURA_HORA_PX;
                  height = Math.max(18, ((bloque.finMin - bloque.inicioMin) / 60) * ALTURA_HORA_PX);
                  const anchoColumna = 100 / numDias / bloque.totalColumnas;
                  left = (diaIndex / numDias) * 100 + bloque.columna * anchoColumna;
                  width = `calc(${anchoColumna}% - 2px)`;
                }

                const estilo = estiloCita(bloque);

                // Tratamiento visual sencillo de continuidad entre días: el
                // lado que conecta con el día anterior/siguiente pierde su
                // esquina redondeada.
                const radioClase = !esMultiDia
                  ? "rounded-md"
                  : [esPrimerDia ? "rounded-l-md" : "", esUltimoDia ? "rounded-r-md" : ""]
                      .filter(Boolean)
                      .join(" ");

                const horaTextoLive =
                  esRedimensionada && redimension
                    ? `${horaDesdeMinutos(redimension.borde === "inicio" ? redimension.inicioMin : bloque.inicioMin)}–${horaDesdeMinutos(redimension.borde === "fin" ? redimension.finMin : bloque.finMin)}`
                    : null;

                return (
                  <button
                    key={`${bloque.id}-${fecha}`}
                    type="button"
                    onPointerDown={(e) => onPointerDownCita(e, bloque)}
                    onPointerMove={onPointerMoveArrastre}
                    onPointerUp={onPointerUpArrastre}
                    className={`absolute cursor-grab overflow-hidden border px-1.5 py-0.5 text-left text-[11px] leading-tight active:cursor-grabbing ${radioClase} ${estilo.className} ${
                      esArrastrada || esRedimensionada ? "shadow-lg ring-2 ring-primary-500" : ""
                    }`}
                    style={{
                      ...estilo.style,
                      top: `${top}px`,
                      height: `${height}px`,
                      left: `${left}%`,
                      width,
                      touchAction: "none",
                      zIndex: esArrastrada || esRedimensionada ? 10 : undefined,
                    }}
                  >
                    <span className="block font-medium">
                      {esArrastrada && arrastre
                        ? `${horaDesdeMinutos(arrastre.inicioMin)}–${horaDesdeMinutos(arrastre.inicioMin + arrastre.duracionMin)}`
                        : (horaTextoLive ?? rangoHoraTexto(bloque.hora_inicio, bloque.hora_fin))}
                    </span>
                    <span className="block truncate">{tituloCita(bloque)}</span>

                    {!esArrastrada && height >= ALTURA_UBICACION_COMPLETA_PX && (
                      <>
                        {bloque.localidad && (
                          <span className="block truncate text-[10px] opacity-80">
                            {bloque.localidad}
                          </span>
                        )}
                        {bloque.calle && (
                          <span className="block truncate text-[10px] opacity-80">{bloque.calle}</span>
                        )}
                      </>
                    )}

                    {!esArrastrada &&
                      height >= ALTURA_UBICACION_COMPACTA_PX &&
                      height < ALTURA_UBICACION_COMPLETA_PX &&
                      (bloque.localidad || bloque.calle) && (
                        <span className="flex items-center gap-0.5 truncate text-[10px] opacity-80">
                          <IconUbicacion className="h-2.5 w-2.5 shrink-0" />
                          <span className="truncate">{bloque.localidad || bloque.calle}</span>
                        </span>
                      )}

                    {/* Asas de redimensionado: separadas del gesto de mover, que sigue
                        colgando del cuerpo del botón. Solo en el día que representa ese
                        extremo del bloqueo (el primero para hora_inicio, el último para
                        hora_fin), para no confundir en un bloque de varios días. */}
                    {esPrimerDia && (
                      <div
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          onPointerDownRedimensionar(e, bloque, "inicio");
                        }}
                        onPointerMove={(e) => {
                          e.stopPropagation();
                          onPointerMoveRedimensionar(e);
                        }}
                        onPointerUp={(e) => {
                          e.stopPropagation();
                          onPointerUpRedimensionar(e);
                        }}
                        className="absolute inset-x-0 top-0 h-1.5 cursor-ns-resize"
                        style={{ touchAction: "none" }}
                      />
                    )}
                    {esUltimoDia && (
                      <div
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          onPointerDownRedimensionar(e, bloque, "fin");
                        }}
                        onPointerMove={(e) => {
                          e.stopPropagation();
                          onPointerMoveRedimensionar(e);
                        }}
                        onPointerUp={(e) => {
                          e.stopPropagation();
                          onPointerUpRedimensionar(e);
                        }}
                        className="absolute inset-x-0 bottom-0 h-1.5 cursor-ns-resize"
                        style={{ touchAction: "none" }}
                      />
                    )}
                  </button>
                );
              });
            })}

            {arrastre?.moved && ghost && (
              <div
                className={`pointer-events-none absolute overflow-hidden rounded-md border px-1.5 py-0.5 text-left text-[11px] leading-tight shadow-lg ring-2 ring-primary-500 ${ghost.className}`}
                style={{
                  top: `${((arrastre.inicioMin - minutosInicio) / 60) * ALTURA_HORA_PX}px`,
                  height: `${Math.max(18, (arrastre.duracionMin / 60) * ALTURA_HORA_PX)}px`,
                  left: `${(arrastre.diaIndex / numDias) * 100}%`,
                  width: `calc(${100 / numDias}% - 2px)`,
                }}
              >
                <span className="block font-medium">
                  {horaDesdeMinutos(arrastre.inicioMin)}–{horaDesdeMinutos(arrastre.inicioMin + arrastre.duracionMin)}
                </span>
                <span className="block truncate">{arrastre.titulo}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
