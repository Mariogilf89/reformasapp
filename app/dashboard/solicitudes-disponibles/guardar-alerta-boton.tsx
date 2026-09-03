"use client";

import { useState } from "react";
import { guardarAlertaBusqueda } from "@/app/actions/alertas-busqueda";
import { Button } from "@/components/ui/button";

/**
 * Versión independiente del botón "Guardar esta búsqueda y avisarme" para
 * el estado vacío (page.tsx): a diferencia del que vive dentro de
 * FiltrosSolicitudesDisponibles (que reutiliza el <form> de filtros vía
 * formAction para capturar selects aún sin enviar), este va con los
 * criterios ya aplicados a la búsqueda actual (los de la URL), que es
 * justo lo que se quiere guardar cuando esa búsqueda no ha dado resultados.
 */
export function GuardarAlertaBoton({
  categoria,
  provincia,
  modo,
}: {
  categoria: string;
  provincia: string;
  modo: string;
}) {
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setGuardando(true);
    setError(null);
    const resultado = await guardarAlertaBusqueda(formData);
    setGuardando(false);

    if (resultado?.error) {
      setError(resultado.error);
      return;
    }
    setGuardado(true);
  }

  if (guardado) {
    return (
      <p className="text-sm font-medium text-primary-700">
        Alerta guardada. Te avisaremos por email cuando encaje una solicitud nueva.
      </p>
    );
  }

  return (
    <form action={handleSubmit} className="flex flex-col items-center gap-2">
      <input type="hidden" name="categoria" value={categoria} />
      <input type="hidden" name="provincia" value={provincia} />
      <input type="hidden" name="modo" value={modo} />
      <Button type="submit" disabled={guardando}>
        {guardando ? "Guardando..." : "Guardar esta búsqueda y avisarme"}
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
