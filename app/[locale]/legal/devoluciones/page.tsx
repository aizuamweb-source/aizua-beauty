/**
 * Política de Devoluciones — AizuaBeauty, en los 6 idiomas.
 *
 * ⚠️ NO es una sustitución ciega desde Aizua-store: esta tienda tiene una nota
 * de depreciación PROPIA. En cosmética, los productos precintados por higiene
 * son el caso habitual y no una excepción teórica, así que la nota lo dice
 * expresamente en los seis idiomas en vez de dejarlo solo en el art. 103 del
 * apartado 5. El resto del documento sí es común con Aizua-store.
 *
 * ⚠️ LA GARANTÍA SON 3 AÑOS (RD-ley 7/2021, Directiva UE 2019/771), no 2.
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

type Item = [negrita: string, resto: string];

interface Textos {
  metaTitle: string;
  metaDesc: string;
  h1: string;
  actualizado: string;
  s1: { h: string; p1a: string; dias: string; p1b: string; p2a: string; p2b: string };
  s2: { h: string; p: string; items: string[]; notaB: string; notaResto: string };
  s3: { h: string; pasos: Item[] };
  s4: { h: string; p1a: string; horas: string; p1b: string; items: string[]; p2: string };
  s5: { h: string; p: string; items: string[] };
  s6: { h: string; p: string; items: string[] };
  s7: { h: string; p1: string; anios: string; p2: string };
  s8: { h: string; p1: string; p2: string };
}

const T: Record<Loc, Textos> = {
  es: {
    metaTitle: "Política de Devoluciones",
    metaDesc: "Política de devoluciones y garantías de AizuaBeauty: plazos, condiciones del producto, reembolsos y cómo tramitar tu solicitud de cambio.",
    h1: "Política de Devoluciones",
    actualizado: "Última actualización: marzo 2026",
    s1: {
      h: "1. Derecho de desistimiento",
      p1a: "De acuerdo con la Directiva 2011/83/UE del Parlamento Europeo y el Real Decreto Legislativo 1/2007 (TRLGDCU), tienes derecho a desistir del contrato de compra en un plazo de",
      dias: "14 días naturales",
      p1b: "desde la recepción del producto, sin necesidad de indicar el motivo.",
      p2a: "Para ejercer el derecho de desistimiento, debes comunicárnoslo antes de que venza dicho plazo, enviando un correo electrónico a",
      p2b: "con tu nombre, número de pedido y la indicación de que deseas ejercer el derecho de desistimiento.",
    },
    s2: {
      h: "2. Condiciones para la devolución",
      p: "Para que la devolución sea aceptada, el producto debe cumplir las siguientes condiciones:",
      items: [
        "Estar en su estado original, sin usar, y con su embalaje original intacto.",
        "Incluir todos los accesorios, manuales y elementos que se entregaron con el pedido.",
        "No haber sido personalizado o fabricado según especificaciones del cliente.",
        "No pertenecer a la categoría de productos excluidos del derecho de desistimiento (ver sección 5).",
      ],
      notaB: "Nota sobre depreciación (Art. 107.2 TRLGDCU):",
      notaResto: "Si el producto ha sido manipulado más allá de lo necesario para comprobar sus características, podremos deducir del reembolso la pérdida de valor correspondiente. Los cosméticos y artículos de higiene personal cuyo precinto haya sido retirado quedan excluidos del derecho de desistimiento (ver sección 5).",
    },
    s3: {
      h: "3. Proceso de devolución",
      pasos: [
        ["Solicitud:", "Envía un correo a info@aizualabs.com indicando tu número de pedido y el motivo de la devolución (opcional pero útil para mejorar nuestro servicio)."],
        ["Confirmación:", "Te enviaremos instrucciones de devolución en un plazo de 48 horas laborables desde la recepción de tu solicitud."],
        ["Envío del producto:", "Deberás enviarnos el producto de vuelta utilizando un servicio de envío con seguimiento. Los gastos de devolución corren a cargo del comprador, salvo que el producto sea defectuoso o el error sea nuestro."],
        ["Inspección:", "Una vez recibido el producto, lo inspeccionaremos en un plazo de 5 días laborables."],
        ["Reembolso:", "Si la devolución cumple las condiciones, procederemos al reembolso en un plazo máximo de 14 días desde la recepción del producto, utilizando el mismo método de pago original."],
      ],
    },
    s4: {
      h: "4. Productos defectuosos o incorrectos",
      p1a: "Si recibes un producto defectuoso, dañado durante el transporte o diferente al pedido, debes notificárnoslo en un plazo de",
      horas: "48 horas",
      p1b: "desde la recepción mediante correo electrónico a info@aizualabs.com, adjuntando:",
      items: [
        "Número de pedido.",
        "Descripción del problema.",
        "Fotografías del producto y del embalaje (especialmente si hay daños visibles).",
      ],
      p2: "En este caso, correremos con todos los gastos de devolución y te enviaremos un producto de sustitución o te reembolsaremos el importe total, según tu preferencia.",
    },
    s5: {
      h: "5. Exclusiones del derecho de desistimiento",
      p: "De acuerdo con el artículo 103 del TRLGDCU, el derecho de desistimiento no se aplica a:",
      items: [
        "Productos personalizados o fabricados según las especificaciones del cliente.",
        "Productos que puedan deteriorarse o caducar con rapidez.",
        "Productos sellados que no sean aptos para ser devueltos por razones de protección de la salud o higiene, cuando hayan sido abiertos tras la entrega.",
        "Contenido digital descargado con el consentimiento expreso del consumidor (cursos, ebooks).",
      ],
    },
    s6: {
      h: "6. Reembolsos",
      p: "Los reembolsos se realizarán utilizando el mismo medio de pago que el empleado en la transacción original, salvo acuerdo expreso en contrario.",
      items: [
        "Pagos con tarjeta (Stripe): el reembolso aparecerá en tu extracto en un plazo de 5-10 días hábiles, dependiendo de tu banco.",
        "Los gastos de envío originales solo se reembolsarán si la devolución se debe a un error nuestro o a un producto defectuoso.",
      ],
    },
    s7: {
      h: "7. Garantía legal",
      p1: "Todos los productos vendidos en AizuaBeauty gozan de la garantía legal de conformidad de",
      anios: "3 años",
      p2: "establecida por el Real Decreto-ley 7/2021, que traspone la Directiva (UE) 2019/771. Si el producto presenta un defecto de conformidad en ese plazo, podrás solicitar la reparación, sustitución, reducción del precio o resolución del contrato según los casos.",
    },
    s8: {
      h: "8. Contacto",
      p1: "Para cualquier consulta sobre devoluciones, contacta con nosotros en",
      p2: ". Nuestro tiempo de respuesta habitual es de 24-48 horas laborables.",
    },
  },

  en: {
    metaTitle: "Returns Policy",
    metaDesc: "AizuaBeauty returns and warranty policy: deadlines, product conditions, refunds and how to submit your return request.",
    h1: "Returns Policy",
    actualizado: "Last updated: March 2026",
    s1: {
      h: "1. Right of withdrawal",
      p1a: "In accordance with Directive 2011/83/EU of the European Parliament and Spanish Royal Legislative Decree 1/2007 (TRLGDCU), you have the right to withdraw from the purchase contract within",
      dias: "14 calendar days",
      p1b: "of receiving the product, without giving any reason.",
      p2a: "To exercise the right of withdrawal, you must notify us before that period expires by sending an email to",
      p2b: "with your name, order number and a statement that you wish to exercise the right of withdrawal.",
    },
    s2: {
      h: "2. Conditions for returns",
      p: "For a return to be accepted, the product must meet the following conditions:",
      items: [
        "Be in its original condition, unused, and with its original packaging intact.",
        "Include all accessories, manuals and items delivered with the order.",
        "Not have been personalised or made to the customer’s specifications.",
        "Not belong to the categories of products excluded from the right of withdrawal (see section 5).",
      ],
      notaB: "Note on depreciation (art. 107.2 TRLGDCU):",
      notaResto: "If the product has been handled beyond what is necessary to check its characteristics, we may deduct the corresponding loss of value from the refund. Cosmetics and personal hygiene items whose seal has been removed are excluded from the right of withdrawal (see section 5).",
    },
    s3: {
      h: "3. Returns process",
      pasos: [
        ["Request:", "Send an email to info@aizualabs.com stating your order number and the reason for the return (optional, but useful for improving our service)."],
        ["Confirmation:", "We will send you return instructions within 48 business hours of receiving your request."],
        ["Sending the product:", "You must send the product back to us using a tracked shipping service. Return shipping costs are borne by the buyer, unless the product is defective or the error is ours."],
        ["Inspection:", "Once we receive the product, we will inspect it within 5 business days."],
        ["Refund:", "If the return meets the conditions, we will issue the refund within a maximum of 14 days from receipt of the product, using the same original payment method."],
      ],
    },
    s4: {
      h: "4. Defective or incorrect products",
      p1a: "If you receive a product that is defective, damaged in transit or different from the one ordered, you must notify us within",
      horas: "48 hours",
      p1b: "of receipt by email to info@aizualabs.com, attaching:",
      items: [
        "Order number.",
        "Description of the problem.",
        "Photographs of the product and the packaging (especially if there is visible damage).",
      ],
      p2: "In this case, we will cover all return shipping costs and will either send you a replacement product or refund the full amount, as you prefer.",
    },
    s5: {
      h: "5. Exclusions from the right of withdrawal",
      p: "In accordance with article 103 of the TRLGDCU, the right of withdrawal does not apply to:",
      items: [
        "Products personalised or made to the customer’s specifications.",
        "Products liable to deteriorate or expire rapidly.",
        "Sealed products which are not suitable for return for health protection or hygiene reasons, where they have been opened after delivery.",
        "Digital content downloaded with the consumer’s express consent (courses, ebooks).",
      ],
    },
    s6: {
      h: "6. Refunds",
      p: "Refunds will be issued using the same means of payment used in the original transaction, unless expressly agreed otherwise.",
      items: [
        "Card payments (Stripe): the refund will appear on your statement within 5-10 business days, depending on your bank.",
        "Original shipping costs will only be refunded if the return is due to an error on our part or to a defective product.",
      ],
    },
    s7: {
      h: "7. Legal warranty",
      p1: "All products sold in AizuaBeauty are covered by the legal warranty of conformity of",
      anios: "3 years",
      p2: "established by Spanish Royal Decree-Law 7/2021, which transposes Directive (EU) 2019/771. If the product shows a lack of conformity within that period, you may request repair, replacement, a price reduction or termination of the contract, as applicable.",
    },
    s8: {
      h: "8. Contact",
      p1: "For any queries about returns, contact us at",
      p2: ". Our usual response time is 24-48 business hours.",
    },
  },

  fr: {
    metaTitle: "Politique de retours",
    metaDesc: "Politique de retours et de garantie d’AizuaBeauty : délais, état du produit, remboursements et comment effectuer votre demande.",
    h1: "Politique de retours",
    actualizado: "Dernière mise à jour : mars 2026",
    s1: {
      h: "1. Droit de rétractation",
      p1a: "Conformément à la directive 2011/83/UE du Parlement européen et au décret royal législatif espagnol 1/2007 (TRLGDCU), vous avez le droit de vous rétracter du contrat d’achat dans un délai de",
      dias: "14 jours calendaires",
      p1b: "à compter de la réception du produit, sans avoir à motiver votre décision.",
      p2a: "Pour exercer le droit de rétractation, vous devez nous en informer avant l’expiration de ce délai, en envoyant un e-mail à",
      p2b: "avec votre nom, votre numéro de commande et l’indication que vous souhaitez exercer le droit de rétractation.",
    },
    s2: {
      h: "2. Conditions de retour",
      p: "Pour que le retour soit accepté, le produit doit remplir les conditions suivantes :",
      items: [
        "Être dans son état d’origine, non utilisé, et avec son emballage d’origine intact.",
        "Inclure tous les accessoires, manuels et éléments livrés avec la commande.",
        "Ne pas avoir été personnalisé ni fabriqué selon les spécifications du client.",
        "Ne pas appartenir aux catégories de produits exclues du droit de rétractation (voir section 5).",
      ],
      notaB: "Note sur la dépréciation (art. 107.2 TRLGDCU) :",
      notaResto: "Si le produit a été manipulé au-delà de ce qui est nécessaire pour vérifier ses caractéristiques, nous pourrons déduire du remboursement la perte de valeur correspondante. Les cosmétiques et articles d’hygiène personnelle dont le scellé a été retiré sont exclus du droit de rétractation (voir section 5).",
    },
    s3: {
      h: "3. Procédure de retour",
      pasos: [
        ["Demande :", "Envoyez un e-mail à info@aizualabs.com en indiquant votre numéro de commande et le motif du retour (facultatif, mais utile pour améliorer notre service)."],
        ["Confirmation :", "Nous vous enverrons les instructions de retour dans un délai de 48 heures ouvrables à compter de la réception de votre demande."],
        ["Envoi du produit :", "Vous devrez nous renvoyer le produit via un service d’expédition avec suivi. Les frais de retour sont à la charge de l’acheteur, sauf si le produit est défectueux ou si l’erreur vient de nous."],
        ["Inspection :", "Dès réception du produit, nous l’inspecterons dans un délai de 5 jours ouvrables."],
        ["Remboursement :", "Si le retour remplit les conditions, nous procéderons au remboursement dans un délai maximum de 14 jours à compter de la réception du produit, en utilisant le même moyen de paiement d’origine."],
      ],
    },
    s4: {
      h: "4. Produits défectueux ou incorrects",
      p1a: "Si vous recevez un produit défectueux, endommagé pendant le transport ou différent de celui commandé, vous devez nous le signaler dans un délai de",
      horas: "48 heures",
      p1b: "à compter de la réception, par e-mail à info@aizualabs.com, en joignant :",
      items: [
        "Numéro de commande.",
        "Description du problème.",
        "Photographies du produit et de l’emballage (en particulier en cas de dommages visibles).",
      ],
      p2: "Dans ce cas, nous prendrons en charge l’ensemble des frais de retour et vous enverrons un produit de remplacement ou vous rembourserons le montant total, selon votre préférence.",
    },
    s5: {
      h: "5. Exclusions du droit de rétractation",
      p: "Conformément à l’article 103 du TRLGDCU, le droit de rétractation ne s’applique pas :",
      items: [
        "Aux produits personnalisés ou fabriqués selon les spécifications du client.",
        "Aux produits susceptibles de se détériorer ou de périmer rapidement.",
        "Aux produits scellés qui ne peuvent être retournés pour des raisons de protection de la santé ou d’hygiène, lorsqu’ils ont été ouverts après la livraison.",
        "Au contenu numérique téléchargé avec le consentement exprès du consommateur (cours, ebooks).",
      ],
    },
    s6: {
      h: "6. Remboursements",
      p: "Les remboursements seront effectués en utilisant le même moyen de paiement que celui employé lors de la transaction d’origine, sauf accord exprès contraire.",
      items: [
        "Paiements par carte (Stripe) : le remboursement apparaîtra sur votre relevé dans un délai de 5 à 10 jours ouvrables, selon votre banque.",
        "Les frais d’expédition initiaux ne seront remboursés que si le retour est dû à une erreur de notre part ou à un produit défectueux.",
      ],
    },
    s7: {
      h: "7. Garantie légale",
      p1: "Tous les produits vendus sur AizuaBeauty bénéficient de la garantie légale de conformité de",
      anios: "3 ans",
      p2: "établie par le décret-loi royal espagnol 7/2021, qui transpose la directive (UE) 2019/771. Si le produit présente un défaut de conformité pendant ce délai, vous pourrez demander la réparation, le remplacement, une réduction du prix ou la résolution du contrat selon les cas.",
    },
    s8: {
      h: "8. Contact",
      p1: "Pour toute question concernant les retours, contactez-nous à",
      p2: ". Notre délai de réponse habituel est de 24 à 48 heures ouvrables.",
    },
  },

  de: {
    metaTitle: "Rückgaberichtlinie",
    metaDesc: "Rückgabe- und Gewährleistungsrichtlinie von AizuaBeauty: Fristen, Zustand des Produkts, Erstattungen und wie du deine Anfrage stellst.",
    h1: "Rückgaberichtlinie",
    actualizado: "Letzte Aktualisierung: März 2026",
    s1: {
      h: "1. Widerrufsrecht",
      p1a: "Gemäß der Richtlinie 2011/83/EU des Europäischen Parlaments und dem spanischen Königlichen Gesetzesdekret 1/2007 (TRLGDCU) hast du das Recht, vom Kaufvertrag innerhalb von",
      dias: "14 Kalendertagen",
      p1b: "nach Erhalt des Produkts zurückzutreten, ohne Angabe von Gründen.",
      p2a: "Um das Widerrufsrecht auszuüben, musst du uns vor Ablauf dieser Frist per E-Mail informieren an",
      p2b: "mit deinem Namen, deiner Bestellnummer und dem Hinweis, dass du das Widerrufsrecht ausüben möchtest.",
    },
    s2: {
      h: "2. Bedingungen für die Rückgabe",
      p: "Damit eine Rückgabe akzeptiert wird, muss das Produkt die folgenden Bedingungen erfüllen:",
      items: [
        "Im Originalzustand, unbenutzt und mit unbeschädigter Originalverpackung sein.",
        "Alle Zubehörteile, Handbücher und mit der Bestellung gelieferten Bestandteile enthalten.",
        "Nicht personalisiert oder nach Kundenspezifikation hergestellt worden sein.",
        "Nicht zu den vom Widerrufsrecht ausgeschlossenen Produktkategorien gehören (siehe Abschnitt 5).",
      ],
      notaB: "Hinweis zum Wertverlust (Art. 107.2 TRLGDCU):",
      notaResto: "Wenn das Produkt über das zur Prüfung seiner Eigenschaften notwendige Maß hinaus benutzt wurde, können wir den entsprechenden Wertverlust von der Erstattung abziehen. Kosmetika und Körperpflegeartikel, deren Versiegelung entfernt wurde, sind vom Widerrufsrecht ausgeschlossen (siehe Abschnitt 5).",
    },
    s3: {
      h: "3. Rückgabeverfahren",
      pasos: [
        ["Anfrage:", "Sende eine E-Mail an info@aizualabs.com mit deiner Bestellnummer und dem Grund für die Rückgabe (freiwillig, aber hilfreich für die Verbesserung unseres Service)."],
        ["Bestätigung:", "Wir senden dir die Rücksendeanweisungen innerhalb von 48 Arbeitsstunden nach Erhalt deiner Anfrage."],
        ["Versand des Produkts:", "Du musst uns das Produkt mit einem nachverfolgbaren Versanddienst zurücksenden. Die Rücksendekosten trägt der Käufer, es sei denn, das Produkt ist defekt oder der Fehler liegt bei uns."],
        ["Prüfung:", "Nach Erhalt des Produkts prüfen wir es innerhalb von 5 Arbeitstagen."],
        ["Erstattung:", "Erfüllt die Rückgabe die Bedingungen, erstatten wir den Betrag innerhalb von höchstens 14 Tagen nach Erhalt des Produkts über dasselbe ursprüngliche Zahlungsmittel."],
      ],
    },
    s4: {
      h: "4. Defekte oder falsche Produkte",
      p1a: "Wenn du ein defektes, beim Transport beschädigtes oder von der Bestellung abweichendes Produkt erhältst, musst du uns dies innerhalb von",
      horas: "48 Stunden",
      p1b: "nach Erhalt per E-Mail an info@aizualabs.com mitteilen und dabei Folgendes beifügen:",
      items: [
        "Bestellnummer.",
        "Beschreibung des Problems.",
        "Fotos des Produkts und der Verpackung (besonders bei sichtbaren Schäden).",
      ],
      p2: "In diesem Fall übernehmen wir alle Rücksendekosten und senden dir je nach Wunsch ein Ersatzprodukt oder erstatten den vollen Betrag.",
    },
    s5: {
      h: "5. Ausnahmen vom Widerrufsrecht",
      p: "Gemäß Artikel 103 TRLGDCU gilt das Widerrufsrecht nicht für:",
      items: [
        "Personalisierte oder nach Kundenspezifikation hergestellte Produkte.",
        "Produkte, die schnell verderben oder ablaufen können.",
        "Versiegelte Produkte, die aus Gründen des Gesundheitsschutzes oder der Hygiene nicht zur Rückgabe geeignet sind, wenn sie nach der Lieferung geöffnet wurden.",
        "Digitale Inhalte, die mit ausdrücklicher Zustimmung des Verbrauchers heruntergeladen wurden (Kurse, E-Books).",
      ],
    },
    s6: {
      h: "6. Erstattungen",
      p: "Erstattungen erfolgen über dasselbe Zahlungsmittel, das bei der ursprünglichen Transaktion verwendet wurde, sofern nicht ausdrücklich etwas anderes vereinbart wird.",
      items: [
        "Kartenzahlungen (Stripe): die Erstattung erscheint je nach Bank innerhalb von 5-10 Werktagen auf deinem Kontoauszug.",
        "Die ursprünglichen Versandkosten werden nur erstattet, wenn die Rückgabe auf einen Fehler unsererseits oder ein defektes Produkt zurückgeht.",
      ],
    },
    s7: {
      h: "7. Gesetzliche Gewährleistung",
      p1: "Für alle bei AizuaBeauty verkauften Produkte gilt die gesetzliche Gewährleistung für Vertragsmäßigkeit von",
      anios: "3 Jahren",
      p2: "gemäß dem spanischen Königlichen Gesetzesdekret 7/2021, das die Richtlinie (EU) 2019/771 umsetzt. Weist das Produkt in diesem Zeitraum einen Mangel auf, kannst du je nach Fall Reparatur, Ersatz, Preisminderung oder Vertragsauflösung verlangen.",
    },
    s8: {
      h: "8. Kontakt",
      p1: "Bei Fragen zu Rückgaben kontaktiere uns unter",
      p2: ". Unsere übliche Antwortzeit liegt bei 24-48 Arbeitsstunden.",
    },
  },

  pt: {
    metaTitle: "Política de Devoluções",
    metaDesc: "Política de devoluções e garantias da AizuaBeauty: prazos, condições do produto, reembolsos e como tratar o seu pedido.",
    h1: "Política de Devoluções",
    actualizado: "Última atualização: março de 2026",
    s1: {
      h: "1. Direito de livre resolução",
      p1a: "De acordo com a Diretiva 2011/83/UE do Parlamento Europeu e o Real Decreto Legislativo espanhol 1/2007 (TRLGDCU), tem direito a resolver o contrato de compra no prazo de",
      dias: "14 dias de calendário",
      p1b: "a contar da receção do produto, sem necessidade de indicar o motivo.",
      p2a: "Para exercer o direito de livre resolução, deve comunicá-lo antes de expirar esse prazo, enviando um email para",
      p2b: "com o seu nome, número de encomenda e a indicação de que deseja exercer o direito de livre resolução.",
    },
    s2: {
      h: "2. Condições para a devolução",
      p: "Para que a devolução seja aceite, o produto deve cumprir as seguintes condições:",
      items: [
        "Estar no seu estado original, sem uso, e com a embalagem original intacta.",
        "Incluir todos os acessórios, manuais e elementos entregues com a encomenda.",
        "Não ter sido personalizado ou fabricado segundo especificações do cliente.",
        "Não pertencer às categorias de produtos excluídas do direito de livre resolução (ver secção 5).",
      ],
      notaB: "Nota sobre depreciação (art. 107.2 TRLGDCU):",
      notaResto: "Se o produto tiver sido manipulado além do necessário para verificar as suas características, poderemos deduzir do reembolso a correspondente perda de valor. Os cosméticos e artigos de higiene pessoal cujo selo tenha sido retirado estão excluídos do direito de livre resolução (ver secção 5).",
    },
    s3: {
      h: "3. Processo de devolução",
      pasos: [
        ["Pedido:", "Envie um email para info@aizualabs.com indicando o número da encomenda e o motivo da devolução (opcional, mas útil para melhorarmos o serviço)."],
        ["Confirmação:", "Enviaremos as instruções de devolução no prazo de 48 horas úteis a contar da receção do seu pedido."],
        ["Envio do produto:", "Deverá enviar-nos o produto de volta através de um serviço de envio com seguimento. Os custos de devolução são suportados pelo comprador, salvo se o produto estiver defeituoso ou o erro for nosso."],
        ["Inspeção:", "Após a receção do produto, iremos inspecioná-lo no prazo de 5 dias úteis."],
        ["Reembolso:", "Se a devolução cumprir as condições, procederemos ao reembolso no prazo máximo de 14 dias a contar da receção do produto, utilizando o mesmo método de pagamento original."],
      ],
    },
    s4: {
      h: "4. Produtos defeituosos ou incorretos",
      p1a: "Se receber um produto defeituoso, danificado durante o transporte ou diferente do encomendado, deve notificar-nos no prazo de",
      horas: "48 horas",
      p1b: "a contar da receção, por email para info@aizualabs.com, anexando:",
      items: [
        "Número da encomenda.",
        "Descrição do problema.",
        "Fotografias do produto e da embalagem (especialmente se houver danos visíveis).",
      ],
      p2: "Neste caso, suportaremos todos os custos de devolução e enviaremos um produto de substituição ou reembolsaremos o valor total, conforme a sua preferência.",
    },
    s5: {
      h: "5. Exclusões do direito de livre resolução",
      p: "De acordo com o artigo 103 do TRLGDCU, o direito de livre resolução não se aplica a:",
      items: [
        "Produtos personalizados ou fabricados segundo as especificações do cliente.",
        "Produtos que possam deteriorar-se ou expirar rapidamente.",
        "Produtos selados que não sejam adequados para devolução por razões de proteção da saúde ou de higiene, quando tenham sido abertos após a entrega.",
        "Conteúdos digitais descarregados com o consentimento expresso do consumidor (cursos, ebooks).",
      ],
    },
    s6: {
      h: "6. Reembolsos",
      p: "Os reembolsos serão efetuados através do mesmo meio de pagamento utilizado na transação original, salvo acordo expresso em contrário.",
      items: [
        "Pagamentos com cartão (Stripe): o reembolso aparecerá no seu extrato no prazo de 5-10 dias úteis, dependendo do seu banco.",
        "Os custos de envio originais só serão reembolsados se a devolução resultar de um erro nosso ou de um produto defeituoso.",
      ],
    },
    s7: {
      h: "7. Garantia legal",
      p1: "Todos os produtos vendidos na AizuaBeauty beneficiam da garantia legal de conformidade de",
      anios: "3 anos",
      p2: "estabelecida pelo Real Decreto-Lei espanhol 7/2021, que transpõe a Diretiva (UE) 2019/771. Se o produto apresentar uma falta de conformidade nesse prazo, poderá solicitar a reparação, substituição, redução do preço ou resolução do contrato, conforme os casos.",
    },
    s8: {
      h: "8. Contacto",
      p1: "Para qualquer questão sobre devoluções, contacte-nos em",
      p2: ". O nosso tempo de resposta habitual é de 24-48 horas úteis.",
    },
  },

  it: {
    metaTitle: "Politica di reso",
    metaDesc: "Politica di reso e garanzia di AizuaBeauty: termini, condizioni del prodotto, rimborsi e come inviare la tua richiesta.",
    h1: "Politica di reso",
    actualizado: "Ultimo aggiornamento: marzo 2026",
    s1: {
      h: "1. Diritto di recesso",
      p1a: "Ai sensi della direttiva 2011/83/UE del Parlamento europeo e del Regio Decreto Legislativo spagnolo 1/2007 (TRLGDCU), hai il diritto di recedere dal contratto di acquisto entro",
      dias: "14 giorni di calendario",
      p1b: "dalla ricezione del prodotto, senza dover indicare alcuna motivazione.",
      p2a: "Per esercitare il diritto di recesso, devi comunicarcelo prima della scadenza di tale termine, inviando un’email a",
      p2b: "con il tuo nome, il numero d’ordine e l’indicazione che desideri esercitare il diritto di recesso.",
    },
    s2: {
      h: "2. Condizioni per il reso",
      p: "Perché il reso sia accettato, il prodotto deve soddisfare le seguenti condizioni:",
      items: [
        "Essere nelle condizioni originali, non utilizzato e con l’imballaggio originale intatto.",
        "Includere tutti gli accessori, i manuali e gli elementi consegnati con l’ordine.",
        "Non essere stato personalizzato o realizzato secondo le specifiche del cliente.",
        "Non appartenere alle categorie di prodotti esclusi dal diritto di recesso (vedi sezione 5).",
      ],
      notaB: "Nota sul deprezzamento (art. 107.2 TRLGDCU):",
      notaResto: "Se il prodotto è stato maneggiato oltre quanto necessario per verificarne le caratteristiche, potremo detrarre dal rimborso la corrispondente perdita di valore. I cosmetici e gli articoli per l’igiene personale il cui sigillo sia stato rimosso sono esclusi dal diritto di recesso (vedi sezione 5).",
    },
    s3: {
      h: "3. Procedura di reso",
      pasos: [
        ["Richiesta:", "Invia un’email a info@aizualabs.com indicando il numero d’ordine e il motivo del reso (facoltativo, ma utile per migliorare il nostro servizio)."],
        ["Conferma:", "Ti invieremo le istruzioni per il reso entro 48 ore lavorative dalla ricezione della tua richiesta."],
        ["Spedizione del prodotto:", "Dovrai rispedirci il prodotto utilizzando un servizio di spedizione tracciato. Le spese di reso sono a carico dell’acquirente, salvo che il prodotto sia difettoso o l’errore sia nostro."],
        ["Ispezione:", "Ricevuto il prodotto, lo ispezioneremo entro 5 giorni lavorativi."],
        ["Rimborso:", "Se il reso rispetta le condizioni, procederemo al rimborso entro un massimo di 14 giorni dalla ricezione del prodotto, utilizzando lo stesso metodo di pagamento originale."],
      ],
    },
    s4: {
      h: "4. Prodotti difettosi o errati",
      p1a: "Se ricevi un prodotto difettoso, danneggiato durante il trasporto o diverso da quello ordinato, devi comunicarcelo entro",
      horas: "48 ore",
      p1b: "dalla ricezione tramite email a info@aizualabs.com, allegando:",
      items: [
        "Numero d’ordine.",
        "Descrizione del problema.",
        "Fotografie del prodotto e dell’imballaggio (in particolare in presenza di danni visibili).",
      ],
      p2: "In questo caso, sosterremo tutte le spese di reso e ti invieremo un prodotto sostitutivo o ti rimborseremo l’intero importo, secondo la tua preferenza.",
    },
    s5: {
      h: "5. Esclusioni dal diritto di recesso",
      p: "Ai sensi dell’articolo 103 del TRLGDCU, il diritto di recesso non si applica a:",
      items: [
        "Prodotti personalizzati o realizzati secondo le specifiche del cliente.",
        "Prodotti che possono deteriorarsi o scadere rapidamente.",
        "Prodotti sigillati non idonei alla restituzione per motivi di protezione della salute o di igiene, se aperti dopo la consegna.",
        "Contenuti digitali scaricati con il consenso espresso del consumatore (corsi, ebook).",
      ],
    },
    s6: {
      h: "6. Rimborsi",
      p: "I rimborsi saranno effettuati utilizzando lo stesso mezzo di pagamento impiegato nella transazione originale, salvo accordo espresso contrario.",
      items: [
        "Pagamenti con carta (Stripe): il rimborso comparirà sull’estratto conto entro 5-10 giorni lavorativi, a seconda della banca.",
        "Le spese di spedizione iniziali saranno rimborsate solo se il reso è dovuto a un nostro errore o a un prodotto difettoso.",
      ],
    },
    s7: {
      h: "7. Garanzia legale",
      p1: "Tutti i prodotti venduti su AizuaBeauty beneficiano della garanzia legale di conformità di",
      anios: "3 anni",
      p2: "stabilita dal Regio Decreto-Legge spagnolo 7/2021, che recepisce la direttiva (UE) 2019/771. Se il prodotto presenta un difetto di conformità entro tale periodo, potrai richiedere la riparazione, la sostituzione, la riduzione del prezzo o la risoluzione del contratto, a seconda dei casi.",
    },
    s8: {
      h: "8. Contatti",
      p1: "Per qualsiasi domanda sui resi, contattaci a",
      p2: ". Il nostro tempo di risposta abituale è di 24-48 ore lavorative.",
    },
  },
};

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const base = "https://beauty.aizualabs.com";
  const l = pick(params.locale);
  const t = T[l];
  const url = `${base}/${l}/legal/devoluciones`;
  return {
    title: t.metaTitle,
    description: t.metaDesc,
    alternates: {
      canonical: url,
      languages: {
        ...Object.fromEntries(LOCALES.map((x) => [x, `${base}/${x}/legal/devoluciones`])),
        "x-default": `${base}/es/legal/devoluciones`,
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
const A = "text-blue-600 underline";

export default async function DevolucionesPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  const l = pick(params.locale);
  const t = T[l];

  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-gray-700">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.h1}</h1>
      <p className="text-sm text-gray-400 mb-10">{t.actualizado}</p>

      <section className="mb-8">
        <h2 className={H2}>{t.s1.h}</h2>
        <p className="mb-2">{t.s1.p1a} <strong>{t.s1.dias}</strong> {t.s1.p1b}</p>
        <p>
          {t.s1.p2a}{" "}
          <a href="mailto:info@aizualabs.com" className={A}>info@aizualabs.com</a>
          {" "}{t.s1.p2b}
        </p>
      </section>

      <section className="mb-8">
        <h2 className={H2}>{t.s2.h}</h2>
        <p className="mb-2">{t.s2.p}</p>
        <ul className={UL}>{t.s2.items.map((x) => <li key={x}>{x}</li>)}</ul>
        <p className="mt-3 text-sm text-gray-600">
          <strong>{t.s2.notaB}</strong> {t.s2.notaResto}
        </p>
      </section>

      <section className="mb-8">
        <h2 className={H2}>{t.s3.h}</h2>
        <ol className="list-decimal pl-5 space-y-2 text-sm">
          {t.s3.pasos.map(([b, r]) => (
            <li key={b}><strong>{b}</strong> {r}</li>
          ))}
        </ol>
      </section>

      <section className="mb-8">
        <h2 className={H2}>{t.s4.h}</h2>
        <p className="mb-2">{t.s4.p1a} <strong>{t.s4.horas}</strong> {t.s4.p1b}</p>
        <ul className={UL}>{t.s4.items.map((x) => <li key={x}>{x}</li>)}</ul>
        <p className="mt-2">{t.s4.p2}</p>
      </section>

      <section className="mb-8">
        <h2 className={H2}>{t.s5.h}</h2>
        <p className="mb-2">{t.s5.p}</p>
        <ul className={UL}>{t.s5.items.map((x) => <li key={x}>{x}</li>)}</ul>
      </section>

      <section className="mb-8">
        <h2 className={H2}>{t.s6.h}</h2>
        <p className="mb-2">{t.s6.p}</p>
        <ul className={UL}>{t.s6.items.map((x) => <li key={x}>{x}</li>)}</ul>
      </section>

      <section className="mb-8">
        <h2 className={H2}>{t.s7.h}</h2>
        <p>{t.s7.p1} <strong>{t.s7.anios}</strong> {t.s7.p2}</p>
      </section>

      <section className="mb-8">
        <h2 className={H2}>{t.s8.h}</h2>
        <p>
          {t.s8.p1}{" "}
          <a href="mailto:info@aizualabs.com" className={A}>info@aizualabs.com</a>
          {t.s8.p2}
        </p>
      </section>
    </main>
  );
}
