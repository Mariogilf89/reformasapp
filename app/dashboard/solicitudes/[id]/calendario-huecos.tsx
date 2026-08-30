"use client";

import type { HuecosDia } from "@/app/actions/citas";

const DIAS_CABECERA = ["L", "M", "X", "J", "V", "S", "D"];
const NOMBRES_MES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

function fechaLocal(fecha: string) {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  return new Date(anio, mes - 1, dia);
}

function inicioDeHoy() {
  const hoy = new Date();
  return new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
}

export function CalendarioHuecos({
  dias,
  cargando,
  anio,
  mes,
  fechaSeleccionada,
  horaSeleccionada,
  onSeleccionarFecha,
  onSeleccionarHora,
  onMesAnterior,
  onMesSiguiente,
}: {
  dias: HuecosDia[];
  cargando: boolean;
  anio: number;
  mes: number;
  fechaSeleccionada: string;
  horaSeleccionada: string;
  onSeleccionarFecha: (fecha: string) => void;
  onSeleccionarHora: (hora: string) => void;
  onMesAnterior: () => void;
  onMesSiguiente: () => void;
}) {
  const hoy = inicioDeHoy();
  const diasPorFecha = new Map(dias.map((dia) => [dia.fecha, dia]));
  const diasEnMes = new Date(anio, mes, 0).getDate();
  const columnaInicio = (new Date(anio, mes - 1, 1).getDay() + 6) % 7;

  const celdas: (HuecosDia | null)[] = new Array(columnaInicio).fill(null);
  for (let dia = 1; dia <= diasEnMes; dia++) {
    const fecha = `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
    celdas.push(diasPorFecha.get(fecha) ?? { fecha, horas: [] });
  }
  while (celdas.length % 7 !== 0) {
    celdas.push(null);
  }

  const semanas: (HuecosDia | null)[][] = [];
  for (let i = 0; i < celdas.length; i += 7) {
    semanas.push(celdas.slice(i, i + 7));
  }

  const noSePuedeRetroceder = anio * 12 + mes <= hoy.getFullYear() * 12 + (hoy.getMonth() + 1);
  const horasDelDia = dias.find((dia) => dia.fecha === fechaSeleccionada)?.horas ?? [];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onMesAnterior}
            disabled={noSePuedeRetroceder}
            className="rounded-full px-2 py-1 text-sm font-medium text-neutral-700 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Mes anterior"
          >
            ←
          </button>
          <p className="text-sm font-medium capitalize text-neutral-900">
            {NOMBRES_MES[mes - 1]} {anio}
          </p>
          <button
            type="button"
            onClick={onMesSiguiente}
            className="rounded-full px-2 py-1 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
            aria-label="Mes siguiente"
          >
            →
          </button>
        </div>

        {cargando ? (
          <p className="text-sm text-neutral-600">
            Consultando disponibilidad...
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-neutral-500">
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
                  const esPasado = fechaLocal(dia.fecha) < hoy;
                  const disponible = dia.horas.length > 0 && !esPasado;
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
                          ? "border-primary-600 bg-primary-600 text-white"
                          : disponible
                            ? "border-neutral-300 font-medium text-neutral-900"
                            : "border-neutral-200")
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
          <p className="text-sm font-medium text-neutral-900">Hora</p>
          {horasDelDia.length === 0 ? (
            <p className="text-sm text-neutral-600">
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
                      ? "border-primary-600 bg-primary-600 text-white"
                      : "border-neutral-300 text-neutral-700")
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
