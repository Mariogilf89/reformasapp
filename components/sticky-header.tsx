"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Cabecera fija arriba durante el scroll. El borde/sombra inferior solo se
 * muestra a partir de un pequeño umbral de scroll, no siempre: así la
 * cabecera se funde con el contenido en la parte superior de la página y
 * gana separación visual en cuanto el usuario empieza a desplazarse.
 */
export function StickyHeader({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function actualizarScrolled() {
      setScrolled(window.scrollY > 4);
    }
    actualizarScrolled();
    window.addEventListener("scroll", actualizarScrolled, { passive: true });
    return () => window.removeEventListener("scroll", actualizarScrolled);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b bg-white transition-shadow",
        scrolled
          ? "border-neutral-200 shadow-sm"
          : "border-transparent"
      )}
    >
      {children}
    </header>
  );
}
