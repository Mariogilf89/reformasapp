"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

const PerfilResetContext = createContext<(() => void) | null>(null);

/**
 * Permite "Cancelar" (descartar cambios sin guardar) sin recargar la
 * página: al pulsar, se cambia `resetToken`, lo que fuerza a React a
 * remontar todo el subárbol envuelto — cada campo vuelve a inicializarse
 * con su valor original (props del servidor). Hace falta remontar en vez de
 * usar un <form> nativo `reset` porque los chips de categorías/provincias
 * (ChipSelector) llevan su propio estado interno en React, no reaccionan a
 * un reset nativo del formulario.
 */
export function PerfilResetProvider({ children }: { children: ReactNode }) {
  const [resetToken, setResetToken] = useState(0);

  return (
    <PerfilResetContext.Provider value={() => setResetToken((token) => token + 1)}>
      <div key={resetToken} className="contents">
        {children}
      </div>
    </PerfilResetContext.Provider>
  );
}

export function usePerfilReset() {
  const reset = useContext(PerfilResetContext);
  if (!reset) {
    throw new Error("usePerfilReset debe usarse dentro de PerfilResetProvider");
  }
  return reset;
}
