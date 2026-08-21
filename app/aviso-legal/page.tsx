import { LegalPage, LegalSection } from "@/components/legal-page";

// Contenido genérico de partida — pendiente de revisión por un gestor o abogado antes del lanzamiento real.
export default function AvisoLegalPage() {
  return (
    <LegalPage titulo="Aviso legal">
      <LegalSection titulo="1. Identificación del titular">
        <p>
          En cumplimiento del deber de información recogido en el artículo 10 de la Ley 34/2002,
          de 11 de julio, de Servicios de la Sociedad de la Información y de Comercio Electrónico
          (LSSI-CE), se informa de los siguientes datos: el titular de este sitio web y de la
          plataforma ReformasApp es [Denominación social pendiente de completar], con NIF/CIF
          [pendiente de completar], domicilio social en [dirección pendiente de completar],
          inscrita en [datos registrales pendientes de completar]. Para cualquier consulta puede
          contactar a través de [email de contacto pendiente de completar].
        </p>
      </LegalSection>

      <LegalSection titulo="2. Objeto y ámbito de aplicación">
        <p>
          ReformasApp es una plataforma en línea (en adelante, la &quot;Plataforma&quot;) que actúa
          como intermediaria, poniendo en contacto a particulares y administradores de fincas que
          necesitan servicios del hogar (reformas, pintura, electricidad, fontanería,
          carpintería, limpieza y similares) con profesionales que ofrecen dichos servicios. El
          presente aviso legal regula el acceso y uso del sitio web, sin perjuicio de que Términos
          y Condiciones específicos regulen la relación contractual derivada del uso de la
          Plataforma.
        </p>
      </LegalSection>

      <LegalSection titulo="3. Condiciones de acceso y uso">
        <p>
          El acceso al sitio web es gratuito, salvo en lo relativo al coste de conexión a través
          de la red de telecomunicaciones suministrada por el proveedor de acceso contratado por
          los usuarios. El uso del sitio web atribuye la condición de usuario e implica la
          aceptación plena de las condiciones incluidas en este Aviso Legal, en la Política de
          Privacidad y en los Términos y Condiciones.
        </p>
      </LegalSection>

      <LegalSection titulo="4. Propiedad intelectual e industrial">
        <p>
          Todos los contenidos del sitio web (textos, imágenes, marcas, logotipos, diseño,
          estructura de navegación y código fuente), salvo aquellos aportados por los propios
          usuarios o profesionales, son titularidad de [Denominación social pendiente de
          completar] o de terceros que han autorizado su uso, y están protegidos por la normativa
          de propiedad intelectual e industrial. Queda prohibida su reproducción, distribución o
          transformación sin autorización expresa.
        </p>
      </LegalSection>

      <LegalSection titulo="5. Exclusión de responsabilidad">
        <p>
          El titular no garantiza la disponibilidad y continuidad del funcionamiento del sitio
          web, ni se hace responsable de los daños y perjuicios que pudieran derivarse de la
          falta de disponibilidad o de continuidad del mismo, ni de la existencia de virus u otros
          elementos lesivos. Para la responsabilidad relativa a los trabajos realizados por los
          profesionales que se anuncian en la Plataforma, véase el apartado correspondiente de los
          Términos y Condiciones.
        </p>
      </LegalSection>

      <LegalSection titulo="6. Legislación aplicable y jurisdicción">
        <p>
          Las presentes condiciones se rigen por la legislación española. Para la resolución de
          cualquier controversia, las partes se someten a los juzgados y tribunales que
          correspondan conforme a la normativa vigente en materia de protección de consumidores y
          usuarios, sin perjuicio de otros fueros que pudieran resultar de aplicación.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
