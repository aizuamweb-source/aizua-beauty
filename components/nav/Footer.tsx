import Link from "next/link";
import Image from "next/image";

const ACADEMY_URL = "https://aizualabs-academy.vercel.app";
const CONSULTING_URL = "https://aizualabs-consulting.vercel.app";
const STORE_URL = "https://aizua-store.vercel.app";

export default function Footer({ locale }: { locale: string }) {
  const isEs = locale === "es";

  const legalLinks = [
    { slug: "privacidad", label: isEs ? "Privacidad" : "Privacy" },
    { slug: "devoluciones", label: isEs ? "Devoluciones" : "Returns" },
    { slug: "cookies", label: "Cookies" },
    { slug: "aviso-legal", label: isEs ? "Aviso legal" : "Legal notice" },
    { slug: "terminos", label: isEs ? "Términos" : "Terms" },
  ];

  return (
    <footer
      style={{
        background: "#1A1A2E",
        padding: "3rem 2.5rem",
        marginTop: "2rem",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1.25rem",
        }}
      >
        <Image
          src="/logo.png"
          alt="Aizüa"
          width={240}
          height={80}
          style={{
            objectFit: "contain",
            height: "56px",
            width: "auto",
            filter: "brightness(0) invert(1)",
          }}
        />
        <div
          style={{
            display: "flex",
            gap: "1.5rem",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <Link
            href={`/${locale}/blog`}
            style={{ color: "#999", fontSize: "0.78rem", fontWeight: 600 }}
          >
            Blog
          </Link>
          <a
            href={ACADEMY_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#999", fontSize: "0.78rem", fontWeight: 600 }}
          >
            Academy
          </a>
          <a
            href={CONSULTING_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#999", fontSize: "0.78rem", fontWeight: 600 }}
          >
            Consulting
          </a>
          <a
            href={STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#999", fontSize: "0.78rem", fontWeight: 600 }}
          >
            Aizüa Store
          </a>
          <span style={{ color: "#444", fontSize: "0.6rem" }}>|</span>
          {legalLinks.map(({ slug, label }) => (
            <Link
              key={slug}
              href={`/${locale}/legal/${slug}`}
              style={{ color: "#999", fontSize: "0.78rem" }}
            >
              {label}
            </Link>
          ))}
        </div>
        <span style={{ color: "#999", fontSize: "0.82rem" }}>
          © 2026 Aizüa ·{" "}
          {isEs ? "Todos los derechos reservados" : "All rights reserved"}
        </span>
      </div>
    </footer>
  );
}
