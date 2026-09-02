import "server-only";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const CALENDAR_API_BASE = "https://www.googleapis.com/calendar/v3";
const USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

// calendar.app.created: crea/borra únicamente el calendario secundario que
// la propia app crea, y da CRUD de eventos solo dentro de él — más estrecho
// que calendar.events (que da acceso a TODOS los calendarios del usuario) y,
// a diferencia de calendar.events, sí permite calendars.insert/delete, que
// hace falta para crear y borrar el calendario dedicado "Faenia".
// "email" es un scope básico (no sensible, sin revisión de Google) que solo
// se usa para mostrar "Conectado como ..." en la UI.
const GOOGLE_CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.app.created email";

const TIMEZONE = "Europe/Madrid";
export const NOMBRE_CALENDARIO_FAENIA = "Faenia";

function redirectUri(origin: string): string {
  return `${origin}/api/google-calendar/callback`;
}

export function construirUrlAutorizacionGoogle(state: string, origin: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CALENDAR_CLIENT_ID!,
    redirect_uri: redirectUri(origin),
    response_type: "code",
    scope: GOOGLE_CALENDAR_SCOPE,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export type TokensGoogle = { accessToken: string; refreshToken: string | null; expiraEn: Date };

/** Lanza si Google responde error al canjear el código. */
export async function intercambiarCodigoPorTokens(code: string, origin: string): Promise<TokensGoogle> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CALENDAR_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET!,
      redirect_uri: redirectUri(origin),
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    throw new Error(`Error al canjear el código de Google: ${await res.text()}`);
  }
  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
  };
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? null,
    expiraEn: new Date(Date.now() + data.expires_in * 1000),
  };
}

/** Lanza si el refresh_token fue revocado o Google responde error. */
export async function refrescarAccessToken(
  refreshToken: string
): Promise<{ accessToken: string; expiraEn: Date }> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CALENDAR_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET!,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    throw new Error(`Error al refrescar el access_token de Google: ${await res.text()}`);
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  return { accessToken: data.access_token, expiraEn: new Date(Date.now() + data.expires_in * 1000) };
}

/** Best-effort: null si el scope "email" no se concedió o la llamada falla. */
export async function obtenerEmailCuentaGoogle(accessToken: string): Promise<string | null> {
  try {
    const res = await fetch(USERINFO_URL, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!res.ok) return null;
    const data = (await res.json()) as { email?: string };
    return data.email ?? null;
  } catch {
    return null;
  }
}

function authHeaders(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" };
}

/** Lanza si falla la creación. Devuelve el id del calendario nuevo. */
export async function crearCalendarioFaenia(accessToken: string): Promise<string> {
  const res = await fetch(`${CALENDAR_API_BASE}/calendars`, {
    method: "POST",
    headers: authHeaders(accessToken),
    body: JSON.stringify({ summary: NOMBRE_CALENDARIO_FAENIA, timeZone: TIMEZONE }),
  });
  if (!res.ok) {
    throw new Error(`Error al crear el calendario Faenia: ${await res.text()}`);
  }
  const data = (await res.json()) as { id: string };
  return data.id;
}

/** Idempotente: no lanza si el calendario ya no existe (404/410). */
export async function eliminarCalendarioGoogle(accessToken: string, calendarId: string): Promise<void> {
  const res = await fetch(`${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}`, {
    method: "DELETE",
    headers: authHeaders(accessToken),
  });
  if (!res.ok && res.status !== 404 && res.status !== 410) {
    throw new Error(`Error al borrar el calendario Faenia: ${await res.text()}`);
  }
}

export type EventoGoogleInput = {
  summary: string;
  location?: string;
  description?: string;
  fecha: string; // YYYY-MM-DD
  horaInicio: string; // HH:mm o HH:mm:ss
  horaFin: string;
};

function aCuerpoEvento(evento: EventoGoogleInput) {
  const horaInicio = evento.horaInicio.slice(0, 5);
  const horaFin = evento.horaFin.slice(0, 5);
  return {
    summary: evento.summary,
    location: evento.location,
    description: evento.description,
    start: { dateTime: `${evento.fecha}T${horaInicio}:00`, timeZone: TIMEZONE },
    end: { dateTime: `${evento.fecha}T${horaFin}:00`, timeZone: TIMEZONE },
  };
}

/** Lanza si falla. Devuelve el id del evento creado. */
export async function crearEventoGoogle(
  accessToken: string,
  calendarId: string,
  evento: EventoGoogleInput
): Promise<string> {
  const res = await fetch(`${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events`, {
    method: "POST",
    headers: authHeaders(accessToken),
    body: JSON.stringify(aCuerpoEvento(evento)),
  });
  if (!res.ok) {
    throw new Error(`Error al crear el evento en Google Calendar: ${await res.text()}`);
  }
  const data = (await res.json()) as { id: string };
  return data.id;
}

/** Lanza si falla (incluido si el evento ya no existe en Google). */
export async function actualizarEventoGoogle(
  accessToken: string,
  calendarId: string,
  eventId: string,
  evento: EventoGoogleInput
): Promise<void> {
  const res = await fetch(
    `${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    { method: "PATCH", headers: authHeaders(accessToken), body: JSON.stringify(aCuerpoEvento(evento)) }
  );
  if (!res.ok) {
    throw new Error(`Error al actualizar el evento en Google Calendar: ${await res.text()}`);
  }
}

/** Idempotente: no lanza si el evento ya no existe (404/410). */
export async function eliminarEventoGoogle(
  accessToken: string,
  calendarId: string,
  eventId: string
): Promise<void> {
  const res = await fetch(
    `${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    { method: "DELETE", headers: authHeaders(accessToken) }
  );
  if (!res.ok && res.status !== 404 && res.status !== 410) {
    throw new Error(`Error al borrar el evento en Google Calendar: ${await res.text()}`);
  }
}
