"use client";

import { useActionState, useState } from "react";
import { DIAS_SEMANA, HORAS_DIA, MINUTOS_TRAMO } from "@/lib/disponibilidad";
import { crearTramoDisponibilidad } from "@/app/actions/disponibilidad";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

/** Par de <select> (hora + minutos) que combinados forman un "HH:MM". */
function SelectorHora({
  idPrefijo,
  etiqueta,
  hora,
  minutos,
  onCambiarHora,
  onCambiarMinutos,
}: {
  idPrefijo: string;
  etiqueta: string;
  hora: string;
  minutos: string;
  onCambiarHora: (hora: string) => void;
  onCambiarMinutos: (minutos: string) => void;
}) {
  return (
    <div className="flex flex-1 flex-col gap-1">
      <Label htmlFor={`${idPrefijo}_h`}>{etiqueta}</Label>
      <div className="flex items-center gap-1">
        <Select
          id={`${idPrefijo}_h`}
          aria-label={`${etiqueta} - hora`}
          required
          value={hora}
          onChange={(e) => onCambiarHora(e.target.value)}
          className="w-16 px-2"
        >
          <option value="" disabled>
            -
          </option>
          {HORAS_DIA.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </Select>
        <span className="text-neutral-500">:</span>
        <Select
          id={`${idPrefijo}_m`}
          aria-label={`${etiqueta} - minutos`}
          required
          value={minutos}
          onChange={(e) => onCambiarMinutos(e.target.value)}
          className="w-16 px-2"
        >
          <option value="" disabled>
            -
          </option>
          {MINUTOS_TRAMO.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}

export function DisponibilidadForm() {
  const [state, action, pending] = useActionState(crearTramoDisponibilidad, undefined);

  const [horaInicioH, setHoraInicioH] = useState("");
  const [horaInicioM, setHoraInicioM] = useState("");
  const [horaFinH, setHoraFinH] = useState("");
  const [horaFinM, setHoraFinM] = useState("");

  return (
    <Card className="p-6">
      <form action={action} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor="dia_semana">Día</Label>
          <Select id="dia_semana" name="dia_semana" required defaultValue="">
            <option value="" disabled>
              Selecciona un día
            </option>
            {DIAS_SEMANA.map((dia) => (
              <option key={dia.value} value={dia.value}>
                {dia.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-3">
          <SelectorHora
            idPrefijo="hora_inicio"
            etiqueta="Hora inicio"
            hora={horaInicioH}
            minutos={horaInicioM}
            onCambiarHora={setHoraInicioH}
            onCambiarMinutos={setHoraInicioM}
          />
          <SelectorHora
            idPrefijo="hora_fin"
            etiqueta="Hora fin"
            hora={horaFinH}
            minutos={horaFinM}
            onCambiarHora={setHoraFinH}
            onCambiarMinutos={setHoraFinM}
          />
        </div>
        <input type="hidden" name="hora_inicio" value={horaInicioH && horaInicioM ? `${horaInicioH}:${horaInicioM}` : ""} />
        <input type="hidden" name="hora_fin" value={horaFinH && horaFinM ? `${horaFinH}:${horaFinM}` : ""} />

        {state?.error && (
          <p className="text-sm text-red-600">{state.error}</p>
        )}

        <Button type="submit" disabled={pending} size="xs" className="self-start">
          {pending ? "Añadiendo..." : "Añadir tramo"}
        </Button>
      </form>
    </Card>
  );
}
