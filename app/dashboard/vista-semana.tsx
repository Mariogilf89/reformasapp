import type { CitaCalendario } from "@/app/actions/citas";
import { TIPOS_CITA } from "@/lib/citas";
import { fechaISO, inicioSemana, sumarDias } from "@/lib/fechas";

const HORA_INICIO = 8;
const HORA_FIN = 20;
const MINUTOS_INICIO = HORA_INICIO * 60;
const MINUTOS_FIN = HORA_FIN * 60;
const ALTURA_HORA_PX = 60;
const ALTURA_GRID_PX = (HORA_FIN - HORA_INICIO) * ALTURA_HORA_PX;

const DIAS_CABECERA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function minutosDesdeHora(hora: string) {
  const [h, m] = hora.slice(0, 5).split(":").map(Number);
  return h * 60 + m;
}

function finEfectivoMinutos(cita: CitaCalendario) {
  return cita.hora_fin ? minutosDesdeHora(cita.hora_fin) : minutosDesdeHora(cita.hora_inicio) + 60;
}

function claseColor(cita: CitaCalendario) {
  if (cita.origen_externo) {
    return "border-neutral-400 bg-neutral-100 text-neutral-700 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300";
  }
  if (cita.estado === "confirmada") {
    return "border-primary-500 bg-primary-100 text-primary-800 dark:border-primary-600 dark:bg-primary-900/40 dark:text-primary-200";
  }
  return "border-amber-400 bg-amber-50 text-amber-800 dark:border-amber-600 dark:bg-amber-900/30 dark:text-amber-200";
}

function tituloCita(cita: CitaCalendario) {
  if (cita.origen_externo) {
    return cita.titulo_externo ?? "Bloqueo";
  }
  return TIPOS_CITA.find((t) => t.value === cita.tipo)?.label ?? "Cita";
}

type BloquePosicionado = CitaCalendario & {
  inicioMin: number;
  finMin: number;
  columna: number;
  totalColumnas: number;
};

/** Agrupa citas solapadas en clusters y les asigna columna (greedy). */
function calcularColumnas(citasDelDia: CitaCalendario[]): BloquePosicionado[] {
  const conMinutos = citasDelDia
    .map((cita) => ({
      ...cita,
      inicioMin: Math.max(MINUTOS_INICIO, minutosDesdeHora(cita.hora_inicio)),
      finMin: Math.min(MINUTOS_FIN, Math.max(finEfectivoMinutos(cita), minutosDesdeHora(cita.hora_inicio) + 1)),
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
  onSeleccionarCita,
}: {
  anchor: Date;
  citas: CitaCalendario[];
  onSeleccionarCita: (id: string) => void;
}) {
  const lunes = inicioSemana(anchor);
  const dias = Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i));
  const hoyISO = fechaISO(new Date());

  const citasPorDia = new Map<string, CitaCalendario[]>();
  for (const cita of citas) {
    const lista = citasPorDia.get(cita.fecha) ?? [];
    lista.push(cita);
    citasPorDia.set(cita.fecha, lista);
  }

  const horas = Array.from({ length: HORA_FIN - HORA_INICIO }, (_, i) => HORA_INICIO + i);

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

        <div className="grid flex-1 grid-cols-7">
          {dias.map((dia) => {
            const fecha = fechaISO(dia);
            const esHoy = fecha === hoyISO;
            const bloques = calcularColumnas(citasPorDia.get(fecha) ?? []);

            return (
              <div key={fecha} className="border-l border-neutral-200 dark:border-neutral-800">
                <div
                  className={`flex h-10 flex-col items-center justify-center border-b border-neutral-200 text-xs font-medium dark:border-neutral-800 ${
                    esHoy
                      ? "text-primary-700 dark:text-primary-400"
                      : "text-neutral-600 dark:text-neutral-400"
                  }`}
                >
                  <span>{DIAS_CABECERA[(dia.getDay() + 6) % 7]}</span>
                  <span>{dia.getDate()}</span>
                </div>

                <div className="relative" style={{ height: `${ALTURA_GRID_PX}px` }}>
                  {horas.map((h) => (
                    <div
                      key={h}
                      className="absolute inset-x-0 border-t border-neutral-100 dark:border-neutral-800/60"
                      style={{ top: `${(h - HORA_INICIO) * ALTURA_HORA_PX}px` }}
                    />
                  ))}

                  {bloques.map((bloque) => {
                    const top = ((bloque.inicioMin - MINUTOS_INICIO) / 60) * ALTURA_HORA_PX;
                    const height = Math.max(
                      18,
                      ((bloque.finMin - bloque.inicioMin) / 60) * ALTURA_HORA_PX
                    );
                    const width = 100 / bloque.totalColumnas;
                    const left = bloque.columna * width;

                    return (
                      <button
                        key={bloque.id}
                        type="button"
                        onClick={() => onSeleccionarCita(bloque.id)}
                        className={`absolute overflow-hidden rounded-md border px-1.5 py-0.5 text-left text-[11px] leading-tight ${claseColor(bloque)}`}
                        style={{
                          top: `${top}px`,
                          height: `${height}px`,
                          left: `${left}%`,
                          width: `calc(${width}% - 2px)`,
                        }}
                      >
                        <span className="block font-medium">{bloque.hora_inicio.slice(0, 5)}</span>
                        <span className="block truncate">{tituloCita(bloque)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
