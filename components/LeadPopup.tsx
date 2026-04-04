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
    title: '10% en tu primera compra',
    subtitle: 'Suscribete y recibe el codigo en tu email.',
    placeholder: 'tu@email.com',
    cta: 'Quiero mi descuento',
    close: 'No, gracias',
    success: 'Tu codigo es',
    couponLabel: 'Copia este codigo al hacer el pedido',
    terms: 'Sin spam. Cancela cuando quieras.',
  },
  en: {
    title: '10% off your first order',
    subtitle: 'Subscribe and receive the code in your inbox.',
    placeholder: 'your@email.com',
    cta: 'Get my discount',
    close: 'No thanks',
    success: 'Your code is',
    couponLabel: 'Copy this code at checkout',
    terms: 'No spam. Unsubscribe anytime.',
  },
  fr: {
    title: '10% sur votre 1ere commande',
    subtitle: 'Abonnez-vous et recevez le code par email.',
    placeholder: 'votre@email.com',
    cta: "J'en profite",
    close: 'Non merci',
    success: 'Votre code est',
    couponLabel: 'Copiez ce code a la commande',
    terms: 'Pas de spam. Desabonnez-vous a tout moment.',
  },
  de: {
    title: '10% Rabatt auf Ihre erste Bestellung',
    subtitle: 'Jetzt anmelden und Code per E-Mail erhalten.',
    placeholder: 'ihre@email.com',
    cta: 'Rabatt sichern',
    close: 'Nein danke',
    success: 'Ihr Code lautet',
    couponLabel: 'Diesen Code beim Checkout eingeben',
    terms: 'Kein Spam. Jederzeit abmelden.',
  },
  pt: {
    title: '10% na sua primeira compra',
    subtitle: 'Subscreva e receba o codigo no seu email.',
    placeholder: 'seu@email.com',
    cta: 'Quero o desconto',
    close: 'Nao, obrigado',
    success: 'O seu codigo e',
    couponLabel: 'Copie este codigo no checkout',
    terms: 'Sem spam. Cancele quando quiser.',
  },
  it: {
    title: '10% sul tuo primo ordine',
    subtitle: 'Iscriviti e ricevi il codice via email.',
    placeholder: 'tua@email.com',
    cta: 'Voglio lo sconto',
    close: 'No grazie',
    success: 'Il tuo codice e',
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
    const timer = setTimeout(() => setVisible(true), DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    setCookie(COOKIE_KEY, '1', COOKIE_DAYS);
    setVisible(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) { setError('Email invalido'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, locale, source: 'popup_welcome10' }),
      });
      if (res.ok) { setSuccess(true); setCookie(COOKIE_KEY, '1', COOKIE_DAYS); }
      else { const data = await res.json().catch(() => ({})); setError(data?.error || 'Error.'); }
    } catch { setError('Error de conexion.'); }
    finally { setLoading(false); }
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
      {/* Overlay */}
      <div onClick={dismiss} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
        zIndex: 9998, backdropFilter: 'blur(4px)',
      }} />

      {/* Modal */}
      <div role="dialog" aria-modal="true" style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)', zIndex: 9999,
        width: 'min(90vw, 400px)', overflow: 'hidden', fontFamily: 'inherit',
        background: '#0F172A', borderRadius: '20px',
        border: '1px solid rgba(201,168,76,0.2)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 60px rgba(201,168,76,0.06)',
      }}>
        {/* Top accent line */}
        <div style={{ height: 3, background: 'linear-gradient(90deg, #00C9B1, #C9A84C, #00C9B1)' }} />

        {/* Close */}
        <button onClick={dismiss} aria-label="Cerrar" style={{
          position: 'absolute', top: 14, right: 14, background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)',
          width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', fontSize: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.2s',
        }}>×</button>

        {/* Content */}
        <div style={{ padding: '32px 28px 28px', textAlign: 'center' }}>

          {!success ? (
            <>
              {/* Discount number */}
              <div style={{
                fontSize: 56, fontWeight: 900, lineHeight: 1,
                background: 'linear-gradient(135deg, #E8C96A, #C9A84C)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                letterSpacing: '-2px', marginBottom: 4,
                filter: 'drop-shadow(0 0 24px rgba(201,168,76,0.3))',
              }}>-10%</div>

              <h2 style={{
                color: '#fff', fontSize: 17, fontWeight: 700,
                margin: '0 0 6px', lineHeight: 1.35,
              }}>{t.title}</h2>

              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: '0 0 22px' }}>
                {t.subtitle}
              </p>

              <form onSubmit={handleSubmit}>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder={t.placeholder} required
                  style={{
                    width: '100%', padding: '12px 16px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 10, fontSize: 14, color: '#fff',
                    outline: 'none', boxSizing: 'border-box',
                    marginBottom: error ? 8 : 12,
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#00C9B1')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
                />
                {error && <p style={{ color: '#f87171', fontSize: 12, margin: '0 0 8px' }}>{error}</p>}

                <button type="submit" disabled={loading} style={{
                  width: '100%', padding: 13,
                  background: loading ? '#334155' : 'linear-gradient(135deg, #00C9B1, #00A896)',
                  color: '#fff', border: 'none', borderRadius: 10,
                  fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                  marginBottom: 14, transition: 'opacity 0.2s',
                  boxShadow: '0 4px 20px rgba(0,201,177,0.25)',
                }}>{loading ? '...' : t.cta}</button>

                <button type="button" onClick={dismiss} style={{
                  display: 'block', width: '100%', background: 'none', border: 'none',
                  color: 'rgba(255,255,255,0.35)', fontSize: 12, cursor: 'pointer',
                  marginBottom: 8, textDecoration: 'underline',
                }}>{t.close}</button>

                <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, textAlign: 'center', margin: 0 }}>
                  {t.terms}
                </p>
              </form>
            </>
          ) : (
            <div>
              <div style={{ fontSize: 44, marginBottom: 10 }}>🎉</div>
              <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 6, color: '#fff' }}>{t.success}</p>
              <div onClick={handleCopy} title="Copy" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                background: 'rgba(0,201,177,0.08)', border: '2px dashed rgba(0,201,177,0.4)',
                borderRadius: 10, padding: '14px 20px', margin: '12px 0', cursor: 'pointer',
              }}>
                <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 22, letterSpacing: 3, color: '#00C9B1' }}>
                  {COUPON_CODE}
                </span>
                <span style={{ fontSize: 18 }}>{copied ? '✓' : '📋'}</span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginBottom: 16 }}>
                {copied ? '¡Copiado!' : t.couponLabel}
              </p>
              <button onClick={dismiss} style={{
                background: 'linear-gradient(135deg, #00C9B1, #00A896)', color: '#fff',
                border: 'none', borderRadius: 10, padding: '12px 28px',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(0,201,177,0.25)',
              }}>
                {locale === 'es' ? 'Ir a la tienda' : 'Go to shop'} →
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
