"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { getLocalizedName } from "@/lib/product-utils";

type Product = {
  id: string;
  slug: string;
  name: string | Record<string, string>;
  name_es?: string; name_en?: string; name_fr?: string;
  name_de?: string; name_pt?: string; name_it?: string;
  price: number;
  compare_price?: number;
  images?: string[];
  badge?: string | null;
  rating?: number;
  review_count?: number;
  category?: string;
};

const T: Record<string, Record<string, string>> = {
  es: {
    title: "TIENDA",
    subtitle: "Gadgets premium · Envío mundial",
    all: "Todos",
    sort_new: "Más recientes",
    sort_price_asc: "Precio ↑",
    sort_price_desc: "Precio ↓",
    sort_rating: "Mejor valorados",
    reviews: "reseñas",
    empty: "No se encontraron productos",
    back: "← Inicio",
    products: "productos",
    search: "Buscar productos...",
  },
  en: {
    title: "SHOP",
    subtitle: "Premium gadgets · Worldwide shipping",
    all: "All",
    sort_new: "Newest",
    sort_price_asc: "Price ↑",
    sort_price_desc: "Price ↓",
    sort_rating: "Best rated",
    reviews: "reviews",
    empty: "No products found",
    back: "← Home",
    products: "products",
    search: "Search products...",
  },
  fr: {
    title: "BOUTIQUE",
    subtitle: "Gadgets premium · Livraison mondiale",
    all: "Tous",
    sort_new: "Plus récents",
    sort_price_asc: "Prix ↑",
    sort_price_desc: "Prix ↓",
    sort_rating: "Mieux notés",
    reviews: "avis",
    empty: "Aucun produit trouvé",
    back: "← Accueil",
    products: "produits",
    search: "Rechercher...",
  },
  de: {
    title: "SHOP",
    subtitle: "Premium-Gadgets · Weltweiter Versand",
    all: "Alle",
    sort_new: "Neueste",
    sort_price_asc: "Preis ↑",
    sort_price_desc: "Preis ↓",
    sort_rating: "Beste Bewertung",
    reviews: "Bewertungen",
    empty: "Keine Produkte gefunden",
    back: "← Startseite",
    products: "Produkte",
    search: "Suchen...",
  },
  pt: {
    title: "LOJA",
    subtitle: "Gadgets premium · Envio mundial",
    all: "Todos",
    sort_new: "Mais recentes",
    sort_price_asc: "Preço ↑",
    sort_price_desc: "Preço ↓",
    sort_rating: "Melhor avaliados",
    reviews: "avaliações",
    empty: "Nenhum produto encontrado",
    back: "← Início",
    products: "produtos",
    search: "Pesquisar...",
  },
  it: {
    title: "NEGOZIO",
    subtitle: "Gadget premium · Spedizione mondiale",
    all: "Tutti",
    sort_new: "Più recenti",
    sort_price_asc: "Prezzo ↑",
    sort_price_desc: "Prezzo ↓",
    sort_rating: "Meglio valutati",
    reviews: "recensioni",
    empty: "Nessun prodotto trovato",
    back: "← Home",
    products: "prodotti",
    search: "Cerca...",
  },
};

type SortKey = "new" | "price_asc" | "price_desc" | "rating";

export default function CatalogoClient({
  products,
  locale,
}: {
  products: Product[];
  locale: string;
}) {
  const t = T[locale] || T.en;

  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortKey>("new");
  const [search, setSearch] = useState("");
  const [catOpen, setCatOpen] = useState(false);

  const categories = useMemo(() => {
    const cats = products
      .map((p) => p.category)
      .filter((c): c is string => Boolean(c));
    return ["all", ...Array.from(new Set(cats))];
  }, [products]);

  const filtered = useMemo(() => {
    let result = [...products];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p) => {
        const name = getLocalizedName(p as Record<string, unknown>, locale);
        return name.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q);
      });
    }
    if (activeCategory !== "all") {
      result = result.filter((p) => p.category === activeCategory);
    }
    switch (sortBy) {
      case "price_asc": result.sort((a, b) => a.price - b.price); break;
      case "price_desc": result.sort((a, b) => b.price - a.price); break;
      case "rating": result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)); break;
      default: break;
    }
    return result;
  }, [products, activeCategory, sortBy, search]);

  return (
    <div>
      <div style={{ paddingTop: "84px", background: "#fff", borderBottom: "1px solid #E8EAED" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0.6rem 2.5rem 0.75rem", display: "flex", alignItems: "baseline", gap: "1rem", flexWrap: "wrap" }}>
          <h1 style={{ fontFamily: "var(--font-bebas)", fontSize: "clamp(1.4rem, 3vw, 1.8rem)", lineHeight: 1, color: "#1A1A2E", margin: 0, letterSpacing: "0.02em" }}>
            {t.title}
          </h1>
          <span style={{ color: "#aaa", fontSize: "0.78rem", letterSpacing: "0.04em" }}>{t.subtitle}</span>
          <Link href={`/${locale}`} style={{ color: "#bbb", textDecoration: "none", fontSize: "0.75rem", marginLeft: "auto" }}>
            {t.back}
          </Link>
        </div>
      </div>

      <div style={{ padding: "0.6rem 2.5rem 0.4rem", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ marginBottom: "0.5rem" }}>
          <input type="text" placeholder={t.search} value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", maxWidth: "400px", background: "#fff", border: "1px solid #E8EAED", borderRadius: "8px", padding: "0.5rem 1rem", color: "#1A1A2E", fontSize: "0.875rem", outline: "none", boxSizing: "border-box", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }} />
        </div>
        {/* Collapsible category filter */}
        <div style={{ marginBottom: "0.45rem", position: "relative" }}>
          <button onClick={() => setCatOpen(o => !o)}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.45rem 1rem", borderRadius: "8px", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", border: "1px solid #E8EAED", background: "#fff", color: "#1A1A2E", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <span>{activeCategory === "all" ? t.all : activeCategory}</span>
            <span style={{ fontSize: "0.7rem", color: "#00C9B1" }}>{catOpen ? "▲" : "▼"}</span>
          </button>
          {catOpen && (
            <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, background: "#fff", border: "1px solid #E8EAED", borderRadius: "10px", boxShadow: "0 8px 24px rgba(0,0,0,0.08)", zIndex: 10, minWidth: "180px", overflow: "hidden" }}>
              {categories.map((cat) => (
                <button key={cat} onClick={() => { setActiveCategory(cat); setCatOpen(false); }}
                  style={{ display: "block", width: "100%", textAlign: "left", padding: "0.55rem 1rem", border: "none", background: activeCategory === cat ? "rgba(0,201,177,0.08)" : "transparent", color: activeCategory === cat ? "#00A896" : "#444", fontSize: "0.82rem", fontWeight: activeCategory === cat ? 700 : 500, cursor: "pointer", textTransform: "capitalize", borderLeft: activeCategory === cat ? "3px solid #00C9B1" : "3px solid transparent" }}>
                  {cat === "all" ? t.all : cat}
                </button>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
          <span style={{ color: "#888", fontSize: "0.8rem" }}>
            <span style={{ color: "#00C9B1", fontWeight: 700 }}>{filtered.length}</span> {t.products}
          </span>
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            {(["new", "price_asc", "price_desc", "rating"] as SortKey[]).map((key) => (
              <button key={key} onClick={() => setSortBy(key)}
                style={{ padding: "0.35rem 0.8rem", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", border: "none", background: sortBy === key ? "rgba(0,201,177,0.1)" : "#fff", color: sortBy === key ? "#00A896" : "#666", outline: sortBy === key ? "1px solid rgba(0,201,177,0.35)" : "1px solid #E8EAED", transition: "all 0.15s" }}>
                {key === "new" ? t.sort_new : key === "price_asc" ? t.sort_price_asc : key === "price_desc" ? t.sort_price_desc : t.sort_rating}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ height: "1px", background: "#E8EAED", margin: "0 2.5rem 0.75rem", maxWidth: "1200px", marginLeft: "auto", marginRight: "auto" }} />

      <div style={{ padding: "0 2.5rem 6rem", maxWidth: "1200px", margin: "0 auto" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "6rem 0", color: "#888", fontSize: "1rem" }}>{t.empty}</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: "1.5rem" }}>
            {filtered.map((product) => {
              const name = getLocalizedName(product as Record<string, unknown>, locale);
              const discount = product.compare_price && product.compare_price > product.price
                ? Math.round((1 - product.price / product.compare_price) * 100) : null;
              return (
                <Link key={product.id} href={`/${locale}/product/${product.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <div className="premium-card">
                    <div className="card-img-wrap">
                      {product.images && product.images.length > 0 ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={product.images[0]} alt={name} />
                      ) : (
                        <span style={{ fontFamily: "var(--font-bebas)", fontSize: "2.5rem", color: "rgba(0,201,177,0.2)", letterSpacing: "0.05em" }}>AIZÜA</span>
                      )}
                      {product.badge && (
                        <span style={{ position: "absolute", top: "12px", left: "12px", background: product.badge === "NEW" ? "#00C9B1" : product.badge === "HOT" ? "#FF6B35" : product.badge === "SALE" ? "#EF4444" : "#F59E0B", color: "#fff", fontSize: "0.65rem", fontWeight: 700, padding: "0.25rem 0.65rem", borderRadius: "6px", letterSpacing: "0.08em" }}>{product.badge}</span>
                      )}
                      {discount && (
                        <span style={{ position: "absolute", top: "12px", right: "12px", background: "#FEF2F2", border: "1px solid #FECACA", color: "#EF4444", fontSize: "0.7rem", fontWeight: 700, padding: "0.2rem 0.55rem", borderRadius: "6px" }}>-{discount}%</span>
                      )}
                    </div>
                    <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1 }}>
                      {product.category && (
                        <span style={{ fontSize: "0.68rem", color: "#00A896", letterSpacing: "0.1em", fontWeight: 600, textTransform: "uppercase" }}>{product.category}</span>
                      )}
                      <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "#333", lineHeight: 1.4, margin: 0, flex: 1 }}>{name}</p>
                      {product.rating && (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <span style={{ color: "#F59E0B", fontSize: "0.73rem" }}>{"★".repeat(Math.round(product.rating))}{"☆".repeat(5 - Math.round(product.rating))}</span>
                          <span style={{ color: "#999", fontSize: "0.72rem" }}>{product.rating}{product.review_count && product.review_count > 0 ? ` (${product.review_count} ${t.reviews})` : ""}</span>
                        </div>
                      )}
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.25rem" }}>
                        <span style={{ fontSize: "1.3rem", fontWeight: 800, color: "#1A1A2E" }}>€{product.price.toFixed(2)}</span>
                        {product.compare_price && product.compare_price > product.price && (
                          <span style={{ fontSize: "0.9rem", color: "#bbb", textDecoration: "line-through" }}>€{product.compare_price.toFixed(2)}</span>
                        )}
                      </div>
                      <div style={{ marginTop: "0.5rem", background: "#00C9B1", borderRadius: "8px", padding: "0.55rem 1rem", textAlign: "center", fontSize: "0.78rem", fontWeight: 700, color: "#fff", letterSpacing: "0.08em" }}>
                        {locale === "es" ? "Ver producto →" : "View product →"}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
