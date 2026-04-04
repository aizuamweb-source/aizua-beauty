-- ============================================================
-- AIZUA — Supabase Schema: knowledge_base
-- Módulo 7.3 (Fase 3) — Agente Soporte
--
-- El agente de chat consulta esta tabla SIEMPRE antes de
-- responder con Claude API. Si la respuesta ya está aquí,
-- no consume tokens. Si no está, Claude responde y se puede
-- guardar la nueva entrada manualmente.
--
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS knowledge_base (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Contenido multiidioma
  -- question: { es, en, fr, it } — cómo formula el usuario la pregunta
  -- answer:   { es, en, fr, it } — respuesta oficial de la tienda
  question    JSONB NOT NULL,
  answer      JSONB NOT NULL,

  -- Clasificación
  category    TEXT NOT NULL DEFAULT 'general',
  -- Valores sugeridos:
  --   'producto'      — características, materiales, tallas
  --   'envio'         — plazos, tracking, países de entrega
  --   'devolucion'    — política, cómo iniciar, plazos
  --   'pago'          — métodos, seguridad, factura
  --   'pedido'        — estado, modificar, cancelar
  --   'contacto'      — email, teléfono, horario
  --   'consulting'    — info sobre servicios B2B (pre-venta)
  --   'academy'       — info sobre cursos
  --   'general'       — resto

  -- Tags para búsqueda semántica futura
  tags        TEXT[] DEFAULT '{}',

  -- Aliases: palabras clave que disparan esta entrada
  -- Ej: ["reembolso","devolución","cambio","devolver"]
  aliases     TEXT[] DEFAULT '{}',

  -- Control
  active      BOOLEAN NOT NULL DEFAULT true,
  priority    INTEGER NOT NULL DEFAULT 0,  -- mayor número = mayor prioridad en resultados
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Índices ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_kb_category ON knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_kb_active    ON knowledge_base(active);
-- Índice GIN para búsqueda de texto en JSONB (pregunta y respuesta)
CREATE INDEX IF NOT EXISTS idx_kb_question  ON knowledge_base USING GIN(question);
CREATE INDEX IF NOT EXISTS idx_kb_aliases   ON knowledge_base USING GIN(aliases);

-- ── Trigger updated_at ────────────────────────────────────
CREATE TRIGGER kb_updated_at
  BEFORE UPDATE ON knowledge_base
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── RLS ───────────────────────────────────────────────────
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede leer entradas activas (el widget es público)
CREATE POLICY "Public read active entries" ON knowledge_base
  FOR SELECT USING (active = true);

-- Solo service_role puede crear/modificar/borrar
CREATE POLICY "Service role full access" ON knowledge_base
  FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ── FUNCIÓN: buscar en knowledge_base por texto ───────────
-- Busca en aliases y en question de un idioma dado.
-- Devuelve las entradas más relevantes (máx. 3).
-- Usada por el agente de chat antes de llamar a Claude API.
CREATE OR REPLACE FUNCTION search_knowledge_base(
  query_text TEXT,
  lang       TEXT DEFAULT 'es',
  max_rows   INTEGER DEFAULT 3
)
RETURNS TABLE (
  id       UUID,
  category TEXT,
  question TEXT,
  answer   TEXT,
  priority INTEGER
) LANGUAGE sql STABLE AS $$
  SELECT
    id,
    category,
    COALESCE(question ->> lang, question ->> 'en', '') AS question,
    COALESCE(answer   ->> lang, answer   ->> 'en', '') AS answer,
    priority
  FROM knowledge_base
  WHERE active = true
    AND (
      -- Búsqueda en aliases (array de palabras clave)
      EXISTS (
        SELECT 1 FROM unnest(aliases) a
        WHERE lower(a) LIKE '%' || lower(query_text) || '%'
      )
      -- O búsqueda en el texto de la pregunta del idioma
      OR lower(COALESCE(question ->> lang, question ->> 'en', '')) LIKE '%' || lower(query_text) || '%'
    )
  ORDER BY priority DESC
  LIMIT max_rows;
$$;


-- ── DATOS INICIALES ───────────────────────────────────────
-- Entradas base para el agente de soporte de Aizüa Store.
-- Ampliar desde el panel de administración o directamente en Supabase.

INSERT INTO knowledge_base (question, answer, category, aliases, priority) VALUES

-- ENVÍO
(
  '{"es":"¿Cuánto tarda el envío?","en":"How long does shipping take?","fr":"Combien de temps prend la livraison?","it":"Quanto tempo richiede la spedizione?"}',
  '{"es":"El plazo de entrega estándar es de 10 a 20 días hábiles. Una vez enviado tu pedido, recibirás un email con el número de seguimiento. Los retrasos en aduanas son ocasionales y pueden añadir 3-5 días.","en":"Standard delivery takes 10 to 20 business days. Once your order ships you will receive a tracking email. Customs delays are occasional and may add 3-5 days.","fr":"La livraison standard prend 10 à 20 jours ouvrables. Vous recevrez un email de suivi après expédition.","it":"La consegna standard richiede 10-20 giorni lavorativi. Riceverai un\'email di tracciamento dopo la spedizione."}',
  'envio',
  ARRAY['envío','envio','entrega','cuánto tarda','días','shipping','delivery','livraison','expédition'],
  10
),

-- SEGUIMIENTO
(
  '{"es":"¿Cómo puedo rastrear mi pedido?","en":"How can I track my order?","fr":"Comment suivre ma commande?","it":"Come posso tracciare il mio ordine?"}',
  '{"es":"Cuando tu pedido salga de almacén, te enviamos un email con el número de seguimiento. Puedes usarlo en 17track.net o en el sitio web de la empresa de transporte indicada.","en":"When your order leaves the warehouse, we send you a tracking number by email. You can track it on 17track.net or the carrier website.","fr":"Nous vous enverrons un email avec le numéro de suivi. Utilisez 17track.net pour suivre votre colis.","it":"Invieremo un\'email con il numero di tracciamento. Usa 17track.net per seguire il tuo pacco."}',
  'pedido',
  ARRAY['rastrear','seguimiento','tracking','número de seguimiento','dónde está','track','tracciamento'],
  9
),

-- DEVOLUCIONES
(
  '{"es":"¿Puedo devolver un producto?","en":"Can I return a product?","fr":"Puis-je retourner un produit?","it":"Posso restituire un prodotto?"}',
  '{"es":"Sí, tienes 14 días naturales desde la recepción para ejercer tu derecho de desistimiento. El producto debe estar sin usar y en su embalaje original. Los gastos de devolución corren a cargo del cliente según el artículo 107.2 TRLGDCU. Escríbenos a hola@aizua.es para iniciar el proceso.","en":"Yes, you have 14 calendar days from receipt to exercise your right of withdrawal. The product must be unused and in its original packaging. Return shipping costs are the customer\'s responsibility (Art. 107.2 TRLGDCU). Email us at hola@aizua.es to start the process.","fr":"Vous avez 14 jours calendaires à compter de la réception pour exercer votre droit de rétractation. Les frais de retour sont à votre charge.","it":"Hai 14 giorni dalla ricezione per esercitare il diritto di recesso. Le spese di reso sono a carico del cliente."}',
  'devolucion',
  ARRAY['devolver','devolución','devoluciones','reembolso','retorno','cambio','desistimiento','return','refund','retourner'],
  10
),

-- PAGO / SEGURIDAD
(
  '{"es":"¿Es seguro pagar aquí?","en":"Is it safe to pay here?","fr":"Est-il sécurisé de payer ici?","it":"È sicuro pagare qui?"}',
  '{"es":"Sí, totalmente. Los pagos se procesan a través de Stripe, líder mundial en pagos online. Nunca almacenamos tus datos bancarios. La conexión está cifrada con SSL/TLS.","en":"Yes, completely. Payments are processed via Stripe, a global leader in online payments. We never store your card details. All connections are SSL/TLS encrypted.","fr":"Oui, absolument. Les paiements sont traités par Stripe. Nous ne stockons jamais vos coordonnées bancaires.","it":"Sì, assolutamente. I pagamenti sono elaborati da Stripe. Non conserviamo mai i tuoi dati bancari."}',
  'pago',
  ARRAY['seguro','pago','tarjeta','stripe','ssl','datos','safe','payment','secure','sécurisé'],
  8
),

-- FACTURA
(
  '{"es":"¿Puedo obtener factura?","en":"Can I get an invoice?","fr":"Puis-je obtenir une facture?","it":"Posso ottenere una fattura?"}',
  '{"es":"Sí. Escríbenos a hola@aizua.es con tu número de pedido y tus datos fiscales (nombre, NIF/CIF, dirección) y te enviamos la factura en 24-48h.","en":"Yes. Email hola@aizua.es with your order number and tax details (name, VAT number, address) and we will send an invoice within 24-48h.","fr":"Oui. Écrivez à hola@aizua.es avec votre numéro de commande et vos données fiscales.","it":"Sì. Scrivi a hola@aizua.es con il numero d\'ordine e i tuoi dati fiscali."}',
  'pago',
  ARRAY['factura','invoice','facture','fattura','recibo','NIF','CIF','empresa','B2B'],
  7
),

-- CONTACTO
(
  '{"es":"¿Cómo puedo contactar con vosotros?","en":"How can I contact you?","fr":"Comment puis-je vous contacter?","it":"Come posso contattarvi?"}',
  '{"es":"Puedes escribirnos a hola@aizua.es. Respondemos en un plazo de 24-48h laborables (lunes a viernes). Para urgencias, responde al email de confirmación de tu pedido.","en":"You can email us at hola@aizua.es. We reply within 24-48 business hours (Mon-Fri). For urgent matters, reply to your order confirmation email.","fr":"Écrivez-nous à hola@aizua.es. Nous répondons sous 24-48h ouvrées.","it":"Scrivici a hola@aizua.es. Rispondiamo entro 24-48 ore lavorative."}',
  'contacto',
  ARRAY['contacto','contact','email','correo','escribir','hablar','teléfono','ayuda','help'],
  6
),

-- CONSULTING (pre-venta)
(
  '{"es":"¿Ofrecéis servicios de consultoría?","en":"Do you offer consulting services?","fr":"Proposez-vous des services de conseil?","it":"Offrite servizi di consulenza?"}',
  '{"es":"Sí, Aizüa Labs ofrece consultoría B2B especializada en automatización de e-commerce y procesos digitales. Para más información y una llamada gratuita de discovery, escríbenos a consulting@aizua.es o visita aizua.es.","en":"Yes, Aizüa Labs offers B2B consulting specializing in e-commerce automation and digital processes. For more info and a free discovery call, email consulting@aizua.es or visit aizua.es.","fr":"Oui, Aizüa Labs propose des services de conseil B2B. Contactez consulting@aizua.es.","it":"Sì, Aizüa Labs offre consulenza B2B. Contattaci a consulting@aizua.es."}',
  'consulting',
  ARRAY['consultoría','consulting','B2B','empresa','automatización','servicios','negocio','ecommerce'],
  5
);

-- ============================================================
-- RESUMEN
-- Tabla: knowledge_base
-- Función: search_knowledge_base(query_text, lang, max_rows)
-- Entradas iniciales: 7 (envío, tracking, devolución, pago, factura, contacto, consulting)
--
-- Siguiente paso (Miguel): ejecutar en Supabase Dashboard
-- Ampliar entradas desde panel o directamente en SQL Editor
-- ============================================================
