"use client";

import type { HuecosDia } from "@/app/actions/citas";

const DIAS_CABECERA = ["L", "M", "X", "J", "V", "S", "D"];

function fechaLocal(fecha: string) {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  return new Date(anio, mes - 1, dia);
}

function claveSemana(fecha: string) {
  const fechaObj = fechaLocal(fecha);
  const diasDesdeElLunes = (fechaObj.getDay() + 6) % 7;
  const lunes = new Date(
    fechaObj.getFullYear(),
    fechaObj.getMonth(),
    fechaObj.getDate() - diasDesdeElLunes
  );
  return `${lunes.getFullYear()}-${String(lunes.getMonth() + 1).padStart(2, "0")}-${String(
    lunes.getDate()
  ).padStart(2, "0")}`;
}

function agruparPorSemana(dias: HuecosDia[]): (HuecosDia | null)[][] {
  const semanas = new Map<string, (HuecosDia | null)[]>();
  for (const dia of dias) {
    const columna = (fechaLocal(dia.fecha).getDay() + 6) % 7;
    const clave = claveSemana(dia.fecha);
    if (!semanas.has(clave)) {
      semanas.set(clave, new Array(7).fill(null));
    }
    semanas.get(clave)![columna] = dia;
  }
  return Array.from(semanas.values());
}

export function CalendarioHuecos({
  dias,
  cargando,
  fechaSeleccionada,
  horaSeleccionada,
  onSeleccionarFecha,
  onSeleccionarHora,
}: {
  dias: HuecosDia[];
  cargando: boolean;
  fechaSeleccionada: string;
  horaSeleccionada: string;
  onSeleccionarFecha: (fecha: string) => void;
  onSeleccionarHora: (hora: string) => void;
}) {
  const semanas = agruparPorSemana(dias);
  const horasDelDia = dias.find((dia) => dia.fecha === fechaSeleccionada)?.horas ?? [];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">Fecha</p>
        {cargando ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Consultando disponibilidad...
          </p>
        ) : dias.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Selecciona un profesional para ver su disponibilidad.
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-zinc-500 dark:text-zinc-500">
              {DIAS_CABECERA.map((letra, index) => (
                <div key={index}>{letra}</div>
              ))}
            </div>
            {semanas.map((semana, indexSemana) => (
              <div key={indexSemana} className="grid grid-cols-7 gap-1">
                {semana.map((dia, columna) => {
                  if (!dia) {
                    return <div key={columna} />;
                  }
                  const disponible = dia.horas.length > 0;
                  const seleccionado = dia.fecha === fechaSeleccionada;
                  return (
                    <button
                      key={dia.fecha}
                      type="button"
                      disabled={!disponible}
                      onClick={() => onSeleccionarFecha(dia.fecha)}
                      className={
                        "flex aspect-square items-center justify-center rounded-lg border text-sm disabled:cursor-not-allowed disabled:opacity-40 " +
                        (seleccionado
                          ? "border-foreground bg-foreground text-background"
                          : disponible
                            ? "border-black/15 font-medium dark:border-white/20"
                            : "border-black/10 dark:border-white/10")
                      }
                    >
                      {fechaLocal(dia.fecha).getDate()}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {fechaSeleccionada && (
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">Hora</p>
          {horasDelDia.length === 0 ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              No hay huecos disponibles ese día.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {horasDelDia.map((hora) => (
                <button
                  key={hora}
                  type="button"
                  onClick={() => onSeleccionarHora(hora)}
                  className={
                    "rounded-full border px-3 py-1.5 text-xs font-medium " +
                    (hora === horaSeleccionada
                      ? "border-foreground bg-foreground text-background"
                      : "border-black/15 dark:border-white/20")
                  }
                >
                  {hora}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
