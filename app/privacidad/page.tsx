import { LegalPage, LegalSection } from "@/components/legal-page";

// Contenido genérico de partida — pendiente de revisión por un gestor o abogado antes del lanzamiento real.
export default function PrivacidadPage() {
  return (
    <LegalPage titulo="Política de privacidad">
      <LegalSection titulo="1. Responsable del tratamiento">
        <p>
          El responsable del tratamiento de los datos personales recogidos a través de
          Faenia es [Denominación social pendiente de completar], con NIF/CIF [pendiente de
          completar] y domicilio en [dirección pendiente de completar]. Para cualquier cuestión
          relacionada con el tratamiento de sus datos puede contactar en [email de contacto
          pendiente de completar].
        </p>
      </LegalSection>

      <LegalSection titulo="2. Datos que tratamos y finalidad">
        <p>
          Tratamos los datos que nos facilita al registrarse y utilizar la Plataforma (nombre,
          email, contraseña, rol de usuario, categoría de servicio, zona, descripción de
          solicitudes, mensajes intercambiados entre usuarios, valoraciones y, en su caso,
          fotografías) con las siguientes finalidades: gestionar el registro y la cuenta de
          usuario, poner en contacto a particulares/administradores de fincas con profesionales,
          gestionar solicitudes y mensajería interna, gestionar el sistema de valoraciones, y
          atender consultas o incidencias.
        </p>
      </LegalSection>

      <LegalSection titulo="3. Legitimación">
        <p>
          La base legal para el tratamiento de sus datos es la ejecución del contrato de
          prestación del servicio de intermediación (aceptación de los Términos y Condiciones al
          registrarse), así como, en su caso, el consentimiento del interesado y el interés
          legítimo del responsable en el correcto funcionamiento y mejora de la Plataforma, de
          conformidad con el Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018, de
          Protección de Datos Personales y garantía de los derechos digitales (LOPDGDD).
        </p>
      </LegalSection>

      <LegalSection titulo="4. Destinatarios de los datos">
        <p>
          Sus datos podrán ser compartidos con otros usuarios de la Plataforma en la medida
          necesaria para posibilitar el contacto entre particulares/administradores de fincas y
          profesionales (por ejemplo, nombre y datos de contacto de la solicitud). Asimismo,
          podrán tener acceso a los datos los proveedores tecnológicos que prestan servicios de
          alojamiento, base de datos, autenticación y envío de comunicaciones necesarios para el
          funcionamiento de la Plataforma, actuando como encargados del tratamiento. No se cederán
          datos a terceros al margen de lo indicado, salvo obligación legal.
        </p>
      </LegalSection>

      <LegalSection titulo="5. Plazo de conservación">
        <p>
          Los datos se conservarán mientras se mantenga la cuenta de usuario activa y,
          posteriormente, durante los plazos legalmente exigibles para atender eventuales
          responsabilidades derivadas del tratamiento.
        </p>
      </LegalSection>

      <LegalSection titulo="6. Derechos de las personas interesadas">
        <p>
          Puede ejercer sus derechos de acceso, rectificación, supresión, oposición, limitación
          del tratamiento y portabilidad de los datos dirigiéndose por escrito a [email de
          contacto pendiente de completar], adjuntando copia de un documento que acredite su
          identidad. Asimismo, tiene derecho a presentar una reclamación ante la Agencia Española
          de Protección de Datos (www.aepd.es) si considera que el tratamiento no se ajusta a la
          normativa vigente.
        </p>
      </LegalSection>

      <LegalSection titulo="7. Medidas de seguridad">
        <p>
          Adoptamos las medidas técnicas y organizativas adecuadas para garantizar un nivel de
          seguridad apropiado al riesgo, de acuerdo con lo dispuesto en el RGPD.
        </p>
      </LegalSection>

      <LegalSection titulo="8. Modificaciones de la política de privacidad">
        <p>
          Esta política puede ser modificada para adaptarla a novedades legislativas o cambios en
          el funcionamiento de la Plataforma. Se recomienda su consulta periódica.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
