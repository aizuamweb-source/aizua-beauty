import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import Image from "next/image";
import { setRequestLocale } from "next-intl/server";
import MainNav from "@/components/nav/MainNav";
import Footer from "@/components/nav/Footer";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const base = "https://beauty.aizualabs.com";
  const LOCALES = ["es","en","fr","de","pt","it"];
  const titles: Record<string,string> = {
    // Sin "| AizuaBeauty": el template root ya añade la marca (doble marca 77c, s192)
    es:"Blog — Cosmética Natural, Skincare y Bienestar",
    en:"Blog — Natural Cosmetics, Skincare & Wellness",
    fr:"Blog — Cosmétiques Naturels & Bien-être",
    de:"Blog — Naturkosmetik & Wohlbefinden",
    pt:"Blog — Cosmética Natural e Bem-estar",
    it:"Blog — Cosmetica Naturale e Benessere",
  };
  const descs: Record<string,string> = {
    es:"Guías de skincare, rutinas de belleza natural, reviews de cosmética limpia y tendencias en cuidado facial y corporal.",
    en:"Skincare guides, natural beauty routines, clean cosmetics reviews and facial and body care trends.",
    fr:"Guides de soin de la peau, routines de beauté naturelle, avis sur les cosmétiques propres et tendances du soin du visage et du corps.",
    de:"Hautpflege-Ratgeber, natürliche Beauty-Routinen, Clean-Beauty-Bewertungen und Trends in der Gesichts- und Körperpflege.",
    pt:"Guias de skincare, rotinas de beleza natural, reviews de cosmética limpa e tendências em cuidado facial e corporal.",
    it:"Guide allo skincare, routine di bellezza naturale, recensioni di cosmetici puliti e tendenze nella cura del viso e del corpo.",
  };
  // Filler para llegar a 120c: es (118c) y en (104c) se quedaban por debajo del mínimo
  // recomendado (Ahrefs "meta description too short", detectado s209-verify).
  const descFiller: Record<string,string> = {
    es:"Publicamos guías nuevas cada semana.",
    en:"We publish new guides every week.",
    pt:"Publicamos guias novos todas as semanas.",
  };
  const locale = params.locale;
  const baseDesc = descs[locale] ?? descs.en;
  const filler = descFiller[locale] ?? "";
  const description = baseDesc.length < 120 && filler
    ? `${baseDesc} ${filler}`.slice(0, 155)
    : baseDesc;
  return {
    title: titles[locale] ?? titles.en,
    description,
    alternates: {
      canonical: `${base}/${locale}/blog`,
      languages: { ...Object.fromEntries(LOCALES.map(l=>[l,`${base}/${l}/blog`])), "x-default":`${base}/es/blog` },
    },
    openGraph: {
      title: titles[locale] ?? titles.en,
      description,
      url: `${base}/${locale}/blog`,
      type: "website",
      images: [{ url: `${base}/og-home.jpg`, width: 1200, height: 630 }],
    },
  };
}

export const revalidate = 1800; // ISR: cached page, low TTFB for crawlers
// s229: el Data Cache de Next PERSISTE entre deploys y servia el resultado viejo de
// Supabase (mismo bug que s224 en merchant-feed): tras desactivar 20 productos, esta
// pagina seguia pintandolos con Age:0 y X-Vercel-Cache:MISS. force-no-store evita que
// la lectura de catalogo/contenido se cachee; el ISR de pagina (revalidate) se mantiene.
export const fetchCache = "force-no-store";


type BlogPost = {
  id: string;
  slug: string;
  title: Record<string, string>;
  excerpt?: Record<string, string>;
  keyword?: string;
  status: string;
  views: number;
  created_at: string;
  coverImage?: string | null;
};

/** Detecta imágenes de la tienda tech o logos corporativos que se colaron en posts beauty.
 *  Si la URL apunta a un logo de AizuaTec, AizuaLabs genérico o social-images/_fallback,
 *  se trata como "sin imagen" y se sustituye por la imagen de beauty correspondiente al post.
 */
function isBadCoverImage(url: string | null | undefined): boolean {
  if (!url) return false;
  const u = url.toLowerCase();
  return (
    u.includes("logo_aizuatec") ||
    u.includes("logo_aizualabs") ||
    u.includes("_fallback/logo") ||
    u.includes("social-images/_fallback") ||
    u.includes("tech_store") ||
    u.includes("aizuatec.jpg") ||
    u.includes("aizuatec.png")
  );
}

/** Selecciona la imagen más adecuada para un post beauty según su slug y keyword.
 *  Prioridad: slug match > keyword match > fallback por índice.
 *  Todas las URLs son fotos Unsplash de cosmética/beauty/moda verificadas.
 */
function selectBeautyImage(slug: string, keyword: string | null | undefined, idx: number): string {
  const s = (slug + " " + (keyword ?? "")).toLowerCase();

  // Mapa keyword → imagen específica de cosmética/beauty
  const KEYWORD_MAP: Array<[string[], string]> = [
    [["body lotion", "locion corporal", "loción corporal", "hidratacion corporal", "body milk"],
      "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&q=80"],  // tarro crema natural
    [["overnight", "noche", "nocturno", "retinal", "retinol", "duermes", "night cream"],
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80"],  // rutina noche
    [["serum", "sérum", "vitamina c", "antiedad", "anti-age", "brightening"],
      "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=800&q=80"],     // dropper sérum
    [["rutina", "routine", "paso a paso", "step by step", "morning", "mañana"],
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&q=80"],     // productos skincare flat lay
    [["ingredientes", "ingredients", "natural", "planta", "plant", "herbal", "organico"],
      "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=800&q=80"],  // cosmética natural
    [["moda", "fashion", "bolso", "bag", "accesorio", "tendencia", "trend"],
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80"],  // moda femenina
    [["cabello", "hair", "shampoo", "pelo", "capilar"],
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80"],  // cuidado cabello
    [["sol", "solar", "spf", "sun", "proteccion solar", "verano", "summer"],
      "https://images.unsplash.com/photo-1526758097130-bab247274f58?w=800&q=80"],  // protección solar
    [["fresco", "fresh", "sin conservantes", "preservative"],
      "https://images.unsplash.com/photo-1583864697784-a0efc8379f70?w=800&q=80"],  // cosmética fresca
    [["bienestar", "wellness", "spa", "relax", "salud"],
      "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80"],     // spa/bienestar
  ];

  for (const [keys, img] of KEYWORD_MAP) {
    if (keys.some((k) => s.includes(k))) return img;
  }

  // Fallback pool general de beauty (rotación por índice)
  const POOL: string[] = [
    "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&q=80",
    "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&q=80",
    "https://images.unsplash.com/photo-1583864697784-a0efc8379f70?w=800&q=80",
    "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=800&q=80",
    "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=800&q=80",
  ];
  return POOL[idx % POOL.length];
}

async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const postsRes = await supabase
      .from("blog_posts")
      .select("id,slug,title,excerpt,keyword,status,views,created_at,cover_image")
      .eq("status", "published")
      .eq("brand", "beauty")
      .order("created_at", { ascending: false })
      .limit(20);

    if (postsRes.error) console.error("Blog fetch error:", postsRes.error.message);
    if (!postsRes.data || postsRes.data.length === 0) return [];

    return postsRes.data.map((post: any, idx: number) => {
      // Si cover_image existe y NO es una imagen incorrecta, usarla tal cual.
      // Si es un logo tech o de fallback incorrecto, tratarla como null y seleccionar imagen beauty.
      const hasGoodCover = post.cover_image && !isBadCoverImage(post.cover_image);
      return {
        ...post,
        coverImage: hasGoodCover
          ? post.cover_image
          : selectBeautyImage(post.slug ?? "", post.keyword, idx),
      };
    });
  } catch (e) {
    console.error("getBlogPosts error:", e);
  }
  return [];
}

const t: Record<string, Record<string, string>> = {
  es: {
    title: "BLOG",
    subtitle: "Rutinas de belleza, skincare natural y cosmética consciente",
    empty: "Proximamente — Estamos preparando contenido increible para ti.",
    emptyDesc: "Nuestro equipo esta trabajando en articulos sobre rutinas de skincare, cosmética natural y los mejores productos de belleza.",
    readMore: "Leer articulo",
    back: "Volver a tienda",
    shop: "TIENDA",
    views: "lecturas",
    min: "min lectura",
  },
  en: {
    title: "BLOG",
    subtitle: "Beauty routines, natural skincare and conscious cosmetics",
    empty: "Coming soon — We're preparing amazing content for you.",
    emptyDesc: "Our team is working on articles about skincare routines, natural cosmetics and the best beauty products.",
    readMore: "Read article",
    back: "Back to store",
    shop: "SHOP",
    views: "views",
    min: "min read",
  },
  fr: {
    title: "BLOG",
    subtitle: "Routines beaute, soin naturel de la peau et cosmetiques conscients",
    empty: "Bientot — Nous preparons du contenu incroyable pour vous.",
    emptyDesc: "Notre equipe travaille sur des articles sur les routines de soin, les cosmetiques naturels et les meilleurs produits de beaute.",
    readMore: "Lire l'article",
    back: "Retour a la boutique",
    shop: "BOUTIQUE",
    views: "vues",
    min: "min de lecture",
  },
  de: {
    title: "BLOG",
    subtitle: "Schonheitsroutinen, naturliche Hautpflege und bewusste Kosmetik",
    empty: "Demnachst — Wir bereiten grossartige Inhalte fur Sie vor.",
    emptyDesc: "Unser Team arbeitet an Artikeln uber Hautpflegeroutinen, naturliche Kosmetik und die besten Schonheitsprodukte.",
    readMore: "Artikel lesen",
    back: "Zuruck zum Shop",
    shop: "SHOP",
    views: "Aufrufe",
    min: "Min. Lesezeit",
  },
  pt: {
    title: "BLOG",
    subtitle: "Rotinas de beleza, skincare natural e cosmeticos conscientes",
    empty: "Em breve — Estamos preparando conteudo incrivel para voce.",
    emptyDesc: "Nossa equipe esta trabalhando em artigos sobre rotinas de skincare, cosmeticos naturais e os melhores produtos de beleza.",
    readMore: "Ler artigo",
    back: "Voltar a loja",
    shop: "LOJA",
    views: "visualizacoes",
    min: "min de leitura",
  },
  it: {
    title: "BLOG",
    subtitle: "Routine di bellezza, skincare naturale e cosmetici consapevoli",
    empty: "Prossimamente — Stiamo preparando contenuti incredibili per te.",
    emptyDesc: "Il nostro team sta lavorando su articoli su routine di cura della pelle, cosmetici naturali e i migliori prodotti di bellezza.",
    readMore: "Leggi articolo",
    back: "Torna al negozio",
    shop: "NEGOZIO",
    views: "visualizzazioni",
    min: "min di lettura",
  },
};

const HOME_LABEL: Record<string, string> = {
  es: "Inicio", en: "Home", fr: "Accueil", de: "Startseite", pt: "Início", it: "Home",
};

export default async function BlogPage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  setRequestLocale(locale);
  const posts = await getBlogPosts();
  const i = t[locale] || t.en;

  const base = "https://beauty.aizualabs.com";
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: HOME_LABEL[locale] ?? HOME_LABEL.en, item: `${base}/${locale}` },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${base}/${locale}/blog` },
    ],
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F8F9FB", fontFamily: "system-ui, sans-serif" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      {/* NAV */}
      <MainNav locale={locale} />

      {/* HERO */}
      <section style={{
        paddingTop: "108px", paddingBottom: "1.75rem",
        background: "linear-gradient(135deg, #0F172A 0%, #162030 60%, #0F2027 100%)",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: "-80px", right: "-80px", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(0,201,177,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 2.5rem", position: "relative", zIndex: 1 }}>
          <div style={{ display: "inline-block", background: "rgba(0,201,177,0.12)", border: "1px solid rgba(0,201,177,0.25)", color: "#00C9B1", fontSize: "11px", fontWeight: 700, letterSpacing: "0.15em", padding: "4px 12px", borderRadius: "20px", marginBottom: "0.75rem", textTransform: "uppercase" }}>Cosmética & Bienestar</div>
          <h1 style={{
            fontFamily: "var(--font-bebas)", fontSize: "clamp(2rem, 5vw, 2.8rem)",
            letterSpacing: "0.05em", color: "#fff", margin: "0 0 0.4rem", lineHeight: 1,
          }}>{i.title}</h1>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.9rem", maxWidth: "420px", lineHeight: 1.6, margin: 0 }}>
            {i.subtitle}
          </p>
          <div style={{ width: "32px", height: "3px", background: "#00C9B1", borderRadius: "2px", margin: "0.9rem 0 0" }} />
        </div>
      </section>

      {/* POSTS */}
      <section style={{ padding: "3rem 2.5rem 5rem", maxWidth: "900px", margin: "0 auto" }}>
        {posts.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "4rem 2rem",
            background: "#fff", borderRadius: "16px",
            border: "1px solid #E8EAED", boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          }}>
            <div style={{ fontSize: "3rem", marginBottom: "1.5rem" }}>📝</div>
            <h2 style={{ fontFamily: "var(--font-bebas)", fontSize: "1.8rem", color: "#1A1A2E", margin: "0 0 1rem" }}>
              {i.empty}
            </h2>
            <p style={{ color: "#888", maxWidth: "420px", margin: "0 auto 2rem", lineHeight: 1.7 }}>
              {i.emptyDesc}
            </p>
            <Link href={`/${locale}/tienda`} style={{
              display: "inline-block", background: "#00C9B1", color: "#fff",
              textDecoration: "none", padding: "0.9rem 2rem",
              borderRadius: "10px", fontFamily: "var(--font-bebas)",
              fontSize: "1rem", letterSpacing: "0.1em",
            }}>
              {i.back} →
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {posts.map((post) => {
              const title = post.title?.[locale] || post.title?.en || post.title?.es || "Untitled";
              const excerpt = post.excerpt?.[locale] || post.excerpt?.en || post.excerpt?.es || "";
              const date = new Date(post.created_at).toLocaleDateString(locale, {
                year: "numeric", month: "long", day: "numeric",
              });

              const kw = post.keyword?.toLowerCase() ?? "";
              const coverGrad = kw.includes("limpia") || kw.includes("clean") ? "linear-gradient(135deg, #6B4E71 0%, #9B7FA6 100%)"
                : kw.includes("skincare") || kw.includes("piel") || kw.includes("skin") ? "linear-gradient(135deg, #C97BA0 0%, #E8A0BF 100%)"
                : kw.includes("crema") || kw.includes("hidrat") || kw.includes("cream") ? "linear-gradient(135deg, #D4A5C9 0%, #F0C8E0 100%)"
                : kw.includes("serum") || kw.includes("antiedad") || kw.includes("anti-age") ? "linear-gradient(135deg, #A0522D 0%, #CD853F 100%)"
                : kw.includes("rutina") || kw.includes("routine") || kw.includes("tips") ? "linear-gradient(135deg, #7B6FA6 0%, #A89BD4 100%)"
                : kw.includes("tendencia") || kw.includes("trend") || kw.includes("natural") ? "linear-gradient(135deg, #4A7C59 0%, #7EBF8E 100%)"
                : "linear-gradient(135deg, #B06A8A 0%, #D4A0BB 100%)";
              const coverEmoji = kw.includes("limpia") || kw.includes("clean") ? "🌿"
                : kw.includes("skincare") || kw.includes("piel") || kw.includes("skin") ? "✨"
                : kw.includes("crema") || kw.includes("hidrat") || kw.includes("cream") ? "🧴"
                : kw.includes("serum") || kw.includes("antiedad") ? "💆‍♀️"
                : kw.includes("rutina") || kw.includes("routine") ? "🌸"
                : kw.includes("natural") || kw.includes("tendencia") ? "🌱"
                : "💄";

              return (
                <Link key={post.id} href={`/${locale}/blog/${post.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <article className="blog-card" style={{
                    background: "#fff", borderRadius: "16px",
                    border: "1px solid #E8EAED", overflow: "hidden",
                    boxShadow: "0 2px 16px rgba(0,0,0,0.05)",
                    display: "flex", flexDirection: "column",
                  }}>
                    {/* Cover image */}
                    <div style={{
                      height: "180px", position: "relative", overflow: "hidden",
                      background: post.coverImage ? "#eee" : coverGrad,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {post.coverImage ? (
                        <img src={post.coverImage} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      ) : (
                        <>
                          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.08)" }} />
                          <span style={{ fontSize: "4.5rem", filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.3))", position: "relative", zIndex: 1 }}>{coverEmoji}</span>
                        </>
                      )}
                      {post.keyword && (
                        <span style={{
                          position: "absolute", top: "12px", left: "12px", zIndex: 2,
                          background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)",
                          color: "#fff", fontSize: "0.62rem", fontWeight: 700,
                          padding: "3px 9px", borderRadius: "20px",
                          letterSpacing: "0.08em", textTransform: "uppercase",
                          border: "1px solid rgba(255,255,255,0.2)",
                        }}>{post.keyword}</span>
                      )}
                    </div>
                    {/* Content */}
                    <div style={{ padding: "1.25rem 1.5rem 1.4rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem" }}>
                        <span style={{ color: "#999", fontSize: "0.75rem" }}>{date}</span>
                        <span style={{ color: "#DDD" }}>·</span>
                        <span style={{ color: "#BBB", fontSize: "0.72rem" }}>{post.views} {i.views}</span>
                      </div>
                      <h2 style={{
                        fontSize: "1.15rem", fontWeight: 700, color: "#1A1A2E",
                        margin: "0 0 0.5rem", lineHeight: 1.4,
                      }}>{title}</h2>
                      {excerpt && (
                        <p style={{ color: "#666", fontSize: "0.88rem", lineHeight: 1.6, margin: "0 0 0.85rem" }}>
                          {excerpt.slice(0, 100)}{excerpt.length > 100 ? "…" : ""}
                        </p>
                      )}
                      <span style={{ color: "#00C9B1", fontSize: "0.85rem", fontWeight: 600 }}>
                        {i.readMore} →
                      </span>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* FOOTER */}
      <Footer locale={locale} />
    </div>
  );
}
