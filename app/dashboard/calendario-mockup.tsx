import type { CSSProperties } from "react";
import { estiloCita } from "@/lib/calendario-geometria";
import { IconTelefono } from "@/components/ui/icon-telefono";
import "./calendario-mockup.css";

const DIAS = ["Lun", "Mar"];
const HORAS = [9, 10, 11, 12, 13, 14];

const GUTTER_PX = 24;
const COLUMNA_PX = 150;
const HORA_PX = 70;
const ANCHO_PX = GUTTER_PX + COLUMNA_PX * DIAS.length;
const ALTO_PX = HORA_PX * HORAS.length;

type CitaMockup = {
  id: string;
  columna: number;
  horaInicio: number;
  duracionH: number;
  titulo: string;
  contacto: string;
  direccion: string;
  telefono: string;
  estilo: Pick<Parameters<typeof estiloCita>[0], "origen_externo" | "estado" | "propuesto_por" | "color">;
  /** Solo la cita animada: columna/hora a la que se desplaza y vuelve, en bucle. */
  destino?: { columna: number; horaInicio: number };
};

const CITAS_MOCKUP: CitaMockup[] = [
  {
    id: "1",
    columna: 0,
    horaInicio: 9,
    duracionH: 2,
    titulo: "Pintura",
    contacto: "Ana García",
    direccion: "Gran Vía 45",
    telefono: "612 345 678",
    estilo: { origen_externo: false, estado: "confirmada", propuesto_por: "cliente", color: null },
  },
  {
    id: "2",
    columna: 1,
    horaInicio: 9,
    duracionH: 2,
    titulo: "Fontanería",
    contacto: "Luis Fernández",
    direccion: "Alcalá 120",
    telefono: "655 789 234",
    estilo: { origen_externo: false, estado: "pendiente", propuesto_por: "cliente", color: null },
  },
  {
    id: "3",
    columna: 0,
    horaInicio: 12,
    duracionH: 2,
    titulo: "Electricidad",
    contacto: "Marta Sánchez",
    direccion: "Serrano 88",
    telefono: "699 456 123",
    estilo: { origen_externo: true, estado: "confirmada", propuesto_por: "cliente", color: "#CFE0F0" },
  },
  {
    id: "4",
    columna: 1,
    horaInicio: 12,
    duracionH: 2,
    titulo: "Presupuesto",
    contacto: "Javier Ruiz",
    direccion: "Velázquez 30",
    telefono: "677 234 567",
    estilo: { origen_externo: true, estado: "confirmada", propuesto_por: "cliente", color: "#DDD3EE" },
    destino: { columna: 1, horaInicio: 13 },
  },
];

function posicion(columna: number, horaInicio: number, duracionH: number) {
  return {
    left: GUTTER_PX + columna * COLUMNA_PX,
    top: (horaInicio - HORAS[0]) * HORA_PX,
    width: COLUMNA_PX - 6,
    height: duracionH * HORA_PX - 6,
  };
}

/**
 * Mini calendario de ejemplo para la diapositiva 2 del pop-up de
 * bienvenida: mismo estilo visual que el calendario real (estiloCita, los
 * mismos colores pastel de las citas externas, el mismo botón verde de
 * llamada que el modal de detalle), pero con datos fijos e inventados y
 * sin ninguna de las interacciones reales (arrastrar/redimensionar), para
 * no depender de una cuenta ni de la base de datos. Una de las citas se
 * anima en bucle con CSS puro (ver calendario-mockup.css) para sugerir el
 * arrastre sin implementar uno de verdad.
 */
export function CalendarioMockup() {
  return (
    <div
      className="select-none overflow-hidden rounded-xl border border-neutral-200 bg-white p-3 shadow-sm"
      style={{ width: ANCHO_PX + 24 }}
    >
      <div className="flex" style={{ width: ANCHO_PX }}>
        <div style={{ width: GUTTER_PX }} />
        {DIAS.map((dia) => (
          <div
            key={dia}
            style={{ width: COLUMNA_PX }}
            className="text-center text-[10px] font-medium text-neutral-500"
          >
            {dia}
          </div>
        ))}
      </div>

      <div className="relative mt-1" style={{ width: ANCHO_PX, height: ALTO_PX }}>
        {HORAS.map((hora, index) => (
          <div
            key={hora}
            className="absolute left-0 w-full border-t border-neutral-100"
            style={{ top: index * HORA_PX }}
          >
            <span
              className="absolute -top-1.5 text-[9px] text-neutral-400"
              style={{ left: 0, width: GUTTER_PX - 4 }}
            >
              {hora}:00
            </span>
          </div>
        ))}

        {CITAS_MOCKUP.map((cita) => {
          const { className, style } = estiloCita(cita.estilo);
          const pos = posicion(cita.columna, cita.horaInicio, cita.duracionH);

          const animada: CSSProperties | undefined = cita.destino
            ? ({
                "--mockup-dx": `${(cita.destino.columna - cita.columna) * COLUMNA_PX}px`,
                "--mockup-dy": `${(cita.destino.horaInicio - cita.horaInicio) * HORA_PX}px`,
              } as CSSProperties)
            : undefined;

          return (
            <div
              key={cita.id}
              className={`absolute flex flex-col gap-1 overflow-hidden rounded-md border p-2 leading-tight ${className} ${
                cita.destino ? "calendario-mockup-cita-animada" : ""
              }`}
              style={{
                left: pos.left,
                top: pos.top,
                width: pos.width,
                height: pos.height,
                ...style,
                ...animada,
              }}
            >
              <p className="truncate text-[10px] font-semibold">{cita.titulo}</p>
              <p className="truncate text-[9px] opacity-80">{cita.contacto}</p>
              <p className="truncate text-[9px] opacity-80">{cita.direccion}</p>
              <div className="mt-auto flex items-center gap-1.5">
                <span className="min-w-0 truncate text-[9px] opacity-80">{cita.telefono}</span>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-600 text-white">
                  <IconTelefono className="h-4 w-4" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
