import "server-only";

const modoDesarrolloForzado = process.env.SMS_MODO_DESARROLLO === "true";
const credencialesTwilioConfiguradas = Boolean(
  process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER
);

const modoDesarrollo = modoDesarrolloForzado || !credencialesTwilioConfiguradas;

export async function enviarCodigoVerificacion(telefono: string, codigo: string) {
  if (modoDesarrollo) {
    console.log(
      `\n========================================\n` +
        `📱 SMS (modo desarrollo, no se envía de verdad)\n` +
        `Destinatario: ${telefono}\n` +
        `Código de verificación: ${codigo}\n` +
        `========================================\n`
    );
    return;
  }

  // Import dinámico con nombre no literal: evita que TypeScript exija los
  // tipos de "twilio" cuando el paquete todavía no está instalado.
  const nombrePaquete = "twilio";
  const { default: Twilio } = await import(nombrePaquete);
  const cliente = Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

  await cliente.messages.create({
    from: process.env.TWILIO_PHONE_NUMBER,
    to: telefono,
    body: `Tu código de verificación de ReformasApp es: ${codigo}`,
  });
}
