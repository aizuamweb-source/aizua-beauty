/**
 * Aviso Legal — AizuaBeauty, en los 6 idiomas de la tienda.
 *
 * ⚠️ GENERADA POR SUSTITUCION desde Aizua-store: el cuerpo en español de las dos
 * tiendas era IDENTICO (verificado con diff normalizando marca y dominio). Si
 * tocas una, toca la otra.
 *
 * ⚠️ No añadir aquí el nombre real, el NIF ni el domicilio postal: el art. 10
 * LSSI-CE se cumple con titular, actividad, correo y web más la disponibilidad
 * del NIF a requerimiento. Es regla de privacidad del ecosistema.
 */

import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

const LOCALES = ["es", "en", "fr", "de", "pt", "it"] as const;
type Loc = (typeof LOCALES)[number];

const OG_LOCALE: Record<Loc, string> = {
  es: "es_ES", en: "en_US", fr: "fr_FR", de: "de_DE", pt: "pt_PT", it: "it_IT",
};

function pick(locale: string): Loc {
  return (LOCALES as readonly string[]).includes(locale) ? (locale as Loc) : "es";
}

interface Textos {
  metaTitle: string;
  metaDesc: string;
  h1: string;
  actualizado: string;
  s1: { h: string; p: string; titular: string; actividad: string; actividadV: string; nif: string; nifV: string; domicilio: string; domicilioV: string; email: string; web: string };
  s2: { h: string; p1a: string; sitio: string; p1b: string; p2: string };
  s3: { h: string; p1: string; p2: string; p3: string };
  s4: { h: string; p: string; items: string[] };
  s5: { h: string; p: string; items: string[]; nota: string };
  s6: { h: string; p: string; items: string[]; nota: string };
  s7: { h: string; p: string };
}

const T: Record<Loc, Textos> = {
  es: {
    metaTitle: "Aviso Legal",
    metaDesc: "Aviso legal de AizuaBeauty: datos del titular, condiciones de uso, propiedad intelectual, exclusión de responsabilidad y legislación aplicable.",
    h1: "Aviso Legal",
    actualizado: "Última actualización: marzo 2026",
    s1: {
      h: "1. Datos del titular",
      p: "En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), se informa de los siguientes datos identificativos:",
      titular: "Titular:", actividad: "Actividad:",
      actividadV: "Comercio electrónico y servicios de consultoría/formación",
      nif: "NIF:", nifV: "En poder del titular (disponible a requerimiento de autoridad competente)",
      domicilio: "Domicilio fiscal:", domicilioV: "España",
      email: "Correo electrónico:", web: "Web:",
    },
    s2: {
      h: "2. Objeto y ámbito de aplicación",
      p1a: "El presente Aviso Legal regula el acceso y el uso del sitio web de AizuaBeauty (en adelante,",
      sitio: "«el Sitio»",
      p1b: "), propiedad de Aizüa. El acceso al Sitio implica la aceptación plena y sin reservas de las presentes condiciones.",
      p2: "Este Aviso Legal se aplica a todos los usuarios que accedan o utilicen el Sitio, independientemente de su país de residencia o de la finalidad de su visita.",
    },
    s3: {
      h: "3. Propiedad intelectual e industrial",
      p1: "Todos los contenidos del Sitio — incluyendo textos, imágenes, logotipos, marcas, diseños, código fuente y elementos multimedia — son propiedad de Aizüa o de terceros que han autorizado su uso, y están protegidos por la legislación vigente en materia de propiedad intelectual e industrial.",
      p2: "Queda prohibida la reproducción, distribución, comunicación pública o transformación total o parcial de dichos contenidos sin autorización expresa y por escrito del titular, salvo que la ley lo permita.",
      p3: "El usuario puede visualizar y, en su caso, realizar copias privadas de los contenidos para uso exclusivamente personal y no comercial, siempre que no se supriman los indicadores de derechos de propiedad intelectual.",
    },
    s4: {
      h: "4. Condiciones de uso",
      p: "El usuario se compromete a:",
      items: [
        "Utilizar el Sitio de conformidad con la ley, la moral, el orden público y el presente Aviso Legal.",
        "No realizar actividades ilícitas, fraudulentas o lesivas de los derechos de terceros.",
        "No introducir virus, malware o cualquier otro código dañino que pueda perjudicar los sistemas del Sitio.",
        "No intentar acceder a zonas restringidas del Sitio sin autorización.",
        "No usar el Sitio con fines comerciales sin el consentimiento expreso del titular.",
      ],
    },
    s5: {
      h: "5. Exclusión de responsabilidad",
      p: "Aizüa no se hace responsable de los daños y perjuicios derivados de:",
      items: [
        "Interrupciones, errores técnicos o fallos en el acceso al Sitio debidos a causas ajenas.",
        "La presencia de virus u otros elementos que pudieran causar daños en sistemas informáticos del usuario.",
        "El uso del Sitio por menores de edad sin supervisión de sus tutores legales.",
        "Los contenidos de páginas de terceros enlazadas desde el Sitio.",
        "Los daños derivados de la interrupción temporal o definitiva del servicio.",
      ],
      nota: "El titular no garantiza la disponibilidad continua del Sitio y se reserva el derecho de suspenderlo o modificarlo cuando lo estime necesario, sin previo aviso.",
    },
    s6: {
      h: "6. Legislación aplicable y jurisdicción",
      p: "El presente Aviso Legal se rige por la legislación española, en particular por:",
      items: [
        "Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE).",
        "Real Decreto Legislativo 1/2007 (TRLGDCU) — protección de consumidores y usuarios.",
        "Reglamento (UE) 2016/679 (RGPD) — protección de datos personales.",
      ],
      nota: "Para la resolución de cualquier conflicto derivado del acceso o uso del Sitio, las partes se someten a los Juzgados y Tribunales del domicilio del usuario, salvo que la ley disponga otra cosa.",
    },
    s7: {
      h: "7. Modificaciones del aviso legal",
      p: "Aizüa se reserva el derecho de modificar el presente Aviso Legal en cualquier momento. Las modificaciones entrarán en vigor desde su publicación en el Sitio. Se recomienda al usuario revisar periódicamente este aviso para estar informado de posibles cambios.",
    },
  },

  en: {
    metaTitle: "Legal Notice",
    metaDesc: "AizuaBeauty legal notice: owner details, terms of use, intellectual property, disclaimer and applicable law.",
    h1: "Legal Notice",
    actualizado: "Last updated: March 2026",
    s1: {
      h: "1. Owner details",
      p: "In compliance with article 10 of Spanish Law 34/2002 of 11 July, on information society services and electronic commerce (LSSI-CE), the following identifying details are provided:",
      titular: "Owner:", actividad: "Activity:",
      actividadV: "E-commerce and consulting/training services",
      nif: "Tax ID:", nifV: "Held by the owner (available on request from a competent authority)",
      domicilio: "Registered address:", domicilioV: "Spain",
      email: "Email:", web: "Website:",
    },
    s2: {
      h: "2. Purpose and scope",
      p1a: "This Legal Notice governs access to and use of the AizuaBeauty website (hereinafter,",
      sitio: "“the Site”",
      p1b: "), owned by Aizüa. Accessing the Site implies full and unreserved acceptance of these terms.",
      p2: "This Legal Notice applies to all users who access or use the Site, regardless of their country of residence or the purpose of their visit.",
    },
    s3: {
      h: "3. Intellectual and industrial property",
      p1: "All content on the Site — including text, images, logos, trade marks, designs, source code and multimedia elements — is owned by Aizüa or by third parties who have authorised its use, and is protected by the applicable intellectual and industrial property legislation.",
      p2: "The reproduction, distribution, public communication or transformation, in whole or in part, of such content without the express written authorisation of the owner is prohibited, except where permitted by law.",
      p3: "Users may view and, where applicable, make private copies of the content for strictly personal, non-commercial use, provided that intellectual property notices are not removed.",
    },
    s4: {
      h: "4. Terms of use",
      p: "The user undertakes to:",
      items: [
        "Use the Site in accordance with the law, morality, public order and this Legal Notice.",
        "Refrain from unlawful or fraudulent activities or activities harmful to the rights of third parties.",
        "Refrain from introducing viruses, malware or any other harmful code that could damage the Site’s systems.",
        "Refrain from attempting to access restricted areas of the Site without authorisation.",
        "Refrain from using the Site for commercial purposes without the owner’s express consent.",
      ],
    },
    s5: {
      h: "5. Disclaimer",
      p: "Aizüa shall not be liable for damages arising from:",
      items: [
        "Interruptions, technical errors or failures in accessing the Site due to external causes.",
        "The presence of viruses or other elements that could cause damage to the user’s computer systems.",
        "Use of the Site by minors without the supervision of their legal guardians.",
        "The content of third-party pages linked from the Site.",
        "Damage arising from the temporary or permanent interruption of the service.",
      ],
      nota: "The owner does not guarantee the continuous availability of the Site and reserves the right to suspend or modify it whenever deemed necessary, without prior notice.",
    },
    s6: {
      h: "6. Applicable law and jurisdiction",
      p: "This Legal Notice is governed by Spanish law, in particular by:",
      items: [
        "Law 34/2002 of 11 July, on information society services and electronic commerce (LSSI-CE).",
        "Royal Legislative Decree 1/2007 (TRLGDCU) — consumer and user protection.",
        "Regulation (EU) 2016/679 (GDPR) — protection of personal data.",
      ],
      nota: "For the resolution of any dispute arising from access to or use of the Site, the parties submit to the Courts and Tribunals of the user’s domicile, unless the law provides otherwise.",
    },
    s7: {
      h: "7. Amendments to the legal notice",
      p: "Aizüa reserves the right to amend this Legal Notice at any time. Amendments take effect from their publication on the Site. Users are advised to review this notice periodically to stay informed of any changes.",
    },
  },

  fr: {
    metaTitle: "Mentions légales",
    metaDesc: "Mentions légales d’AizuaBeauty : données du titulaire, conditions d’utilisation, propriété intellectuelle, clause de non-responsabilité et droit applicable.",
    h1: "Mentions légales",
    actualizado: "Dernière mise à jour : mars 2026",
    s1: {
      h: "1. Données du titulaire",
      p: "Conformément à l’article 10 de la loi espagnole 34/2002 du 11 juillet, relative aux services de la société de l’information et au commerce électronique (LSSI-CE), les données d’identification suivantes sont communiquées :",
      titular: "Titulaire :", actividad: "Activité :",
      actividadV: "Commerce électronique et services de conseil/formation",
      nif: "NIF (numéro fiscal) :", nifV: "Détenu par le titulaire (disponible sur demande d’une autorité compétente)",
      domicilio: "Domicile fiscal :", domicilioV: "Espagne",
      email: "Adresse e-mail :", web: "Site web :",
    },
    s2: {
      h: "2. Objet et champ d’application",
      p1a: "Les présentes mentions légales régissent l’accès et l’utilisation du site web d’AizuaBeauty (ci-après,",
      sitio: "« le Site »",
      p1b: "), propriété d’Aizüa. L’accès au Site implique l’acceptation pleine et sans réserve des présentes conditions.",
      p2: "Les présentes mentions légales s’appliquent à tous les utilisateurs qui accèdent au Site ou l’utilisent, quel que soit leur pays de résidence ou la finalité de leur visite.",
    },
    s3: {
      h: "3. Propriété intellectuelle et industrielle",
      p1: "L’ensemble des contenus du Site — textes, images, logos, marques, designs, code source et éléments multimédias — est la propriété d’Aizüa ou de tiers ayant autorisé leur utilisation, et est protégé par la législation en vigueur en matière de propriété intellectuelle et industrielle.",
      p2: "La reproduction, la distribution, la communication au public ou la transformation, totale ou partielle, de ces contenus sans l’autorisation expresse et écrite du titulaire est interdite, sauf autorisation légale.",
      p3: "L’utilisateur peut consulter et, le cas échéant, réaliser des copies privées des contenus pour un usage strictement personnel et non commercial, à condition de ne pas supprimer les mentions de droits de propriété intellectuelle.",
    },
    s4: {
      h: "4. Conditions d’utilisation",
      p: "L’utilisateur s’engage à :",
      items: [
        "Utiliser le Site conformément à la loi, à la morale, à l’ordre public et aux présentes mentions légales.",
        "Ne pas réaliser d’activités illicites, frauduleuses ou portant atteinte aux droits de tiers.",
        "Ne pas introduire de virus, de logiciels malveillants ni tout autre code nuisible susceptible d’endommager les systèmes du Site.",
        "Ne pas tenter d’accéder sans autorisation aux zones restreintes du Site.",
        "Ne pas utiliser le Site à des fins commerciales sans le consentement exprès du titulaire.",
      ],
    },
    s5: {
      h: "5. Clause de non-responsabilité",
      p: "Aizüa décline toute responsabilité pour les dommages résultant de :",
      items: [
        "Interruptions, erreurs techniques ou défaillances d’accès au Site dues à des causes extérieures.",
        "La présence de virus ou d’autres éléments susceptibles d’endommager les systèmes informatiques de l’utilisateur.",
        "L’utilisation du Site par des mineurs sans la surveillance de leurs représentants légaux.",
        "Les contenus des pages de tiers liées depuis le Site.",
        "Les dommages résultant de l’interruption temporaire ou définitive du service.",
      ],
      nota: "Le titulaire ne garantit pas la disponibilité continue du Site et se réserve le droit de le suspendre ou de le modifier lorsqu’il l’estime nécessaire, sans préavis.",
    },
    s6: {
      h: "6. Droit applicable et juridiction",
      p: "Les présentes mentions légales sont régies par le droit espagnol, en particulier par :",
      items: [
        "Loi 34/2002 du 11 juillet, relative aux services de la société de l’information et au commerce électronique (LSSI-CE).",
        "Décret royal législatif 1/2007 (TRLGDCU) — protection des consommateurs et des usagers.",
        "Règlement (UE) 2016/679 (RGPD) — protection des données personnelles.",
      ],
      nota: "Pour la résolution de tout litige découlant de l’accès au Site ou de son utilisation, les parties se soumettent aux tribunaux du domicile de l’utilisateur, sauf disposition légale contraire.",
    },
    s7: {
      h: "7. Modifications des mentions légales",
      p: "Aizüa se réserve le droit de modifier les présentes mentions légales à tout moment. Les modifications entrent en vigueur dès leur publication sur le Site. Il est recommandé à l’utilisateur de consulter périodiquement cet avis afin d’être informé des éventuels changements.",
    },
  },

  de: {
    metaTitle: "Impressum",
    metaDesc: "Impressum von AizuaBeauty: Angaben zum Inhaber, Nutzungsbedingungen, geistiges Eigentum, Haftungsausschluss und anwendbares Recht.",
    h1: "Impressum",
    actualizado: "Letzte Aktualisierung: März 2026",
    s1: {
      h: "1. Angaben zum Inhaber",
      p: "Gemäß Artikel 10 des spanischen Gesetzes 34/2002 vom 11. Juli über Dienste der Informationsgesellschaft und den elektronischen Geschäftsverkehr (LSSI-CE) werden die folgenden Angaben gemacht:",
      titular: "Inhaber:", actividad: "Tätigkeit:",
      actividadV: "E-Commerce sowie Beratungs- und Schulungsdienstleistungen",
      nif: "Steuernummer (NIF):", nifV: "Beim Inhaber vorliegend (auf Verlangen einer zuständigen Behörde verfügbar)",
      domicilio: "Steuerlicher Sitz:", domicilioV: "Spanien",
      email: "E-Mail:", web: "Website:",
    },
    s2: {
      h: "2. Gegenstand und Anwendungsbereich",
      p1a: "Dieses Impressum regelt den Zugang zu und die Nutzung der Website von AizuaBeauty (im Folgenden",
      sitio: "„die Website“",
      p1b: "), Eigentum von Aizüa. Der Zugang zur Website bedeutet die vollständige und vorbehaltlose Annahme dieser Bedingungen.",
      p2: "Dieses Impressum gilt für alle Nutzer, die auf die Website zugreifen oder sie nutzen, unabhängig von ihrem Wohnsitzland oder dem Zweck ihres Besuchs.",
    },
    s3: {
      h: "3. Geistiges und gewerbliches Eigentum",
      p1: "Alle Inhalte der Website — einschließlich Texte, Bilder, Logos, Marken, Designs, Quellcode und Multimedia-Elemente — sind Eigentum von Aizüa oder Dritter, die deren Nutzung genehmigt haben, und durch die geltenden Vorschriften zum geistigen und gewerblichen Eigentum geschützt.",
      p2: "Die vollständige oder teilweise Vervielfältigung, Verbreitung, öffentliche Wiedergabe oder Bearbeitung dieser Inhalte ohne ausdrückliche schriftliche Genehmigung des Inhabers ist untersagt, sofern das Gesetz dies nicht erlaubt.",
      p3: "Der Nutzer darf die Inhalte ansehen und gegebenenfalls private Kopien ausschließlich für persönliche, nicht kommerzielle Zwecke anfertigen, sofern die Hinweise auf Rechte des geistigen Eigentums nicht entfernt werden.",
    },
    s4: {
      h: "4. Nutzungsbedingungen",
      p: "Der Nutzer verpflichtet sich:",
      items: [
        "Die Website im Einklang mit dem Gesetz, den guten Sitten, der öffentlichen Ordnung und diesem Impressum zu nutzen.",
        "Keine rechtswidrigen oder betrügerischen Handlungen vorzunehmen und keine Rechte Dritter zu verletzen.",
        "Keine Viren, Malware oder anderen Schadcode einzubringen, der die Systeme der Website beeinträchtigen könnte.",
        "Nicht ohne Berechtigung zu versuchen, auf gesperrte Bereiche der Website zuzugreifen.",
        "Die Website nicht ohne ausdrückliche Zustimmung des Inhabers zu kommerziellen Zwecken zu nutzen.",
      ],
    },
    s5: {
      h: "5. Haftungsausschluss",
      p: "Aizüa haftet nicht für Schäden, die sich aus Folgendem ergeben:",
      items: [
        "Unterbrechungen, technische Fehler oder Zugriffsstörungen der Website aus fremden Ursachen.",
        "Das Vorhandensein von Viren oder anderen Elementen, die Schäden an den Computersystemen des Nutzers verursachen könnten.",
        "Die Nutzung der Website durch Minderjährige ohne Aufsicht ihrer Erziehungsberechtigten.",
        "Die Inhalte von Seiten Dritter, die von der Website aus verlinkt sind.",
        "Schäden infolge einer vorübergehenden oder endgültigen Unterbrechung des Dienstes.",
      ],
      nota: "Der Inhaber garantiert keine dauerhafte Verfügbarkeit der Website und behält sich das Recht vor, sie ohne Vorankündigung auszusetzen oder zu ändern, wenn er es für erforderlich hält.",
    },
    s6: {
      h: "6. Anwendbares Recht und Gerichtsstand",
      p: "Dieses Impressum unterliegt spanischem Recht, insbesondere:",
      items: [
        "Gesetz 34/2002 vom 11. Juli über Dienste der Informationsgesellschaft und den elektronischen Geschäftsverkehr (LSSI-CE).",
        "Königliches Gesetzesdekret 1/2007 (TRLGDCU) — Verbraucherschutz.",
        "Verordnung (EU) 2016/679 (DSGVO) — Schutz personenbezogener Daten.",
      ],
      nota: "Für die Beilegung von Streitigkeiten aus dem Zugang zur Website oder deren Nutzung unterwerfen sich die Parteien den Gerichten des Wohnsitzes des Nutzers, sofern das Gesetz nichts anderes bestimmt.",
    },
    s7: {
      h: "7. Änderungen des Impressums",
      p: "Aizüa behält sich das Recht vor, dieses Impressum jederzeit zu ändern. Änderungen treten mit ihrer Veröffentlichung auf der Website in Kraft. Dem Nutzer wird empfohlen, diesen Hinweis regelmäßig zu prüfen, um über etwaige Änderungen informiert zu bleiben.",
    },
  },

  pt: {
    metaTitle: "Aviso Legal",
    metaDesc: "Aviso legal da AizuaBeauty: dados do titular, condições de utilização, propriedade intelectual, exclusão de responsabilidade e legislação aplicável.",
    h1: "Aviso Legal",
    actualizado: "Última atualização: março de 2026",
    s1: {
      h: "1. Dados do titular",
      p: "Em cumprimento do artigo 10 da Lei espanhola 34/2002, de 11 de julho, de serviços da sociedade da informação e do comércio eletrónico (LSSI-CE), informam-se os seguintes dados identificativos:",
      titular: "Titular:", actividad: "Atividade:",
      actividadV: "Comércio eletrónico e serviços de consultoria/formação",
      nif: "NIF:", nifV: "Na posse do titular (disponível a pedido de autoridade competente)",
      domicilio: "Domicílio fiscal:", domicilioV: "Espanha",
      email: "Correio eletrónico:", web: "Site:",
    },
    s2: {
      h: "2. Objeto e âmbito de aplicação",
      p1a: "O presente Aviso Legal regula o acesso e a utilização do site da AizuaBeauty (doravante,",
      sitio: "«o Site»",
      p1b: "), propriedade da Aizüa. O acesso ao Site implica a aceitação plena e sem reservas das presentes condições.",
      p2: "O presente Aviso Legal aplica-se a todos os utilizadores que acedam ou utilizem o Site, independentemente do seu país de residência ou da finalidade da sua visita.",
    },
    s3: {
      h: "3. Propriedade intelectual e industrial",
      p1: "Todos os conteúdos do Site — incluindo textos, imagens, logótipos, marcas, desenhos, código-fonte e elementos multimédia — são propriedade da Aizüa ou de terceiros que autorizaram a sua utilização, e estão protegidos pela legislação vigente em matéria de propriedade intelectual e industrial.",
      p2: "É proibida a reprodução, distribuição, comunicação pública ou transformação total ou parcial desses conteúdos sem autorização expressa e por escrito do titular, salvo quando a lei o permita.",
      p3: "O utilizador pode visualizar e, se aplicável, realizar cópias privadas dos conteúdos para uso exclusivamente pessoal e não comercial, desde que não sejam suprimidas as indicações de direitos de propriedade intelectual.",
    },
    s4: {
      h: "4. Condições de utilização",
      p: "O utilizador compromete-se a:",
      items: [
        "Utilizar o Site em conformidade com a lei, a moral, a ordem pública e o presente Aviso Legal.",
        "Não realizar atividades ilícitas, fraudulentas ou lesivas dos direitos de terceiros.",
        "Não introduzir vírus, malware ou qualquer outro código nocivo que possa prejudicar os sistemas do Site.",
        "Não tentar aceder a áreas restritas do Site sem autorização.",
        "Não usar o Site com fins comerciais sem o consentimento expresso do titular.",
      ],
    },
    s5: {
      h: "5. Exclusão de responsabilidade",
      p: "A Aizüa não se responsabiliza pelos danos e prejuízos decorrentes de:",
      items: [
        "Interrupções, erros técnicos ou falhas no acesso ao Site devidas a causas alheias.",
        "A presença de vírus ou outros elementos que possam causar danos nos sistemas informáticos do utilizador.",
        "A utilização do Site por menores de idade sem supervisão dos seus representantes legais.",
        "Os conteúdos de páginas de terceiros ligadas a partir do Site.",
        "Os danos decorrentes da interrupção temporária ou definitiva do serviço.",
      ],
      nota: "O titular não garante a disponibilidade contínua do Site e reserva-se o direito de o suspender ou modificar quando o considerar necessário, sem aviso prévio.",
    },
    s6: {
      h: "6. Legislação aplicável e jurisdição",
      p: "O presente Aviso Legal rege-se pela legislação espanhola, em particular por:",
      items: [
        "Lei 34/2002, de 11 de julho, de serviços da sociedade da informação e do comércio eletrónico (LSSI-CE).",
        "Real Decreto Legislativo 1/2007 (TRLGDCU) — proteção de consumidores e utilizadores.",
        "Regulamento (UE) 2016/679 (RGPD) — proteção de dados pessoais.",
      ],
      nota: "Para a resolução de qualquer conflito decorrente do acesso ou utilização do Site, as partes submetem-se aos Juízos e Tribunais do domicílio do utilizador, salvo disposição legal em contrário.",
    },
    s7: {
      h: "7. Alterações do aviso legal",
      p: "A Aizüa reserva-se o direito de alterar o presente Aviso Legal em qualquer momento. As alterações entram em vigor a partir da sua publicação no Site. Recomenda-se ao utilizador que reveja periodicamente este aviso para se manter informado de eventuais alterações.",
    },
  },

  it: {
    metaTitle: "Note legali",
    metaDesc: "Note legali di AizuaBeauty: dati del titolare, condizioni d’uso, proprietà intellettuale, esclusione di responsabilità e legge applicabile.",
    h1: "Note legali",
    actualizado: "Ultimo aggiornamento: marzo 2026",
    s1: {
      h: "1. Dati del titolare",
      p: "In adempimento dell’articolo 10 della legge spagnola 34/2002, dell’11 luglio, sui servizi della società dell’informazione e sul commercio elettronico (LSSI-CE), si comunicano i seguenti dati identificativi:",
      titular: "Titolare:", actividad: "Attività:",
      actividadV: "Commercio elettronico e servizi di consulenza/formazione",
      nif: "NIF (codice fiscale):", nifV: "In possesso del titolare (disponibile su richiesta di autorità competente)",
      domicilio: "Domicilio fiscale:", domicilioV: "Spagna",
      email: "Email:", web: "Sito web:",
    },
    s2: {
      h: "2. Oggetto e ambito di applicazione",
      p1a: "Le presenti note legali disciplinano l’accesso e l’uso del sito web di AizuaBeauty (di seguito,",
      sitio: "«il Sito»",
      p1b: "), di proprietà di Aizüa. L’accesso al Sito comporta l’accettazione piena e senza riserve delle presenti condizioni.",
      p2: "Le presenti note legali si applicano a tutti gli utenti che accedono al Sito o lo utilizzano, indipendentemente dal loro paese di residenza o dalla finalità della visita.",
    },
    s3: {
      h: "3. Proprietà intellettuale e industriale",
      p1: "Tutti i contenuti del Sito — inclusi testi, immagini, loghi, marchi, design, codice sorgente ed elementi multimediali — sono di proprietà di Aizüa o di terzi che ne hanno autorizzato l’uso, e sono protetti dalla normativa vigente in materia di proprietà intellettuale e industriale.",
      p2: "È vietata la riproduzione, distribuzione, comunicazione al pubblico o trasformazione, totale o parziale, di tali contenuti senza l’autorizzazione espressa e scritta del titolare, salvo quando la legge lo consenta.",
      p3: "L’utente può visualizzare e, ove applicabile, effettuare copie private dei contenuti per uso esclusivamente personale e non commerciale, purché non vengano rimosse le indicazioni relative ai diritti di proprietà intellettuale.",
    },
    s4: {
      h: "4. Condizioni d’uso",
      p: "L’utente si impegna a:",
      items: [
        "Utilizzare il Sito in conformità alla legge, alla morale, all’ordine pubblico e alle presenti note legali.",
        "Non svolgere attività illecite, fraudolente o lesive dei diritti di terzi.",
        "Non introdurre virus, malware o qualsiasi altro codice dannoso che possa compromettere i sistemi del Sito.",
        "Non tentare di accedere ad aree riservate del Sito senza autorizzazione.",
        "Non utilizzare il Sito per finalità commerciali senza il consenso espresso del titolare.",
      ],
    },
    s5: {
      h: "5. Esclusione di responsabilità",
      p: "Aizüa non è responsabile dei danni derivanti da:",
      items: [
        "Interruzioni, errori tecnici o guasti nell’accesso al Sito dovuti a cause esterne.",
        "La presenza di virus o altri elementi che potrebbero causare danni ai sistemi informatici dell’utente.",
        "L’uso del Sito da parte di minori senza la supervisione dei loro tutori legali.",
        "I contenuti di pagine di terzi collegate dal Sito.",
        "I danni derivanti dall’interruzione temporanea o definitiva del servizio.",
      ],
      nota: "Il titolare non garantisce la disponibilità continua del Sito e si riserva il diritto di sospenderlo o modificarlo quando lo ritenga necessario, senza preavviso.",
    },
    s6: {
      h: "6. Legge applicabile e giurisdizione",
      p: "Le presenti note legali sono disciplinate dalla legge spagnola, in particolare da:",
      items: [
        "Legge 34/2002, dell’11 luglio, sui servizi della società dell’informazione e sul commercio elettronico (LSSI-CE).",
        "Regio Decreto Legislativo 1/2007 (TRLGDCU) — tutela dei consumatori e degli utenti.",
        "Regolamento (UE) 2016/679 (GDPR) — protezione dei dati personali.",
      ],
      nota: "Per la risoluzione di qualsiasi controversia derivante dall’accesso o dall’uso del Sito, le parti si sottomettono ai Tribunali del domicilio dell’utente, salvo diversa disposizione di legge.",
    },
    s7: {
      h: "7. Modifiche delle note legali",
      p: "Aizüa si riserva il diritto di modificare le presenti note legali in qualsiasi momento. Le modifiche entrano in vigore dalla loro pubblicazione sul Sito. Si raccomanda all’utente di consultare periodicamente il presente avviso per essere informato di eventuali cambiamenti.",
    },
  },
};

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const base = "https://beauty.aizualabs.com";
  const l = pick(params.locale);
  const t = T[l];
  const url = `${base}/${l}/legal/aviso-legal`;
  return {
    title: t.metaTitle,
    description: t.metaDesc,
    alternates: {
      canonical: url,
      languages: {
        ...Object.fromEntries(LOCALES.map((x) => [x, `${base}/${x}/legal/aviso-legal`])),
        "x-default": `${base}/es/legal/aviso-legal`,
      },
    },
    // s236: ver nota en legal/privacidad/page.tsx — mismo fix, mismo motivo.
    openGraph: {
      title: t.metaTitle,
      description: t.metaDesc,
      url,
      type: "website",
      siteName: "AizuaBeauty",
      locale: OG_LOCALE[l],
      images: [{ url: `${base}/og-home.jpg`, width: 1200, height: 630, alt: "AizuaBeauty — Natural Beauty & Fashion" }],
    },
  };
}

export const dynamic = "force-dynamic";

const H2 = "text-xl font-semibold text-gray-800 mb-3";
const UL = "list-disc pl-5 space-y-1 text-sm";

export default async function AvisoLegalPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  const l = pick(params.locale);
  const t = T[l];

  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-gray-700">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.h1}</h1>
      <p className="text-sm text-gray-400 mb-10">{t.actualizado}</p>

      <section className="mb-8">
        <h2 className={H2}>{t.s1.h}</h2>
        <p className="mb-2">{t.s1.p}</p>
        <ul className="list-none space-y-1 text-sm">
          <li><strong>{t.s1.titular}</strong> Aizüa</li>
          <li><strong>{t.s1.actividad}</strong> {t.s1.actividadV}</li>
          <li><strong>{t.s1.nif}</strong> {t.s1.nifV}</li>
          <li><strong>{t.s1.domicilio}</strong> {t.s1.domicilioV}</li>
          <li><strong>{t.s1.email}</strong> info@aizualabs.com</li>
          <li><strong>{t.s1.web}</strong> https://beauty.aizualabs.com</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className={H2}>{t.s2.h}</h2>
        <p className="mb-2">{t.s2.p1a} {t.s2.sitio}{t.s2.p1b}</p>
        <p>{t.s2.p2}</p>
      </section>

      <section className="mb-8">
        <h2 className={H2}>{t.s3.h}</h2>
        <p className="mb-2">{t.s3.p1}</p>
        <p className="mb-2">{t.s3.p2}</p>
        <p>{t.s3.p3}</p>
      </section>

      <section className="mb-8">
        <h2 className={H2}>{t.s4.h}</h2>
        <p className="mb-2">{t.s4.p}</p>
        <ul className={UL}>{t.s4.items.map((x) => <li key={x}>{x}</li>)}</ul>
      </section>

      <section className="mb-8">
        <h2 className={H2}>{t.s5.h}</h2>
        <p className="mb-2">{t.s5.p}</p>
        <ul className={UL}>{t.s5.items.map((x) => <li key={x}>{x}</li>)}</ul>
        <p className="mt-2">{t.s5.nota}</p>
      </section>

      <section className="mb-8">
        <h2 className={H2}>{t.s6.h}</h2>
        <p className="mb-2">{t.s6.p}</p>
        <ul className={UL}>{t.s6.items.map((x) => <li key={x}>{x}</li>)}</ul>
        <p className="mt-2">{t.s6.nota}</p>
      </section>

      <section className="mb-8">
        <h2 className={H2}>{t.s7.h}</h2>
        <p>{t.s7.p}</p>
      </section>
    </main>
  );
}
