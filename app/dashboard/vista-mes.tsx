import type { CitaCalendario } from "@/app/actions/citas";
import { fechaISO } from "@/lib/fechas";

const DIAS_CABECERA = ["L", "M", "X", "J", "V", "S", "D"];
const MAX_PUNTOS = 4;

function colorPunto(cita: CitaCalendario) {
  if (cita.origen_externo) {
    return "bg-neutral-400 dark:bg-neutral-500";
  }
  if (cita.estado === "confirmada") {
    return "bg-primary-500";
  }
  return "bg-amber-400";
}

export function VistaMes({
  anchor,
  citas,
  onSeleccionarDia,
}: {
  anchor: Date;
  citas: CitaCalendario[];
  onSeleccionarDia: (dia: Date) => void;
}) {
  const anio = anchor.getFullYear();
  const mes = anchor.getMonth() + 1;
  const hoyISO = fechaISO(new Date());

  const citasPorFecha = new Map<string, CitaCalendario[]>();
  for (const cita of citas) {
    const lista = citasPorFecha.get(cita.fecha) ?? [];
    lista.push(cita);
    citasPorFecha.set(cita.fecha, lista);
  }

  const diasEnMes = new Date(anio, mes, 0).getDate();
  const columnaInicio = (new Date(anio, mes - 1, 1).getDay() + 6) % 7;

  const celdas: (Date | null)[] = new Array(columnaInicio).fill(null);
  for (let dia = 1; dia <= diasEnMes; dia++) {
    celdas.push(new Date(anio, mes - 1, dia));
  }
  while (celdas.length % 7 !== 0) {
    celdas.push(null);
  }

  const semanas: (Date | null)[][] = [];
  for (let i = 0; i < celdas.length; i += 7) {
    semanas.push(celdas.slice(i, i + 7));
  }

  return (
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

            const fecha = fechaISO(dia);
            const citasDelDia = citasPorFecha.get(fecha) ?? [];
            const esHoy = fecha === hoyISO;

            return (
              <button
                key={fecha}
                type="button"
                disabled={citasDelDia.length === 0}
                onClick={() => onSeleccionarDia(dia)}
                className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border text-sm disabled:cursor-default ${
                  esHoy
                    ? "border-primary-600 font-medium text-primary-700 dark:text-primary-400"
                    : "border-neutral-200 text-neutral-900 dark:border-neutral-800 dark:text-neutral-100"
                }`}
              >
                <span>{dia.getDate()}</span>
                {citasDelDia.length > 0 && (
                  <span className="flex items-center gap-0.5">
                    {citasDelDia.slice(0, MAX_PUNTOS).map((cita) => (
                      <span
                        key={cita.id}
                        className={`h-1.5 w-1.5 rounded-full ${colorPunto(cita)}`}
                      />
                    ))}
                    {citasDelDia.length > MAX_PUNTOS && (
                      <span className="text-[10px] text-neutral-500">
                        +{citasDelDia.length - MAX_PUNTOS}
                      </span>
                    )}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
