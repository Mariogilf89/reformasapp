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
  gridRef,
  arrastre,
  onPointerDownCita,
  onPointerMoveArrastre,
  onPointerUpArrastre,
}: {
  anchor: Date;
  citas: CitaCalendario[];
  horaInicio: number;
  horaFin: number;
  gridRef: RefObject<HTMLDivElement | null>;
  arrastre: ArrastreEstado | null;
  onPointerDownCita: (e: ReactPointerEvent<HTMLButtonElement>, cita: CitaCalendario) => void;
  onPointerMoveArrastre: (e: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerUpArrastre: (e: ReactPointerEvent<HTMLButtonElement>) => void;
}) {
  const minutosInicio = horaInicio * 60;
  const minutosFin = horaFin * 60;
  const alturaGridPx = (horaFin - horaInicio) * ALTURA_HORA_PX;

  const lunes = inicioSemana(anchor);
  const dias = Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i));
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

  const citasPorDia = new Map<string, CitaConFecha[]>();
  for (const cita of citasConFecha) {
    const lista = citasPorDia.get(cita.fecha) ?? [];
    lista.push(cita);
    citasPorDia.set(cita.fecha, lista);
  }

  const horas = Array.from({ length: horaFin - horaInicio }, (_, i) => horaInicio + i);

  // El "fantasma" solo hace falta para un arrastre que viene del panel de
  // pendientes: ahí no hay ningún bloque previo en el calendario que reusar.
  const ghost =
    arrastre?.moved && arrastre.origenPanel
      ? {
          className:
            "border-dashed border-neutral-400 bg-neutral-100 text-neutral-700 dark:border-neutral-500 dark:bg-neutral-800 dark:text-neutral-300",
        }
      : null;

  return (
    <div className="flex w-full overflow-x-auto">
      <div className="flex min-w-[720px] flex-1">
        <div className="w-12 shrink-0">
          <div className="h-10" />
          {horas.map((h) => (
            <div
              key={h}
              className="relative text-right text-xs text-neutral-500 dark:text-neutral-500"
              style={{ height: `${ALTURA_HORA_PX}px` }}
            >
              <span className="absolute -top-2 right-1">{h}:00</span>
            </div>
          ))}
        </div>

        <div className="flex-1">
          <div className="grid h-10 grid-cols-7 border-b border-neutral-200 dark:border-neutral-800">
            {dias.map((dia) => {
              const fecha = fechaISO(dia);
              const esHoy = fecha === hoyISO;
              return (
                <div
                  key={fecha}
                  className={`flex flex-col items-center justify-center border-l border-neutral-200 text-xs font-medium first:border-l-0 dark:border-neutral-800 ${
                    esHoy
                      ? "text-primary-700 dark:text-primary-400"
                      : "text-neutral-600 dark:text-neutral-400"
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
            className="relative grid grid-cols-7"
            style={{ height: `${alturaGridPx}px` }}
          >
            {dias.map((dia, i) => (
              <div
                key={i}
                className="border-l border-neutral-200 first:border-l-0 dark:border-neutral-800"
              />
            ))}

            {horas.map((h) => (
              <div
                key={h}
                className="absolute inset-x-0 border-t border-neutral-100 dark:border-neutral-800/60"
                style={{ top: `${(h - horaInicio) * ALTURA_HORA_PX}px` }}
              />
            ))}

            {dias.map((dia) => {
              const fecha = fechaISO(dia);
              const diaIndex = (dia.getDay() + 6) % 7;
              const bloques = calcularColumnas(citasPorDia.get(fecha) ?? [], minutosInicio, minutosFin);

              return bloques.map((bloque) => {
                const esArrastrada =
                  arrastre?.moved && !arrastre.origenPanel && arrastre.citaId === bloque.id;

                let top: number;
                let height: number;
                let left: number;
                let width: string;

                if (esArrastrada && arrastre) {
                  top = ((arrastre.inicioMin - minutosInicio) / 60) * ALTURA_HORA_PX;
                  height = Math.max(18, (arrastre.duracionMin / 60) * ALTURA_HORA_PX);
                  left = (arrastre.diaIndex / 7) * 100;
                  width = `calc(${100 / 7}% - 2px)`;
                } else {
                  top = ((bloque.inicioMin - minutosInicio) / 60) * ALTURA_HORA_PX;
                  height = Math.max(18, ((bloque.finMin - bloque.inicioMin) / 60) * ALTURA_HORA_PX);
                  const anchoColumna = 100 / 7 / bloque.totalColumnas;
                  left = (diaIndex / 7) * 100 + bloque.columna * anchoColumna;
                  width = `calc(${anchoColumna}% - 2px)`;
                }

                const estilo = estiloCita(bloque);

                return (
                  <button
                    key={bloque.id}
                    type="button"
                    onPointerDown={(e) => onPointerDownCita(e, bloque)}
                    onPointerMove={onPointerMoveArrastre}
                    onPointerUp={onPointerUpArrastre}
                    className={`absolute cursor-grab overflow-hidden rounded-md border px-1.5 py-0.5 text-left text-[11px] leading-tight active:cursor-grabbing ${estilo.className} ${
                      esArrastrada ? "shadow-lg ring-2 ring-primary-500" : ""
                    }`}
                    style={{
                      ...estilo.style,
                      top: `${top}px`,
                      height: `${height}px`,
                      left: `${left}%`,
                      width,
                      touchAction: "none",
                      zIndex: esArrastrada ? 10 : undefined,
                    }}
                  >
                    <span className="block font-medium">
                      {esArrastrada && arrastre
                        ? `${horaDesdeMinutos(arrastre.inicioMin)}–${horaDesdeMinutos(arrastre.inicioMin + arrastre.duracionMin)}`
                        : rangoHoraTexto(bloque.hora_inicio, bloque.hora_fin)}
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
                  left: `${(arrastre.diaIndex / 7) * 100}%`,
                  width: `calc(${100 / 7}% - 2px)`,
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
