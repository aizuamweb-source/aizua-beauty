"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

/**
 * Imágenes de Unsplash — nicho beauty / skincare / mujer natural.
 * SIN packaging de marcas de la competencia visible.
 * Todas uso libre. Cambiar por fotos propias cuando estén disponibles.
 *
 * Créditos:
 * 1. Anastasiia Ostapovych — woman applying serum (sin texto en envase)
 * 2. Polina Kovaleva       — woman glowing skin natural light
 * 3. Ron Lach              — woman beauty portrait natural light
 * 4. Content Pixie         — botanical skincare flatlay con hojas verdes
 */
const SLIDES = [
  {
    src: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=1800&q=85",
    alt: "Sérum facial hidratante natural",
    pos: "center 30%",
  },
  {
    src: "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=1800&q=85",
    alt: "Rutina de belleza skincare natural",
    pos: "center 35%",
  },
  {
    src: "https://images.unsplash.com/photo-1487412912498-0447578fcca8?auto=format&fit=crop&w=1800&q=85",
    alt: "Mujer belleza natural luz cálida",
    pos: "center 20%",
  },
  {
    src: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1800&q=85",
    alt: "Cosmética botánica con hojas verdes",
    pos: "center 45%",
  },
];

const INTERVAL = 6000; // ms per slide

interface Props {
  locale: string;
  T: {
    hero_tag: string;
    hero_title1: string;
    hero_title2: string;
    hero_sub: string;
    cta_shop: string;
    /** CTA secundario. Reapuntado al blog en s229 (ver DESACTIVACION_*.md). */
    cta_secondary: string;
  };
}

export default function HeroSlider({ locale, T }: Props) {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % SLIDES.length);
  }, []);

  useEffect(() => {
    const t = setInterval(next, INTERVAL);
    return () => clearInterval(t);
  }, [next]);

  return (
    <section
      style={{
        position: "relative",
        height: "100svh",
        minHeight: "580px",
        maxHeight: "920px",
        overflow: "hidden",
      }}
    >
      {/* ── SLIDES ── */}
      {SLIDES.map((slide, i) => (
        <div
          key={i}
          aria-hidden={i !== current}
          style={{
            position: "absolute",
            inset: 0,
            opacity: i === current ? 1 : 0,
            transition: "opacity 1.4s cubic-bezier(0.4,0,0.2,1)",
            zIndex: i === current ? 1 : 0,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={slide.src}
            alt={slide.alt}
            loading={i === 0 ? "eager" : "lazy"}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: slide.pos,
              /* Ken-burns zoom-in: se resetea al activarse */
              animation: i === current ? "beautyKenBurns 7s ease-in-out forwards" : "none",
              willChange: "transform",
            }}
          />
        </div>
      ))}

      {/* ── OVERLAY GRADIENTE ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.42) 55%, rgba(0,0,0,0.62) 100%)",
        }}
      />

      {/* ── CONTENIDO HERO ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 3,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "80px 2rem 4rem",
        }}
      >
        {/* Tag */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            marginBottom: "1.4rem",
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "#A8C68A",
              display: "inline-block",
            }}
          />
          <span
            style={{
              fontSize: "0.7rem",
              color: "#A8C68A",
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
            }}
          >
            {T.hero_tag}
          </span>
        </div>

        {/* Título */}
        <h1
          style={{
            fontFamily: "var(--font-cormorant, Georgia, serif)",
            fontSize: "clamp(2.8rem, 6.5vw, 5.2rem)",
            fontWeight: 300,
            lineHeight: 1.1,
            color: "#fff",
            margin: "0 0 0.5rem",
            letterSpacing: "-0.01em",
            maxWidth: "820px",
            textShadow: "0 2px 20px rgba(0,0,0,0.25)",
          }}
        >
          {T.hero_title1}{" "}
          <em
            style={{
              fontStyle: "italic",
              color: "#C9E0A8",
              fontWeight: 400,
            }}
          >
            {T.hero_title2}
          </em>
        </h1>

        {/* Subtítulo */}
        <p
          style={{
            color: "rgba(255,255,255,0.88)",
            fontSize: "clamp(14px, 1.7vw, 17px)",
            lineHeight: 1.65,
            maxWidth: "500px",
            margin: "1rem auto 2.2rem",
            textShadow: "0 1px 8px rgba(0,0,0,0.3)",
          }}
        >
          {T.hero_sub}
        </p>

        {/* CTAs */}
        <div
          style={{
            display: "flex",
            gap: "1rem",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Link
            href={`/${locale}/tienda`}
            style={{
              background: "#7BA05B",
              color: "#fff",
              padding: "0.88rem 2.4rem",
              borderRadius: "50px",
              fontWeight: 700,
              fontSize: "0.85rem",
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              textDecoration: "none",
              boxShadow: "0 4px 24px rgba(123,160,91,0.45)",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
          >
            {T.cta_shop}
          </Link>
          <Link
            href={`/${locale}/blog`}
            style={{
              background: "rgba(255,255,255,0.12)",
              color: "#fff",
              border: "1.5px solid rgba(255,255,255,0.65)",
              padding: "0.88rem 2.4rem",
              borderRadius: "50px",
              fontWeight: 700,
              fontSize: "0.85rem",
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              textDecoration: "none",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
            }}
          >
            {T.cta_secondary}
          </Link>
        </div>

        {/* Stats */}
        <div
          style={{
            display: "flex",
            gap: "2.5rem",
            justifyContent: "center",
            marginTop: "2.5rem",
            flexWrap: "wrap",
          }}
        >
          {[
            { num: "EU", label: locale === "es" ? "Selección" : "Curated" },
            { num: "5-10d", label: locale === "es" ? "Envío" : "Shipping" },
            { num: "4.9★", label: locale === "es" ? "Valoración" : "Rating" },
          ].map((s) => (
            <div key={s.num} style={{ textAlign: "center" }}>
              <div
                style={{
                  fontFamily: "var(--font-cormorant)",
                  fontSize: "1.9rem",
                  fontWeight: 600,
                  color: "#C9E0A8",
                  lineHeight: 1,
                  textShadow: "0 1px 8px rgba(0,0,0,0.2)",
                }}
              >
                {s.num}
              </div>
              <div
                style={{
                  fontSize: "0.65rem",
                  color: "rgba(255,255,255,0.72)",
                  letterSpacing: "0.1em",
                  marginTop: "4px",
                  textTransform: "uppercase",
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Dots */}
        <div
          style={{
            display: "flex",
            gap: "0.45rem",
            marginTop: "2.2rem",
            alignItems: "center",
          }}
        >
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Slide ${i + 1}`}
              style={{
                width: i === current ? "26px" : "8px",
                height: "8px",
                borderRadius: "4px",
                border: "none",
                cursor: "pointer",
                background:
                  i === current ? "#7BA05B" : "rgba(255,255,255,0.45)",
                transition: "all 0.4s ease",
                padding: 0,
              }}
            />
          ))}
        </div>
      </div>

      {/* ── KEYFRAME KEN-BURNS ── */}
      <style>{`
        @keyframes beautyKenBurns {
          0%   { transform: scale(1.04); }
          100% { transform: scale(1.18); }
        }
      `}</style>
    </section>
  );
}
