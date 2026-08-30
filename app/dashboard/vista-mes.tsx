import type { CitaCalendario } from "@/app/actions/citas";
import { fechaISO, fechaLocal, sumarDias } from "@/lib/fechas";

const DIAS_CABECERA = ["L", "M", "X", "J", "V", "S", "D"];
const MAX_PUNTOS = 4;

function colorPunto(cita: CitaCalendario) {
  if (cita.origen_externo) {
    return"bg-neutral-400";
  }
  if (cita.estado === "confirmada") {
    return "bg-primary-500";
  }
  return "bg-amber-400";
}

export function VistaMes({
  anchor,
  citas,
  diasVisibles,
  onSeleccionarDia,
}: {
  anchor: Date;
  citas: CitaCalendario[];
  /** Offsets desde el lunes (0=lunes ... 6=domingo) de las columnas a mostrar. */
  diasVisibles: number[];
  onSeleccionarDia: (dia: Date) => void;
}) {
  const anio = anchor.getFullYear();
  const mes = anchor.getMonth() + 1;
  const hoyISO = fechaISO(new Date());

  // Las citas externas de varios días (fecha_fin) suman su punto en cada día
  // del rango, no solo en "fecha"; el resto de tipos de cita siguen siendo
  // de un solo día en esta tanda.
  const citasPorFecha = new Map<string, CitaCalendario[]>();
  for (const cita of citas) {
    if (!cita.fecha) continue;
    const fechaFinCita = cita.origen_externo && cita.fecha_fin ? cita.fecha_fin : cita.fecha;
    for (let cursor = fechaLocal(cita.fecha); fechaISO(cursor) <= fechaFinCita; cursor = sumarDias(cursor, 1)) {
      const key = fechaISO(cursor);
      const lista = citasPorFecha.get(key) ?? [];
      lista.push(cita);
      citasPorFecha.set(key, lista);
    }
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

  // Cada fila de `semanas` está indexada 0=lunes...6=domingo, el mismo
  // criterio que diasVisibles: filtrar por esos índices basta para ocultar
  // las columnas de los días no seleccionados.
  const semanasVisibles = semanas.map((semana) => diasVisibles.map((offset) => semana[offset]));
  const cabeceraVisible = diasVisibles.map((offset) => DIAS_CABECERA[offset]);
  const numDias = diasVisibles.length;

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex min-w-[720px] flex-1 flex-col gap-2">
        <div
          className="grid gap-2 text-center text-sm font-medium text-neutral-500"
          style={{ gridTemplateColumns: `repeat(${numDias}, minmax(0, 1fr))` }}
        >
          {cabeceraVisible.map((letra, index) => (
            <div key={index}>{letra}</div>
          ))}
        </div>

        {semanasVisibles.map((semana, indexSemana) => (
          <div
            key={indexSemana}
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(${numDias}, minmax(0, 1fr))` }}
          >
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
                  className={`flex aspect-square flex-col items-center justify-center gap-2 rounded-lg border text-lg disabled:cursor-default ${
                    esHoy
                      ? "border-primary-600 font-medium text-primary-700"
                      : "border-neutral-200 text-neutral-900"
                  }`}
                >
                  <span>{dia.getDate()}</span>
                  {citasDelDia.length > 0 && (
                    <span className="flex items-center gap-1">
                      {citasDelDia.slice(0, MAX_PUNTOS).map((cita) => (
                        <span
                          key={cita.id}
                          className={`h-2.5 w-2.5 rounded-full ${colorPunto(cita)}`}
                        />
                      ))}
                      {citasDelDia.length > MAX_PUNTOS && (
                        <span className="text-sm text-neutral-500">
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
    </div>
  );
}
