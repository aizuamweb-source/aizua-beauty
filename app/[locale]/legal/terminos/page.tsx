/**
 * Términos y Condiciones de Compra — AizuaBeauty, en los 6 idiomas.
 *
 * ⚠️ GENERADA POR SUSTITUCION desde Aizua-store: el cuerpo en español de las dos
 *
 * 🔴 GARANTIA CORREGIDA DE 2 A 3 AÑOS (s259), y es un cambio del texto español,
 * no una traducción. Esta página decía «2 años, RDL 1/2007» mientras
 * legal/devoluciones decía «3 años, RD-ley 7/2021» — dos páginas legales de la
 * misma tienda contradiciéndose. Los 3 años son los correctos: el RD-ley 7/2021
 * (Directiva UE 2019/771) amplió la garantía de conformidad de 2 a 3 años para
 * los bienes entregados desde el 1 de enero de 2022. Anunciar 2 no reduce la
 * obligación legal, solo induce a error al comprador.
 * tiendas era IDENTICO (verificado con diff normalizando marca y dominio). Si
 * tocas una, toca la otra.
 *
 * 🔴 Las dos cosas pendientes de decisión están anotadas en el fichero
 * equivalente de Aizua-store: los destinos de envío no incluyen Alemania ni
 * Portugal aunque la tienda esté traducida a esos idiomas, y el apartado 5 dice
 * «directamente desde el proveedor».
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
  s1: { h: string; p1: string; p2: string };
  s2: { h: string; p: string; pasos: string[]; nota: string };
  s3: { h: string; p1: string; p2: string; p3: string };
  s4: { h: string; p1a: string; p1b: string; metodos: string[]; nota: string };
  s5: { h: string; p: string; espana: string; espanaV: string; ue: string; ueV: string; nota1: string; nota2: string };
  s6: { h: string; p1a: string; dias: string; p1b: string; p2: string; link: string };
  s7: { h: string; p1: string; anios: string; p2: string; p3: string };
  s8: { h: string; p1: string; p2: string };
  s9: { h: string; p1: string; link: string; p2: string };
  s10: { h: string; p1: string; p2: string };
}

const T: Record<Loc, Textos> = {
  es: {
    metaTitle: "Términos y Condiciones",
    metaDesc: "Términos y condiciones de compra de AizuaBeauty: proceso de pedido, precios e IVA, pago, envíos, devoluciones, garantía legal y resolución de conflictos.",
    h1: "Términos y Condiciones de Compra",
    actualizado: "Última actualización: marzo 2026",
    s1: {
      h: "1. Partes del contrato",
      p1: "Las presentes condiciones regulan la relación contractual entre Aizüa (titular de la tienda beauty.aizualabs.com, en adelante «el Vendedor») y el usuario que realiza una compra a través de esta tienda (en adelante «el Comprador»).",
      p2: "Al finalizar una compra, el Comprador acepta estas condiciones en su totalidad.",
    },
    s2: {
      h: "2. Proceso de compra",
      p: "El proceso de compra se realiza en los siguientes pasos:",
      pasos: [
        "Selección del producto y adición al carrito.",
        "Revisión del carrito y acceso al proceso de pago.",
        "Introducción de los datos de envío y método de pago.",
        "Confirmación del pedido y pago seguro mediante Stripe.",
        "Recepción de correo electrónico de confirmación del pedido.",
      ],
      nota: "El contrato de compraventa queda perfeccionado en el momento en que el Vendedor confirma el pedido por correo electrónico.",
    },
    s3: {
      h: "3. Precios e IVA",
      p1: "Todos los precios mostrados en la tienda están expresados en euros (EUR) e incluyen el Impuesto sobre el Valor Añadido (IVA) aplicable según la normativa española vigente.",
      p2: "El Vendedor opera en régimen de recargo de equivalencia para las ventas de productos físicos a consumidores finales, por lo que el IVA ya está incluido en el precio final mostrado.",
      p3: "Los precios pueden variar sin previo aviso. El precio aplicable será el vigente en el momento de finalizar el pedido.",
    },
    s4: {
      h: "4. Pago",
      p1a: "Los pagos se procesan de forma segura a través de",
      p1b: ", plataforma de pagos certificada PCI-DSS. Se aceptan los siguientes métodos de pago:",
      metodos: [
        "Tarjeta de crédito o débito (Visa, Mastercard, American Express)",
        "Apple Pay y Google Pay (según disponibilidad)",
      ],
      nota: "El Vendedor no almacena datos de tarjetas bancarias. Toda la información de pago es procesada directamente por Stripe bajo sus propias medidas de seguridad.",
    },
    s5: {
      h: "5. Envío y plazos de entrega",
      p: "Los productos se envían directamente desde el proveedor al Comprador. Los plazos estimados de entrega son:",
      espana: "España:", espanaV: "7-20 días hábiles.",
      ue: "Resto de la UE (Francia, Italia, Irlanda):", ueV: "10-25 días hábiles.",
      nota1: "Estos plazos son orientativos y pueden verse afectados por factores externos (aduanas, demoras del transportista, festivos). El Vendedor no se responsabiliza de retrasos imputables a terceros.",
      nota2: "Una vez procesado el pedido, el Comprador recibirá un número de seguimiento para rastrear el envío.",
    },
    s6: {
      h: "6. Devoluciones y derecho de desistimiento",
      p1a: "El Comprador dispone de un plazo de",
      dias: "14 días naturales",
      p1b: "desde la recepción del producto para ejercer su derecho de desistimiento sin necesidad de justificación, conforme a la Directiva 2011/83/UE y el Real Decreto Legislativo 1/2007 (TRLGDCU).",
      p2: "Para más información sobre el proceso de devolución, plazos de reembolso y excepciones, consulta nuestra",
      link: "Política de Devoluciones",
    },
    s7: {
      h: "7. Garantía legal",
      p1: "Todos los productos vendidos en esta tienda están sujetos a la garantía legal de conformidad de",
      anios: "3 años",
      p2: "desde la entrega, conforme al Real Decreto-ley 7/2021, que traspone la Directiva (UE) 2019/771. En caso de producto defectuoso o no conforme, el Comprador puede solicitar la reparación, sustitución, reducción de precio o resolución del contrato. Para ejercer esta garantía, contacta con nosotros en",
      p3: ".",
    },
    s8: {
      h: "8. Responsabilidad",
      p1: "El Vendedor no se responsabiliza de los daños indirectos, lucro cesante o perjuicios derivados del uso incorrecto de los productos adquiridos. La responsabilidad máxima del Vendedor se limita al importe pagado por el Comprador en la transacción en cuestión.",
      p2: "El Vendedor no garantiza la disponibilidad permanente de todos los productos del catálogo. En caso de que un producto no esté disponible tras la confirmación del pedido, se notificará al Comprador y se procederá al reembolso íntegro.",
    },
    s9: {
      h: "9. Protección de datos",
      p1: "Los datos personales facilitados durante el proceso de compra serán tratados conforme a nuestra",
      link: "Política de Privacidad",
      p2: ", en cumplimiento del RGPD (UE) 2016/679 y la LOPDGDD.",
    },
    s10: {
      h: "10. Legislación aplicable y resolución de conflictos",
      p1: "Las presentes condiciones se rigen por la legislación española. Para cualquier controversia, las partes se someten a los Juzgados y Tribunales competentes según la normativa vigente.",
      p2: "Conforme al Reglamento (UE) 524/2013, los consumidores de la UE pueden acceder a la plataforma de resolución de litigios en línea de la Comisión Europea en:",
    },
  },

  en: {
    metaTitle: "Terms and Conditions",
    metaDesc: "AizuaBeauty terms and conditions of sale: order process, prices and VAT, payment, shipping, returns, legal warranty and dispute resolution.",
    h1: "Terms and Conditions of Sale",
    actualizado: "Last updated: March 2026",
    s1: {
      h: "1. Parties to the contract",
      p1: "These terms govern the contractual relationship between Aizüa (owner of the beauty.aizualabs.com store, hereinafter “the Seller”) and the user who makes a purchase through this store (hereinafter “the Buyer”).",
      p2: "By completing a purchase, the Buyer accepts these terms in full.",
    },
    s2: {
      h: "2. Purchase process",
      p: "The purchase process takes place in the following steps:",
      pasos: [
        "Selecting the product and adding it to the cart.",
        "Reviewing the cart and proceeding to checkout.",
        "Entering shipping details and payment method.",
        "Confirming the order and paying securely via Stripe.",
        "Receiving the order confirmation email.",
      ],
      nota: "The contract of sale is concluded at the moment the Seller confirms the order by email.",
    },
    s3: {
      h: "3. Prices and VAT",
      p1: "All prices shown in the store are expressed in euros (EUR) and include the Value Added Tax (VAT) applicable under current Spanish law.",
      p2: "The Seller operates under the Spanish “recargo de equivalencia” special VAT scheme for sales of physical goods to end consumers, so VAT is already included in the final price shown.",
      p3: "Prices may change without prior notice. The applicable price will be the one in force at the time the order is completed.",
    },
    s4: {
      h: "4. Payment",
      p1a: "Payments are processed securely through",
      p1b: ", a PCI-DSS certified payment platform. The following payment methods are accepted:",
      metodos: [
        "Credit or debit card (Visa, Mastercard, American Express)",
        "Apple Pay and Google Pay (subject to availability)",
      ],
      nota: "The Seller does not store bank card details. All payment information is processed directly by Stripe under its own security measures.",
    },
    s5: {
      h: "5. Shipping and delivery times",
      p: "Products are shipped directly from the supplier to the Buyer. Estimated delivery times are:",
      espana: "Spain:", espanaV: "7-20 business days.",
      ue: "Rest of the EU (France, Italy, Ireland):", ueV: "10-25 business days.",
      nota1: "These times are indicative and may be affected by external factors (customs, carrier delays, public holidays). The Seller is not responsible for delays attributable to third parties.",
      nota2: "Once the order has been processed, the Buyer will receive a tracking number to follow the shipment.",
    },
    s6: {
      h: "6. Returns and right of withdrawal",
      p1a: "The Buyer has a period of",
      dias: "14 calendar days",
      p1b: "from receipt of the product to exercise the right of withdrawal without giving any reason, in accordance with Directive 2011/83/EU and Spanish Royal Legislative Decree 1/2007 (TRLGDCU).",
      p2: "For more information about the returns process, refund periods and exceptions, see our",
      link: "Returns Policy",
    },
    s7: {
      h: "7. Legal warranty",
      p1: "All products sold in this store are covered by the legal warranty of conformity of",
      anios: "3 years",
      p2: "from delivery, in accordance with Spanish Royal Decree-Law 7/2021, which transposes Directive (EU) 2019/771. In the case of a defective or non-conforming product, the Buyer may request repair, replacement, a price reduction or termination of the contract. To exercise this warranty, contact us at",
      p3: ".",
    },
    s8: {
      h: "8. Liability",
      p1: "The Seller is not liable for indirect damages, loss of profit or losses arising from the improper use of the products purchased. The Seller’s maximum liability is limited to the amount paid by the Buyer in the transaction concerned.",
      p2: "The Seller does not guarantee the permanent availability of all products in the catalogue. If a product becomes unavailable after the order is confirmed, the Buyer will be notified and a full refund will be issued.",
    },
    s9: {
      h: "9. Data protection",
      p1: "Personal data provided during the purchase process will be processed in accordance with our",
      link: "Privacy Policy",
      p2: ", in compliance with the GDPR (EU) 2016/679 and the Spanish LOPDGDD.",
    },
    s10: {
      h: "10. Applicable law and dispute resolution",
      p1: "These terms are governed by Spanish law. For any dispute, the parties submit to the competent Courts and Tribunals under the applicable rules.",
      p2: "In accordance with Regulation (EU) 524/2013, EU consumers may access the European Commission’s online dispute resolution platform at:",
    },
  },

  fr: {
    metaTitle: "Conditions générales de vente",
    metaDesc: "Conditions générales de vente d’AizuaBeauty : processus de commande, prix et TVA, paiement, livraison, retours, garantie légale et résolution des litiges.",
    h1: "Conditions générales de vente",
    actualizado: "Dernière mise à jour : mars 2026",
    s1: {
      h: "1. Parties au contrat",
      p1: "Les présentes conditions régissent la relation contractuelle entre Aizüa (titulaire de la boutique beauty.aizualabs.com, ci-après « le Vendeur ») et l’utilisateur qui effectue un achat sur cette boutique (ci-après « l’Acheteur »).",
      p2: "En finalisant un achat, l’Acheteur accepte intégralement les présentes conditions.",
    },
    s2: {
      h: "2. Processus d’achat",
      p: "Le processus d’achat se déroule selon les étapes suivantes :",
      pasos: [
        "Sélection du produit et ajout au panier.",
        "Vérification du panier et accès au paiement.",
        "Saisie des informations de livraison et du moyen de paiement.",
        "Confirmation de la commande et paiement sécurisé via Stripe.",
        "Réception de l’e-mail de confirmation de commande.",
      ],
      nota: "Le contrat de vente est conclu au moment où le Vendeur confirme la commande par e-mail.",
    },
    s3: {
      h: "3. Prix et TVA",
      p1: "Tous les prix affichés dans la boutique sont exprimés en euros (EUR) et incluent la taxe sur la valeur ajoutée (TVA) applicable selon la législation espagnole en vigueur.",
      p2: "Le Vendeur opère sous le régime espagnol du « recargo de equivalencia » (régime particulier de TVA) pour les ventes de produits physiques aux consommateurs finaux ; la TVA est donc déjà incluse dans le prix final affiché.",
      p3: "Les prix peuvent varier sans préavis. Le prix applicable sera celui en vigueur au moment de la finalisation de la commande.",
    },
    s4: {
      h: "4. Paiement",
      p1a: "Les paiements sont traités de manière sécurisée via",
      p1b: ", plateforme de paiement certifiée PCI-DSS. Les moyens de paiement suivants sont acceptés :",
      metodos: [
        "Carte de crédit ou de débit (Visa, Mastercard, American Express)",
        "Apple Pay et Google Pay (selon disponibilité)",
      ],
      nota: "Le Vendeur ne conserve aucune donnée de carte bancaire. Toutes les informations de paiement sont traitées directement par Stripe selon ses propres mesures de sécurité.",
    },
    s5: {
      h: "5. Livraison et délais",
      p: "Les produits sont expédiés directement du fournisseur à l’Acheteur. Les délais de livraison estimés sont :",
      espana: "Espagne :", espanaV: "7 à 20 jours ouvrables.",
      ue: "Reste de l’UE (France, Italie, Irlande) :", ueV: "10 à 25 jours ouvrables.",
      nota1: "Ces délais sont indicatifs et peuvent être affectés par des facteurs externes (douanes, retards du transporteur, jours fériés). Le Vendeur n’est pas responsable des retards imputables à des tiers.",
      nota2: "Une fois la commande traitée, l’Acheteur recevra un numéro de suivi pour suivre son envoi.",
    },
    s6: {
      h: "6. Retours et droit de rétractation",
      p1a: "L’Acheteur dispose d’un délai de",
      dias: "14 jours calendaires",
      p1b: "à compter de la réception du produit pour exercer son droit de rétractation sans justification, conformément à la directive 2011/83/UE et au décret royal législatif espagnol 1/2007 (TRLGDCU).",
      p2: "Pour plus d’informations sur la procédure de retour, les délais de remboursement et les exceptions, consultez notre",
      link: "Politique de retours",
    },
    s7: {
      h: "7. Garantie légale",
      p1: "Tous les produits vendus dans cette boutique bénéficient de la garantie légale de conformité de",
      anios: "3 ans",
      p2: "à compter de la livraison, conformément au décret-loi royal espagnol 7/2021, qui transpose la directive (UE) 2019/771. En cas de produit défectueux ou non conforme, l’Acheteur peut demander la réparation, le remplacement, une réduction du prix ou la résolution du contrat. Pour faire valoir cette garantie, contactez-nous à",
      p3: ".",
    },
    s8: {
      h: "8. Responsabilité",
      p1: "Le Vendeur n’est pas responsable des dommages indirects, du manque à gagner ou des préjudices résultant d’une utilisation incorrecte des produits achetés. La responsabilité maximale du Vendeur est limitée au montant payé par l’Acheteur pour la transaction concernée.",
      p2: "Le Vendeur ne garantit pas la disponibilité permanente de tous les produits du catalogue. Si un produit n’est plus disponible après la confirmation de la commande, l’Acheteur en sera informé et un remboursement intégral sera effectué.",
    },
    s9: {
      h: "9. Protection des données",
      p1: "Les données personnelles fournies lors de l’achat seront traitées conformément à notre",
      link: "Politique de confidentialité",
      p2: ", dans le respect du RGPD (UE) 2016/679 et de la LOPDGDD espagnole.",
    },
    s10: {
      h: "10. Droit applicable et résolution des litiges",
      p1: "Les présentes conditions sont régies par le droit espagnol. Pour tout litige, les parties se soumettent aux tribunaux compétents selon la réglementation en vigueur.",
      p2: "Conformément au règlement (UE) 524/2013, les consommateurs de l’UE peuvent accéder à la plateforme de règlement en ligne des litiges de la Commission européenne à l’adresse :",
    },
  },

  de: {
    metaTitle: "Allgemeine Geschäftsbedingungen",
    metaDesc: "Allgemeine Geschäftsbedingungen von AizuaBeauty: Bestellvorgang, Preise und Mehrwertsteuer, Zahlung, Versand, Rückgaben, gesetzliche Gewährleistung und Streitbeilegung.",
    h1: "Allgemeine Geschäftsbedingungen",
    actualizado: "Letzte Aktualisierung: März 2026",
    s1: {
      h: "1. Vertragsparteien",
      p1: "Diese Bedingungen regeln das Vertragsverhältnis zwischen Aizüa (Inhaber des Shops beauty.aizualabs.com, im Folgenden „der Verkäufer“) und dem Nutzer, der über diesen Shop einen Kauf abschließt (im Folgenden „der Käufer“).",
      p2: "Mit dem Abschluss eines Kaufs akzeptiert der Käufer diese Bedingungen vollständig.",
    },
    s2: {
      h: "2. Bestellvorgang",
      p: "Der Kauf erfolgt in den folgenden Schritten:",
      pasos: [
        "Auswahl des Produkts und Hinzufügen zum Warenkorb.",
        "Überprüfung des Warenkorbs und Aufruf des Bezahlvorgangs.",
        "Eingabe der Versanddaten und der Zahlungsmethode.",
        "Bestätigung der Bestellung und sichere Zahlung über Stripe.",
        "Erhalt der Bestellbestätigung per E-Mail.",
      ],
      nota: "Der Kaufvertrag kommt in dem Moment zustande, in dem der Verkäufer die Bestellung per E-Mail bestätigt.",
    },
    s3: {
      h: "3. Preise und Mehrwertsteuer",
      p1: "Alle im Shop angezeigten Preise sind in Euro (EUR) angegeben und enthalten die nach geltendem spanischem Recht anwendbare Mehrwertsteuer.",
      p2: "Der Verkäufer unterliegt für den Verkauf physischer Waren an Endverbraucher der spanischen Sonderregelung „recargo de equivalencia“; die Mehrwertsteuer ist daher im angezeigten Endpreis bereits enthalten.",
      p3: "Preise können sich ohne Vorankündigung ändern. Maßgeblich ist der Preis, der zum Zeitpunkt des Abschlusses der Bestellung gilt.",
    },
    s4: {
      h: "4. Zahlung",
      p1a: "Zahlungen werden sicher über",
      p1b: " abgewickelt, eine PCI-DSS-zertifizierte Zahlungsplattform. Folgende Zahlungsmethoden werden akzeptiert:",
      metodos: [
        "Kredit- oder Debitkarte (Visa, Mastercard, American Express)",
        "Apple Pay und Google Pay (je nach Verfügbarkeit)",
      ],
      nota: "Der Verkäufer speichert keine Bankkartendaten. Alle Zahlungsinformationen werden direkt von Stripe nach dessen eigenen Sicherheitsmaßnahmen verarbeitet.",
    },
    s5: {
      h: "5. Versand und Lieferzeiten",
      p: "Die Produkte werden direkt vom Lieferanten an den Käufer versandt. Die geschätzten Lieferzeiten betragen:",
      espana: "Spanien:", espanaV: "7-20 Werktage.",
      ue: "Übrige EU (Frankreich, Italien, Irland):", ueV: "10-25 Werktage.",
      nota1: "Diese Zeiten sind Richtwerte und können durch externe Faktoren beeinflusst werden (Zoll, Verzögerungen des Transportunternehmens, Feiertage). Der Verkäufer haftet nicht für Verzögerungen, die Dritten zuzurechnen sind.",
      nota2: "Nach Bearbeitung der Bestellung erhält der Käufer eine Sendungsnummer zur Verfolgung des Versands.",
    },
    s6: {
      h: "6. Rückgabe und Widerrufsrecht",
      p1a: "Der Käufer hat eine Frist von",
      dias: "14 Kalendertagen",
      p1b: "ab Erhalt des Produkts, um sein Widerrufsrecht ohne Angabe von Gründen auszuüben, gemäß der Richtlinie 2011/83/EU und dem spanischen Königlichen Gesetzesdekret 1/2007 (TRLGDCU).",
      p2: "Weitere Informationen zum Rückgabeverfahren, zu den Erstattungsfristen und zu den Ausnahmen findest du in unserer",
      link: "Rückgaberichtlinie",
    },
    s7: {
      h: "7. Gesetzliche Gewährleistung",
      p1: "Für alle in diesem Shop verkauften Produkte gilt die gesetzliche Gewährleistung für Vertragsmäßigkeit von",
      anios: "3 Jahren",
      p2: "ab Lieferung, gemäß dem spanischen Königlichen Gesetzesdekret 7/2021, das die Richtlinie (EU) 2019/771 umsetzt. Bei einem defekten oder nicht vertragsgemäßen Produkt kann der Käufer Reparatur, Ersatz, Preisminderung oder Vertragsauflösung verlangen. Um diese Gewährleistung in Anspruch zu nehmen, kontaktiere uns unter",
      p3: ".",
    },
    s8: {
      h: "8. Haftung",
      p1: "Der Verkäufer haftet nicht für indirekte Schäden, entgangenen Gewinn oder Nachteile, die sich aus der unsachgemäßen Verwendung der erworbenen Produkte ergeben. Die maximale Haftung des Verkäufers ist auf den vom Käufer für die betreffende Transaktion gezahlten Betrag begrenzt.",
      p2: "Der Verkäufer garantiert nicht die dauerhafte Verfügbarkeit aller Produkte des Katalogs. Sollte ein Produkt nach der Bestellbestätigung nicht verfügbar sein, wird der Käufer informiert und der Betrag vollständig zurückerstattet.",
    },
    s9: {
      h: "9. Datenschutz",
      p1: "Die im Rahmen des Kaufs angegebenen personenbezogenen Daten werden gemäß unserer",
      link: "Datenschutzerklärung",
      p2: " verarbeitet, in Einklang mit der DSGVO (EU) 2016/679 und dem spanischen LOPDGDD.",
    },
    s10: {
      h: "10. Anwendbares Recht und Streitbeilegung",
      p1: "Diese Bedingungen unterliegen spanischem Recht. Für Streitigkeiten unterwerfen sich die Parteien den nach den geltenden Vorschriften zuständigen Gerichten.",
      p2: "Gemäß der Verordnung (EU) 524/2013 können EU-Verbraucher die Plattform zur Online-Streitbeilegung der Europäischen Kommission nutzen:",
    },
  },

  pt: {
    metaTitle: "Termos e Condições",
    metaDesc: "Termos e condições de compra da AizuaBeauty: processo de encomenda, preços e IVA, pagamento, envios, devoluções, garantia legal e resolução de litígios.",
    h1: "Termos e Condições de Compra",
    actualizado: "Última atualização: março de 2026",
    s1: {
      h: "1. Partes do contrato",
      p1: "As presentes condições regulam a relação contratual entre a Aizüa (titular da loja beauty.aizualabs.com, doravante «o Vendedor») e o utilizador que efetua uma compra através desta loja (doravante «o Comprador»).",
      p2: "Ao concluir uma compra, o Comprador aceita integralmente estas condições.",
    },
    s2: {
      h: "2. Processo de compra",
      p: "O processo de compra realiza-se nos seguintes passos:",
      pasos: [
        "Seleção do produto e adição ao carrinho.",
        "Revisão do carrinho e acesso ao processo de pagamento.",
        "Introdução dos dados de envio e do método de pagamento.",
        "Confirmação da encomenda e pagamento seguro através da Stripe.",
        "Receção do email de confirmação da encomenda.",
      ],
      nota: "O contrato de compra e venda fica concluído no momento em que o Vendedor confirma a encomenda por email.",
    },
    s3: {
      h: "3. Preços e IVA",
      p1: "Todos os preços apresentados na loja estão expressos em euros (EUR) e incluem o Imposto sobre o Valor Acrescentado (IVA) aplicável de acordo com a legislação espanhola vigente.",
      p2: "O Vendedor opera no regime espanhol de «recargo de equivalencia» (regime especial de IVA) para as vendas de produtos físicos a consumidores finais, pelo que o IVA já está incluído no preço final apresentado.",
      p3: "Os preços podem variar sem aviso prévio. O preço aplicável será o vigente no momento da conclusão da encomenda.",
    },
    s4: {
      h: "4. Pagamento",
      p1a: "Os pagamentos são processados de forma segura através da",
      p1b: ", plataforma de pagamentos certificada PCI-DSS. São aceites os seguintes métodos de pagamento:",
      metodos: [
        "Cartão de crédito ou débito (Visa, Mastercard, American Express)",
        "Apple Pay e Google Pay (conforme disponibilidade)",
      ],
      nota: "O Vendedor não armazena dados de cartões bancários. Toda a informação de pagamento é processada diretamente pela Stripe sob as suas próprias medidas de segurança.",
    },
    s5: {
      h: "5. Envio e prazos de entrega",
      p: "Os produtos são enviados diretamente do fornecedor para o Comprador. Os prazos estimados de entrega são:",
      espana: "Espanha:", espanaV: "7-20 dias úteis.",
      ue: "Resto da UE (França, Itália, Irlanda):", ueV: "10-25 dias úteis.",
      nota1: "Estes prazos são indicativos e podem ser afetados por fatores externos (alfândegas, atrasos da transportadora, feriados). O Vendedor não se responsabiliza por atrasos imputáveis a terceiros.",
      nota2: "Depois de processada a encomenda, o Comprador receberá um número de seguimento para acompanhar o envio.",
    },
    s6: {
      h: "6. Devoluções e direito de livre resolução",
      p1a: "O Comprador dispõe de um prazo de",
      dias: "14 dias de calendário",
      p1b: "a contar da receção do produto para exercer o seu direito de livre resolução sem necessidade de justificação, nos termos da Diretiva 2011/83/UE e do Real Decreto Legislativo espanhol 1/2007 (TRLGDCU).",
      p2: "Para mais informação sobre o processo de devolução, prazos de reembolso e exceções, consulte a nossa",
      link: "Política de Devoluções",
    },
    s7: {
      h: "7. Garantia legal",
      p1: "Todos os produtos vendidos nesta loja estão sujeitos à garantia legal de conformidade de",
      anios: "3 anos",
      p2: "a contar da entrega, nos termos do Real Decreto-Lei espanhol 7/2021, que transpõe a Diretiva (UE) 2019/771. Em caso de produto defeituoso ou não conforme, o Comprador pode solicitar a reparação, substituição, redução do preço ou resolução do contrato. Para exercer esta garantia, contacte-nos em",
      p3: ".",
    },
    s8: {
      h: "8. Responsabilidade",
      p1: "O Vendedor não se responsabiliza por danos indiretos, lucros cessantes ou prejuízos decorrentes do uso incorreto dos produtos adquiridos. A responsabilidade máxima do Vendedor limita-se ao valor pago pelo Comprador na transação em questão.",
      p2: "O Vendedor não garante a disponibilidade permanente de todos os produtos do catálogo. Caso um produto não esteja disponível após a confirmação da encomenda, o Comprador será notificado e será efetuado o reembolso integral.",
    },
    s9: {
      h: "9. Proteção de dados",
      p1: "Os dados pessoais facultados durante o processo de compra serão tratados de acordo com a nossa",
      link: "Política de Privacidade",
      p2: ", em cumprimento do RGPD (UE) 2016/679 e da LOPDGDD espanhola.",
    },
    s10: {
      h: "10. Legislação aplicável e resolução de litígios",
      p1: "As presentes condições regem-se pela legislação espanhola. Para qualquer litígio, as partes submetem-se aos Juízos e Tribunais competentes de acordo com a legislação vigente.",
      p2: "Nos termos do Regulamento (UE) 524/2013, os consumidores da UE podem aceder à plataforma de resolução de litígios em linha da Comissão Europeia em:",
    },
  },

  it: {
    metaTitle: "Termini e condizioni",
    metaDesc: "Termini e condizioni di vendita di AizuaBeauty: processo d’ordine, prezzi e IVA, pagamento, spedizioni, resi, garanzia legale e risoluzione delle controversie.",
    h1: "Termini e condizioni di vendita",
    actualizado: "Ultimo aggiornamento: marzo 2026",
    s1: {
      h: "1. Parti del contratto",
      p1: "Le presenti condizioni disciplinano il rapporto contrattuale tra Aizüa (titolare del negozio beauty.aizualabs.com, di seguito «il Venditore») e l’utente che effettua un acquisto tramite questo negozio (di seguito «l’Acquirente»).",
      p2: "Completando un acquisto, l’Acquirente accetta integralmente le presenti condizioni.",
    },
    s2: {
      h: "2. Processo di acquisto",
      p: "Il processo di acquisto si svolge nelle seguenti fasi:",
      pasos: [
        "Selezione del prodotto e aggiunta al carrello.",
        "Revisione del carrello e accesso al pagamento.",
        "Inserimento dei dati di spedizione e del metodo di pagamento.",
        "Conferma dell’ordine e pagamento sicuro tramite Stripe.",
        "Ricezione dell’email di conferma dell’ordine.",
      ],
      nota: "Il contratto di vendita si perfeziona nel momento in cui il Venditore conferma l’ordine via email.",
    },
    s3: {
      h: "3. Prezzi e IVA",
      p1: "Tutti i prezzi indicati nel negozio sono espressi in euro (EUR) e includono l’imposta sul valore aggiunto (IVA) applicabile secondo la normativa spagnola vigente.",
      p2: "Il Venditore opera in regime spagnolo di «recargo de equivalencia» (regime IVA speciale) per le vendite di prodotti fisici a consumatori finali, pertanto l’IVA è già inclusa nel prezzo finale indicato.",
      p3: "I prezzi possono variare senza preavviso. Il prezzo applicabile sarà quello in vigore al momento del completamento dell’ordine.",
    },
    s4: {
      h: "4. Pagamento",
      p1a: "I pagamenti sono elaborati in modo sicuro tramite",
      p1b: ", piattaforma di pagamento certificata PCI-DSS. Sono accettati i seguenti metodi di pagamento:",
      metodos: [
        "Carta di credito o debito (Visa, Mastercard, American Express)",
        "Apple Pay e Google Pay (in base alla disponibilità)",
      ],
      nota: "Il Venditore non conserva i dati delle carte bancarie. Tutte le informazioni di pagamento sono elaborate direttamente da Stripe secondo le proprie misure di sicurezza.",
    },
    s5: {
      h: "5. Spedizione e tempi di consegna",
      p: "I prodotti vengono spediti direttamente dal fornitore all’Acquirente. I tempi di consegna stimati sono:",
      espana: "Spagna:", espanaV: "7-20 giorni lavorativi.",
      ue: "Resto dell’UE (Francia, Italia, Irlanda):", ueV: "10-25 giorni lavorativi.",
      nota1: "Questi tempi sono indicativi e possono essere influenzati da fattori esterni (dogane, ritardi del corriere, festività). Il Venditore non è responsabile dei ritardi imputabili a terzi.",
      nota2: "Una volta elaborato l’ordine, l’Acquirente riceverà un numero di tracciamento per seguire la spedizione.",
    },
    s6: {
      h: "6. Resi e diritto di recesso",
      p1a: "L’Acquirente dispone di un termine di",
      dias: "14 giorni di calendario",
      p1b: "dalla ricezione del prodotto per esercitare il diritto di recesso senza necessità di motivazione, ai sensi della direttiva 2011/83/UE e del Regio Decreto Legislativo spagnolo 1/2007 (TRLGDCU).",
      p2: "Per maggiori informazioni sulla procedura di reso, sui tempi di rimborso e sulle eccezioni, consulta la nostra",
      link: "Politica di reso",
    },
    s7: {
      h: "7. Garanzia legale",
      p1: "Tutti i prodotti venduti in questo negozio sono coperti dalla garanzia legale di conformità di",
      anios: "3 anni",
      p2: "dalla consegna, ai sensi del Regio Decreto-Legge spagnolo 7/2021, che recepisce la direttiva (UE) 2019/771. In caso di prodotto difettoso o non conforme, l’Acquirente può richiedere la riparazione, la sostituzione, la riduzione del prezzo o la risoluzione del contratto. Per esercitare questa garanzia, contattaci a",
      p3: ".",
    },
    s8: {
      h: "8. Responsabilità",
      p1: "Il Venditore non è responsabile dei danni indiretti, del lucro cessante o dei pregiudizi derivanti dall’uso non corretto dei prodotti acquistati. La responsabilità massima del Venditore è limitata all’importo pagato dall’Acquirente per la transazione in questione.",
      p2: "Il Venditore non garantisce la disponibilità permanente di tutti i prodotti del catalogo. Qualora un prodotto non sia disponibile dopo la conferma dell’ordine, l’Acquirente sarà informato e si procederà al rimborso integrale.",
    },
    s9: {
      h: "9. Protezione dei dati",
      p1: "I dati personali forniti durante il processo di acquisto saranno trattati conformemente alla nostra",
      link: "Informativa sulla privacy",
      p2: ", nel rispetto del GDPR (UE) 2016/679 e della LOPDGDD spagnola.",
    },
    s10: {
      h: "10. Legge applicabile e risoluzione delle controversie",
      p1: "Le presenti condizioni sono disciplinate dalla legge spagnola. Per qualsiasi controversia, le parti si sottomettono ai Tribunali competenti secondo la normativa vigente.",
      p2: "Ai sensi del regolamento (UE) 524/2013, i consumatori dell’UE possono accedere alla piattaforma di risoluzione delle controversie online della Commissione europea all’indirizzo:",
    },
  },
};

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const base = "https://beauty.aizualabs.com";
  const l = pick(params.locale);
  const t = T[l];
  const url = `${base}/${l}/legal/terminos`;
  return {
    title: t.metaTitle,
    description: t.metaDesc,
    alternates: {
      canonical: url,
      languages: {
        ...Object.fromEntries(LOCALES.map((x) => [x, `${base}/${x}/legal/terminos`])),
        "x-default": `${base}/es/legal/terminos`,
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
const A = "text-blue-600 underline";

export default async function TerminosPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  const l = pick(params.locale);
  const t = T[l];

  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-gray-700">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.h1}</h1>
      <p className="text-sm text-gray-400 mb-10">{t.actualizado}</p>

      <section className="mb-8">
        <h2 className={H2}>{t.s1.h}</h2>
        <p className="mb-3">{t.s1.p1}</p>
        <p>{t.s1.p2}</p>
      </section>

      <section className="mb-8">
        <h2 className={H2}>{t.s2.h}</h2>
        <p className="mb-3">{t.s2.p}</p>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          {t.s2.pasos.map((x) => <li key={x}>{x}</li>)}
        </ol>
        <p className="mt-3 text-sm text-gray-500">{t.s2.nota}</p>
      </section>

      <section className="mb-8">
        <h2 className={H2}>{t.s3.h}</h2>
        <p className="mb-3">{t.s3.p1}</p>
        <p className="mb-3">{t.s3.p2}</p>
        <p>{t.s3.p3}</p>
      </section>

      <section className="mb-8">
        <h2 className={H2}>{t.s4.h}</h2>
        <p className="mb-3">{t.s4.p1a} <strong>Stripe</strong>{t.s4.p1b}</p>
        <ul className="list-disc list-inside space-y-1 text-sm mb-3">
          {t.s4.metodos.map((x) => <li key={x}>{x}</li>)}
        </ul>
        <p className="text-sm text-gray-500">{t.s4.nota}</p>
      </section>

      <section className="mb-8">
        <h2 className={H2}>{t.s5.h}</h2>
        <p className="mb-3">{t.s5.p}</p>
        <ul className="list-disc list-inside space-y-1 text-sm mb-3">
          <li><strong>{t.s5.espana}</strong> {t.s5.espanaV}</li>
          <li><strong>{t.s5.ue}</strong> {t.s5.ueV}</li>
        </ul>
        <p className="mb-3 text-sm">{t.s5.nota1}</p>
        <p className="text-sm">{t.s5.nota2}</p>
      </section>

      <section className="mb-8">
        <h2 className={H2}>{t.s6.h}</h2>
        <p className="mb-3">{t.s6.p1a} <strong>{t.s6.dias}</strong> {t.s6.p1b}</p>
        <p>
          {t.s6.p2}{" "}
          <a href={`/${l}/legal/devoluciones`} className={A}>{t.s6.link}</a>
          .
        </p>
      </section>

      <section className="mb-8">
        <h2 className={H2}>{t.s7.h}</h2>
        <p>
          {t.s7.p1} <strong>{t.s7.anios}</strong> {t.s7.p2}{" "}
          <a href="mailto:info@aizualabs.com" className={A}>info@aizualabs.com</a>{t.s7.p3}
        </p>
      </section>

      <section className="mb-8">
        <h2 className={H2}>{t.s8.h}</h2>
        <p className="mb-3">{t.s8.p1}</p>
        <p>{t.s8.p2}</p>
      </section>

      <section className="mb-8">
        <h2 className={H2}>{t.s9.h}</h2>
        <p>
          {t.s9.p1}{" "}
          <a href={`/${l}/legal/privacidad`} className={A}>{t.s9.link}</a>
          {t.s9.p2}
        </p>
      </section>

      <section>
        <h2 className={H2}>{t.s10.h}</h2>
        <p className="mb-3">{t.s10.p1}</p>
        <p className="text-sm">
          {t.s10.p2}{" "}
          <a href="https://ec.europa.eu/consumers/odr" className={A} target="_blank" rel="noopener noreferrer">
            ec.europa.eu/consumers/odr
          </a>
          .
        </p>
      </section>
    </main>
  );
}
