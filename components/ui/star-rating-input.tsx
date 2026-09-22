"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/cn";

/**
 * Selector de estrellas (1-5) para un criterio de valoración. Guarda el
 * valor en un <input type="hidden"> con el name indicado para que viaje con
 * el <form> normal (useActionState/server action), sin necesitar JS en el
 * submit.
 */
export function StarRatingInput({
  name,
  label,
  defaultValue = 0,
}: {
  name: string;
  label: string;
  defaultValue?: number;
}) {
  const [valor, setValor] = useState(defaultValue);
  const [hover, setHover] = useState(0);
  const activas = hover || valor;

  return (
    <div className="flex flex-col gap-1">
      <Label>{label}</Label>
      <div role="radiogroup" aria-label={label} className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={valor === n}
            aria-label={`${n} ${n === 1 ? "estrella" : "estrellas"}`}
            onClick={() => setValor(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            className="cursor-pointer p-0.5 text-2xl leading-none"
          >
            <span className={cn(activas >= n ? "text-amber-400" : "text-neutral-300")}>★</span>
          </button>
        ))}
      </div>
      <input type="hidden" name={name} value={valor} />
    </div>
  );
}
