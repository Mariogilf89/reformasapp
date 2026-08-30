export const TIPOS_NOTIFICACION = [
  "cita_propuesta",
  "cita_confirmada",
  "cita_cancelada",
  "mensaje_cliente",
] as const;

export type TipoNotificacion = (typeof TIPOS_NOTIFICACION)[number];

export type Notificacion = {
  id: string;
  tipo: TipoNotificacion;
  titulo: string;
  cuerpo: string | null;
  url: string | null;
  leida: boolean;
  creado_en: string;
};
