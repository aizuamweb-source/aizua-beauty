'use client';

import { useState, useEffect } from 'react';

const COOKIE_KEY = 'aizua_lead_popup_dismissed';
const COOKIE_DAYS = 30;

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

interface LeadPopupProps {
  locale?: string;
}

const texts: Record<string, {
  title: string;
  subtitle: string;
  placeholder: string;
  cta: string;
  close: string;
  success: string;
  couponLabel: string;
  terms: string;
}> = {
  es: {
    title: '¡10% de descuento en tu primera compra!',
    subtitle: 'Suscríbete y recibe el código en tu email.',
    placeholder: 'tu@email.com',
    cta: 'Quiero mi descuento',
    close: 'No, gracias',
    success: '¡Listo! Tu código es',
    couponLabel: 'Copia este código al hacer el pedido',
    terms: 'Sin spam. Cancela cuando quieras.',
  },
  en: {
    title: 'Get 10% off your first order!',
    subtitle: 'Subscribe and receive the code in your inbox.',
    placeholder: 'your@email.com',
    cta: 'Get my discount',
    close: 'No thanks',
    success: 'Done! Your code is',
    couponLabel: 'Copy this code at checkout',
    terms: 'No spam. Unsubscribe anytime.',
  },
  fr: {
    title: '10% de réduction sur votre première commande !',
    subtitle: 'Abonnez-vous et recevez le code par email.',
    placeholder: 'votre@email.com',
    cta: "J'en profite",
    close: 'Non merci',
    success: "C'est fait ! Votre code est",
    couponLabel: 'Copiez ce code à la commande',
    terms: 'Pas de spam. Désabonnez-vous à tout moment.',
  },
  de: {
    title: '10% Rabatt auf Ihre erste Bestellung!',
    subtitle: 'Jetzt anmelden und Code per E-Mail erhalten.',
    placeholder: 'ihre@email.com',
    cta: 'Rabatt sichern',
    close: 'Nein danke',
    success: 'Fertig! Ihr Code lautet',
    couponLabel: 'Diesen Code beim Checkout eingeben',
    terms: 'Kein Spam. Jederzeit abmelden.',
  },
  pt: {
    title: '10% de desconto na sua primeira compra!',
    subtitle: 'Subscreva e receba o código no seu email.',
    placeholder: 'seu@email.com',
    cta: 'Quero o desconto',
    close: 'Não, obrigado',
    success: 'Pronto! O seu código é',
    couponLabel: 'Copie este código no checkout',
    terms: 'Sem spam. Cancele quando quiser.',
  },
  it: {
    title: '10% di sconto sul tuo primo ordine!',
    subtitle: 'Iscriviti e ricevi il codice via email.',
    placeholder: 'tua@email.com',
    cta: 'Voglio lo sconto',
    close: 'No grazie',
    success: 'Fatto! Il tuo codice è',
    couponLabel: 'Copia questo codice al checkout',
    terms: 'Niente spam. Cancella quando vuoi.',
  },
};

const COUPON_CODE = 'WELCOME10';
const DELAY_MS = 10000;

export default function LeadPopup({ locale = 'es' }: LeadPopupProps) {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const t = texts[locale] || texts['es'];

  useEffect(() => {
    if (getCookie(COOKIE_KEY)) return;
    const timer = setTimeout(() => {
      setVisible(true);
    }, DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    setCookie(COOKIE_KEY, '1', COOKIE_DAYS);
    setVisible(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Email inválido');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, locale, source: 'popup_welcome10' }),
      });
      if (res.ok) {
        setSuccess(true);
        setCookie(COOKIE_KEY, '1', COOKIE_DAYS);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || 'Error. Inténtalo de nuevo.');
      }
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(COUPON_CODE).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!visible) return null;

  return (
    <>
      <div
        onClick={dismiss}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.55)',
          zIndex: 9998,
          backdropFilter: 'blur(2px)',
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-popup-title"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9999,
          background: '#fff',
          borderRadius: '16px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
          width: 'min(90vw, 440px)',
          overflow: 'hidden',
          fontFamily: 'inherit',
        }}
      >
        <div
          style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            padding: '28px 28px 20px',
            textAlign: 'center',
            position: 'relative',
          }}
        >
          <button
            onClick={dismiss}
            aria-label="Cerrar"
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              color: '#fff',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              cursor: 'pointer',
              fontSize: '16px',
              lineHeight: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>
          <div
            style={{
              display: 'inline-block',
              background: '#f5a623',
              color: '#1a1a2e',
              fontWeight: 800,
              fontSize: '42px',
              lineHeight: 1,
              borderRadius: '12px',
              padding: '8px 16px',
              marginBottom: '12px',
            }}
          >
            -10%
          </div>
          <h2
            id="lead-popup-title"
            style={{
              color: '#fff',
              fontSize: '18px',
              fontWeight: 700,
              margin: '0 0 6px',
              lineHeight: 1.3,
            }}
          >
            {t.title}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '14px', margin: 0 }}>
            {t.subtitle}
          </p>
        </div>
        <div style={{ padding: '24px 28px 28px' }}>
          {!success ? (
            <form onSubmit={handleSubmit}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.placeholder}
                required
                style={{
                  width: '100%',
                  padding: '13px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '10px',
                  fontSize: '15px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  marginBottom: error ? '8px' : '14px',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#1a1a2e')}
                onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
              />
              {error && (
                <p style={{ color: '#ef4444', fontSize: '13px', margin: '0 0 10px' }}>
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: loading ? '#9ca3af' : '#f5a623',
                  color: '#1a1a2e',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '16px',
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  marginBottom: '14px',
                  transition: 'background 0.2s, transform 0.1s',
                }}
              >
                {loading ? '...' : t.cta}
              </button>
              <button
                type="button"
                onClick={dismiss}
                style={{
                  display: 'block',
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  color: '#9ca3af',
                  fontSize: '13px',
                  cursor: 'pointer',
                  marginBottom: '10px',
                  textDecoration: 'underline',
                }}
              >
                {t.close}
              </button>
              <p style={{ color: '#9ca3af', fontSize: '12px', textAlign: 'center', margin: 0 }}>
                {t.terms}
              </p>
            </form>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎉</div>
              <p style={{ fontWeight: 700, fontSize: '16px', marginBottom: '6px', color: '#1a1a2e' }}>
                {t.success}
              </p>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  background: '#f3f4f6',
                  border: '2px dashed #f5a623',
                  borderRadius: '10px',
                  padding: '14px 20px',
                  margin: '12px 0',
                  cursor: 'pointer',
                }}
                onClick={handleCopy}
                title="Copiar código"
              >
                <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '22px', letterSpacing: '3px', color: '#1a1a2e' }}>
                  {COUPON_CODE}
                </span>
                <span style={{ fontSize: '18px' }}>{copied ? '✓' : '📋'}</span>
              </div>
              <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '16px' }}>
                {copied ? '¡Copiado!' : t.couponLabel}
              </p>
              <button
                onClick={dismiss}
                style={{
                  background: '#1a1a2e',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '12px 28px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Ir a la tienda →
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
    }
