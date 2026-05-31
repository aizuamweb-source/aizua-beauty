import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import Image from "next/image";
import { setRequestLocale } from "next-intl/server";
import MainNav from "@/components/nav/MainNav";
import Footer from "@/components/nav/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog — Cosmética Natural, Skincare y Bienestar | AizuaBeauty",
  description: "Guías de skincare, rutinas de belleza natural, reviews de cosmética Ringana y tendencias en cuidado facial y corporal.",
};

export const revalidate = 1800; // ISR: cached page, low TTFB for crawlers

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

    // Beauty placeholder images — skincare/cosmetics focused fallback
    const imgPool: string[] = [
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&q=80",
      "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=800&q=80",
      "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=800&q=80",
      "https://images.unsplash.com/photo-1583864697784-a0efc8379f70?w=800&q=80",
      "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&q=80",
    ];

    return postsRes.data.map((post: any, idx: number) => ({
      ...post,
      coverImage: post.cover_image || imgPool[idx % Math.max(imgPool.length, 1)] || null,
    }));
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

export default async function BlogPage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  setRequestLocale(locale);
  const posts = await getBlogPosts();
  const i = t[locale] || t.en;

  return (
    <div style={{ minHeight: "100vh", background: "#F8F9FB", fontFamily: "system-ui, sans-serif" }}>

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
              const coverGrad = kw.includes("ringana") ? "linear-gradient(135deg, #6B4E71 0%, #9B7FA6 100%)"
                : kw.includes("skincare") || kw.includes("piel") || kw.includes("skin") ? "linear-gradient(135deg, #C97BA0 0%, #E8A0BF 100%)"
                : kw.includes("crema") || kw.includes("hidrat") || kw.includes("cream") ? "linear-gradient(135deg, #D4A5C9 0%, #F0C8E0 100%)"
                : kw.includes("serum") || kw.includes("antiedad") || kw.includes("anti-age") ? "linear-gradient(135deg, #A0522D 0%, #CD853F 100%)"
                : kw.includes("rutina") || kw.includes("routine") || kw.includes("tips") ? "linear-gradient(135deg, #7B6FA6 0%, #A89BD4 100%)"
                : kw.includes("tendencia") || kw.includes("trend") || kw.includes("natural") ? "linear-gradient(135deg, #4A7C59 0%, #7EBF8E 100%)"
                : "linear-gradient(135deg, #B06A8A 0%, #D4A0BB 100%)";
              const coverEmoji = kw.includes("ringana") ? "🌿"
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
