export type SeccionCitas = { href: string; label: string };

export const SECCIONES_CITAS: SeccionCitas[] = [
  { href: "/dashboard/citas", label: "Todas las citas" },
  { href: "/dashboard/citas/pendientes", label: "Citas pendientes de confirmar" },
  { href: "/dashboard/citas/canceladas", label: "Citas canceladas" },
];
