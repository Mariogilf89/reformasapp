export type SeccionPerfil = {
  href: string;
  label: string;
  breadcrumb: string;
  descripcion?: string;
};

export const SECCIONES_PERFIL: SeccionPerfil[] = [
  {
    href: "/dashboard/perfil",
    label: "Datos personales",
    breadcrumb: "Actualizar datos personales",
    descripcion: "Actualiza tu perfil profesional",
  },
  {
    href: "/dashboard/perfil/email",
    label: "Cambiar e-mail",
    breadcrumb: "Cambiar e-mail",
  },
  {
    href: "/dashboard/perfil/contrasena",
    label: "Cambiar contraseña",
    breadcrumb: "Cambiar contraseña",
  },
  {
    href: "/dashboard/verificar-telefono",
    label: "Verificar usuario",
    breadcrumb: "Verificar teléfono",
  },
  {
    href: "/dashboard/perfil/notificaciones",
    label: "Notificaciones",
    breadcrumb: "Notificaciones",
  },
];
