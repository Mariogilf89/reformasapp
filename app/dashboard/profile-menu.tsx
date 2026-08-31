"use client";

import Link from "next/link";
import { useState } from "react";

function iniciales(nombre: string) {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  const letras = partes.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "");
  return letras.join("") || "?";
}

export function ProfileMenu({
  nombre,
  fotoUrl,
  navLinks,
  onSignOut,
}: {
  nombre: string;
  fotoUrl: string | null;
  navLinks: { href: string; label: string }[];
  onSignOut: () => void;
}) {
  const [abierto, setAbierto] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-label="Menú de perfil"
        aria-haspopup="menu"
        aria-expanded={abierto}
        className="block h-9 w-9 shrink-0 cursor-pointer overflow-hidden rounded-full border border-neutral-300"
      >
        {fotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={fotoUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-primary-600 text-xs font-medium text-white">
            {iniciales(nombre)}
          </span>
        )}
      </button>

      {abierto && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setAbierto(false)} />
          <div
            role="menu"
            className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-neutral-200 bg-white py-1 shadow-lg"
          >
            <p className="truncate border-b border-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900">
              {nombre}
            </p>
            <ul className="flex flex-col py-1">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    role="menuitem"
                    onClick={() => setAbierto(false)}
                    className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <form action={onSignOut} className="border-t border-neutral-100 pt-1">
              <button
                type="submit"
                role="menuitem"
                className="block w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
