import { LegalPage, LegalSection } from "@/components/legal-page";

// Contenido genérico de partida — pendiente de revisión por un gestor o abogado antes del lanzamiento real.
export default function TerminosPage() {
  return (
    <LegalPage titulo="Términos y condiciones">
      <LegalSection titulo="1. Objeto y aceptación">
        <p>
          Los presentes Términos y Condiciones regulan el acceso y uso de Faenia (en
          adelante, la &quot;Plataforma&quot;), operada por [Denominación social pendiente de
          completar]. El registro y uso de la Plataforma implica la aceptación íntegra de estos
          Términos, del Aviso Legal y de la Política de Privacidad.
        </p>
      </LegalSection>

      <LegalSection titulo="2. Naturaleza del servicio">
        <p>
          Faenia es una plataforma de intermediación (marketplace) que pone en contacto a
          particulares y administradores de fincas (en adelante, &quot;Clientes&quot;) con
          profesionales de servicios del hogar (en adelante, &quot;Profesionales&quot;). La
          Plataforma no presta, ejecuta ni supervisa los servicios de reforma, mantenimiento o
          similares, ni forma parte del contrato que, en su caso, se formalice directamente entre
          Cliente y Profesional.
        </p>
      </LegalSection>

      <LegalSection titulo="3. Registro de usuarios">
        <p>
          Para utilizar determinadas funcionalidades es necesario registrarse, aportando datos
          veraces, exactos y actualizados. Cada usuario es responsable de la custodia de sus
          credenciales de acceso y de la actividad realizada desde su cuenta. Los Profesionales
          son responsables de la veracidad de la información publicada sobre su actividad,
          categorías, zona de cobertura y cualificación.
        </p>
      </LegalSection>

      <LegalSection titulo="4. Obligaciones de los usuarios">
        <p>
          Los usuarios se comprometen a hacer un uso lícito y diligente de la Plataforma, a
          proporcionar información veraz, a no suplantar la identidad de terceros, a respetar los
          derechos de otros usuarios y a no utilizar la Plataforma con fines fraudulentos o
          contrarios a la buena fe. Los Profesionales se comprometen a disponer de las
          habilitaciones, licencias, seguros y cualificaciones que, en su caso, exija la normativa
          aplicable a su actividad.
        </p>
      </LegalSection>

      <LegalSection titulo="5. Relación entre Cliente y Profesional">
        <p>
          El contrato de prestación de servicios (presupuesto, ejecución del trabajo, plazos,
          precio, garantías) se formaliza directamente entre el Cliente y el Profesional, al
          margen de la Plataforma, que actúa exclusivamente como canal de puesta en contacto.
          Faenia no interviene en la negociación, ejecución ni cumplimiento de dichos
          acuerdos.
        </p>
      </LegalSection>

      <LegalSection titulo="6. Limitación de responsabilidad">
        <p>
          Faenia no garantiza la calidad, seguridad, licitud, idoneidad ni resultado de los
          trabajos realizados por los Profesionales, ni la veracidad de los perfiles, valoraciones
          o disponibilidad publicados. En consecuencia, Faenia no asume responsabilidad
          alguna por daños, perjuicios, incumplimientos, defectos de ejecución o cualquier otra
          controversia derivada de los servicios prestados por los Profesionales a los Clientes,
          siendo dichas cuestiones responsabilidad exclusiva de las partes que hayan contratado
          directamente entre sí. Asimismo, la Plataforma no garantiza la disponibilidad
          ininterrumpida del servicio ni la ausencia de errores.
        </p>
      </LegalSection>

      <LegalSection titulo="7. Valoraciones y contenido generado por usuarios">
        <p>
          Los Clientes pueden valorar a los Profesionales tras una solicitud realizada a través de
          la Plataforma. Las valoraciones deben ser veraces y respetuosas. Faenia podrá
          retirar contenidos que incumplan estos Términos o la normativa vigente, sin que ello
          genere derecho a indemnización alguna.
        </p>
      </LegalSection>

      <LegalSection titulo="8. Suspensión y baja de cuentas">
        <p>
          Faenia podrá suspender o cancelar la cuenta de un usuario que incumpla estos
          Términos, proporcione información falsa o haga un uso indebido de la Plataforma, previa
          comunicación cuando sea posible.
        </p>
      </LegalSection>

      <LegalSection titulo="9. Modificación de los términos">
        <p>
          Faenia podrá modificar estos Términos y Condiciones en cualquier momento. Las
          modificaciones se comunicarán a través de la Plataforma y entrarán en vigor desde su
          publicación, sin perjuicio del derecho del usuario a darse de baja si no está conforme.
        </p>
      </LegalSection>

      <LegalSection titulo="10. Legislación aplicable y jurisdicción">
        <p>
          Estos Términos se rigen por la legislación española. Cualquier controversia se someterá
          a los juzgados y tribunales competentes conforme a la normativa de protección de
          consumidores y usuarios, sin perjuicio de otros fueros aplicables.
        </p>
      </LegalSection>

      <LegalSection titulo="11. Contacto">
        <p>
          Para cualquier duda relacionada con estos Términos puede contactar en [email de contacto
          pendiente de completar].
        </p>
      </LegalSection>
    </LegalPage>
  );
}
