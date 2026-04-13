import Link from "next/link";
import Image from "next/image";
import { SOCIAL } from "@/lib/social-config";

const ACADEMY_URL    = "https://aizualabs-academy.vercel.app";
const CONSULTING_URL = "https://aizualabs-consulting.vercel.app";
const STORE_URL      = "https://aizua-store.vercel.app";

const iconStyle = { width: 18, height: 18, fill: "#aaa", display: "block" as const };

function SocialLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label}
      style={{ color: "#aaa", display: "flex", alignItems: "center" }}>
      {children}
    </a>
  );
}

export default function Footer({ locale }: { locale: string }) {
  const isEs = locale === "es";

  const legalLinks = [
    { slug: "privacidad",   label: isEs ? "Privacidad"   : "Privacy" },
    { slug: "devoluciones", label: isEs ? "Devoluciones" : "Returns" },
    { slug: "cookies",      label: "Cookies" },
    { slug: "aviso-legal",  label: isEs ? "Aviso legal"  : "Legal notice" },
    { slug: "terminos",     label: isEs ? "Términos"     : "Terms" },
  ];

  return (
    <footer style={{ background: "#1A1A2E", padding: "2.5rem 2rem", marginTop: "2rem" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem" }}>

        {/* Logo */}
        <Image src="/logo.png" alt="AizuaBeauty" width={200} height={70}
          style={{ objectFit: "contain", height: "48px", width: "auto", filter: "brightness(0) invert(1)" }} />

        {/* Social icons — Beauty + Sophie Marem */}
        <div style={{ display: "flex", gap: "1.25rem", alignItems: "center" }}>
          <SocialLink href={SOCIAL.beauty.instagram} label="Instagram @aizuabeauty">
            <svg viewBox="0 0 24 24" style={iconStyle}><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
          </SocialLink>
          <SocialLink href={SOCIAL.sophie.instagram} label="Instagram @sophie.marem">
            <svg viewBox="0 0 24 24" style={iconStyle}><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
          </SocialLink>
          <SocialLink href={SOCIAL.beauty.pinterest} label="Pinterest AizuaBeauty">
            <svg viewBox="0 0 24 24" style={iconStyle}><path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/></svg>
          </SocialLink>
          <SocialLink href={SOCIAL.beauty.x} label="X @Aizuabrand">
            <svg viewBox="0 0 24 24" style={iconStyle}><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.262 5.638L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </SocialLink>
          <SocialLink href={SOCIAL.aizualabs.linkedin} label="LinkedIn AizuaLabs">
            <svg viewBox="0 0 24 24" style={iconStyle}><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
          </SocialLink>
        </div>

        {/* Nav links */}
        <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap", justifyContent: "center" }}>
          <Link href={`/${locale}/blog`} style={{ color: "#999", fontSize: "0.78rem", fontWeight: 600 }}>Blog</Link>
          <a href={ACADEMY_URL}    target="_blank" rel="noopener noreferrer" style={{ color: "#999", fontSize: "0.78rem", fontWeight: 600 }}>Academy</a>
          <a href={CONSULTING_URL} target="_blank" rel="noopener noreferrer" style={{ color: "#999", fontSize: "0.78rem", fontWeight: 600 }}>Consulting</a>
          <a href={STORE_URL}      target="_blank" rel="noopener noreferrer" style={{ color: "#999", fontSize: "0.78rem", fontWeight: 600 }}>Aizüa Store</a>
          <span style={{ color: "#444", fontSize: "0.6rem" }}>|</span>
          {legalLinks.map(({ slug, label }) => (
            <Link key={slug} href={`/${locale}/legal/${slug}`} style={{ color: "#999", fontSize: "0.78rem" }}>{label}</Link>
          ))}
        </div>

        <span style={{ color: "#666", fontSize: "0.78rem" }}>
          © 2026 AizuaBeauty · {isEs ? "Todos los derechos reservados" : "All rights reserved"}
        </span>
      </div>
    </footer>
  );
}
