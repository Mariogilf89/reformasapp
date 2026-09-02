"use client";

import { InputHTMLAttributes, forwardRef, useState, type SVGProps } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";

function IconEye(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path d="M1.5 12s4-7.5 10.5-7.5S22.5 12 22.5 12s-4 7.5-10.5 7.5S1.5 12 1.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconEyeOff(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path d="M3 3l18 18" />
      <path d="M10.58 10.58a3 3 0 0 0 4.24 4.24" />
      <path d="M9.88 4.64A10.94 10.94 0 0 1 12 4.5c6.5 0 10.5 7.5 10.5 7.5a17.9 17.9 0 0 1-3.44 4.53M6.6 6.6C3.7 8.4 1.5 12 1.5 12s4 7.5 10.5 7.5c1.5 0 2.85-.4 4.03-1.02" />
    </svg>
  );
}

/** Input de contraseña con botón para alternar entre texto oculto y visible. */
export const PasswordInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    const [visible, setVisible] = useState(false);

    return (
      <div className="relative w-full">
        <Input
          ref={ref}
          type={visible ? "text" : "password"}
          className={cn("w-full pr-9", className)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((actual) => !actual)}
          className="absolute inset-y-0 right-0 flex items-center pl-2.5 pr-1.5 text-neutral-400 hover:text-neutral-600"
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          tabIndex={-1}
        >
          {visible ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
        </button>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";
