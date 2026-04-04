"use client";
import Link from "next/link";
import NavCartButton from "./NavCartButton";

const AIZUASTORE_URL = "https://aizua-store.vercel.app";

export default function MainNav({ locale }: { locale: string }) {
  const isEs = locale === "es";
  const otherLocale = isEs ? "en" : "es";

  const links = [
    { href: `/${locale}/tienda`, label: isEs ? "SKINCARE & MODA" : "SKINCARE & FASHION", external: false },
    { href: `/${locale}/ringana`, label: "RINGANA", external: false },
    { href: `/${locale}/blog`, label: "BLOG", external: false },
  ];

  return (
    <>
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: "rgba(250,248,245,0.97)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid #EDE9E3",
        height: "80px",
        display: "flex", alignItems: "center",
        boxShadow: "0 1px 10px rgba(0,0,0,0.05)",
      }}>
        <div style={{
          maxWidth: "1200px", margin: "0 auto", width: "100%",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 2rem",
        }}>
          {/* Logo — text-based for now, replace with /logo-beauty.png when available */}
          <Link href={`/${locale}`} style={{
            flexShrink: 0,
            fontFamily: "var(--font-cormorant, Georgia, serif)",
            fontSize: "1.6rem",
            fontWeight: 600,
            letterSpacing: "0.06em",
            color: "#2C2C2C",
          }}>
            Aizüa<span style={{ color: "#7BA05B" }}>Beauty</span>
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div className="nav-text-links">
              {links.map((l) =>
                l.external ? (
                  <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer"
                    style={{ color: "#6B6B6B", fontSize: "0.82rem", fontWeight: 700, letterSpacing: "0.06em" }}>
                    {l.label}
                  </a>
                ) : (
                  <Link key={l.href} href={l.href}
                    style={{ color: "#6B6B6B", fontSize: "0.82rem", fontWeight: 700, letterSpacing: "0.06em" }}>
                    {l.label}
                  </Link>
                )
              )}
            </div>

            {/* Language toggle */}
            <Link href={`/${otherLocale}`} style={{
              background: "#7BA05B", color: "#fff",
              fontSize: "0.7rem", fontWeight: 700,
              padding: "0.3rem 0.6rem", borderRadius: "5px",
              letterSpacing: "0.05em", marginLeft: "0.5rem",
            }}>
              {otherLocale.toUpperCase()}
            </Link>

            <NavCartButton locale={locale} />
          </div>
        </div>
      </nav>

      {/* Mobile bottom nav */}
      <div className="mobile-bottom-nav" style={{
        display: "none",
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 99,
        background: "rgba(250,248,245,0.97)", backdropFilter: "blur(10px)",
        borderTop: "1px solid #EDE9E3",
        boxShadow: "0 -2px 10px rgba(0,0,0,0.05)",
        padding: "8px 0 10px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center" }}>
          {[
            { href: `/${locale}/tienda`, label: isEs ? "Tienda" : "Shop", color: "#7BA05B",
              svg: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7BA05B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg> },
            { href: `/${locale}/ringana`, label: "Ringana", color: "#C4748A",
              svg: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C4748A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg> },
            { href: `/${locale}/blog`, label: "Blog", color: "#D4A896",
              svg: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4A896" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg> },
          ].map((item) => (
            <Link key={item.label} href={item.href} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: "3px",
              color: item.color, fontSize: "0.65rem", fontWeight: 700,
              letterSpacing: "0.04em", textTransform: "uppercase", padding: "0 12px",
            }}>
              {item.svg}{item.label}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
