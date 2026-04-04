import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import MainNav from "@/components/nav/MainNav";
import Footer from "@/components/nav/Footer";

export const dynamic = "force-dynamic";

function extractProductSlugs(md: string): string[] {
  const regex = /\/product\/([a-z0-9-]+)/g;
  const slugs: string[] = [];
  let match;
  while ((match = regex.exec(md)) !== null) {
    if (!slugs.includes(match[1])) slugs.push(match[1]);
  }
  return slugs;
}

function markdownToHtml(md: string, productImages: Record<string, string> = {}): string {
  // Pre-process lines: after each ## heading that contains a /product/slug link,
  // inject the product image on the next blank line.
  const lines = md.split('\n');
  const injected: string[] = [];
  for (const line of lines) {
    injected.push(line);
    if (/^##\s/.test(line)) {
      const slugMatch = line.match(/\/product\/([a-z0-9-]+)/);
      if (slugMatch && productImages[slugMatch[1]]) {
        injected.push('');
        injected.push(`![product](${productImages[slugMatch[1]]})`);
      }
    }
  }
  const preprocessed = injected.join('\n');

  return preprocessed
    // Images before links
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="width:100%;border-radius:12px;margin:1.5rem 0 1rem;display:block;" />')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#00C9B1;font-weight:600;text-decoration:underline;" target="_blank" rel="noopener">$1</a>')
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    // H3
    .replace(/^### (.+)$/gm, '<h3 style="font-size:1.15rem;font-weight:700;color:#1A1A2E;margin:1.8rem 0 0.6rem;">$1</h3>')
    // H2
    .replace(/^## (.+)$/gm, '<h2 style="font-size:1.45rem;font-weight:800;color:#1A1A2E;margin:2.2rem 0 0.75rem;padding-top:0.5rem;border-top:2px solid #E8EAED;">$1</h2>')
    // H1 (skip — already rendered as post title)
    .replace(/^# .+$/gm, '')
    // HR
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #E8EAED;margin:2rem 0;" />')
    // Paragraphs: wrap non-tag lines in <p>
    .split(/\n{2,}/)
    .map(block => {
      const trimmed = block.trim();
      if (!trimmed) return '';
      if (/^<(h[1-6]|hr|img|ul|ol|li|blockquote)/.test(trimmed)) return trimmed;
      return `<p style="margin:0 0 1.25rem;">${trimmed.replace(/\n/g, '<br />')}</p>`;
    })
    .join('\n');
}

type BlogPost = {
  id: string;
  slug: string;
  title: Record<string, string>;
  content: Record<string, string>;
  excerpt?: Record<string, string>;
  keyword?: string;
  status: string;
  product_id?: string;
  views: number;
  created_at: string;
  updated_at: string;
};

async function getPost(slug: string): Promise<BlogPost | null> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .single();
    if (error || !data) return null;
    // Increment views
    await supabase
      .from("blog_posts")
      .update({ views: (data.views || 0) + 1 })
      .eq("id", data.id);
    return data;
  } catch {
    return null;
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  const { locale, slug } = params;
  setRequestLocale(locale);
  const post = await getPost(slug);
  if (!post) notFound();

  const title = post.title?.[locale] || post.title?.en || post.title?.es || "Untitled";
  let rawContent = post.content?.[locale] || post.content?.en || post.content?.es || "";
  // Strip markdown code fences wrapping HTML (```html ... ``` or ``` ... ```)
  rawContent = rawContent.trim();
  if (rawContent.startsWith("```")) {
    rawContent = rawContent.replace(/^```(?:html)?\s*\n?/, "").replace(/\n?```\s*$/, "").trim();
  }
  const isAlreadyHtml = rawContent.startsWith("<");

  // Fetch product images for any /product/slug links in the content
  let productImages: Record<string, string> = {};
  const slugsInContent = extractProductSlugs(rawContent);
  if (slugsInContent.length > 0) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: products } = await supabase
        .from("products")
        .select("slug, images")
        .in("slug", slugsInContent);
      for (const p of (products || [])) {
        if (p.images && p.images.length > 0) productImages[p.slug] = p.images[0];
      }
    } catch { /* fallback: no images */ }
  }

  const content = isAlreadyHtml ? rawContent : markdownToHtml(rawContent, productImages);
  const date = new Date(post.created_at).toLocaleDateString(locale, {
    year: "numeric", month: "long", day: "numeric",
  });
  const backLabel = locale === "es" ? "Volver al blog" : "Back to blog";

  return (
    <div style={{ minHeight: "100vh", background: "#F8F9FB", fontFamily: "system-ui, sans-serif" }}>

      {/* NAV */}
      <MainNav locale={locale} />

      {/* ARTICLE */}
      <article style={{ paddingTop: "108px", paddingBottom: "5rem", maxWidth: "720px", margin: "0 auto", padding: "108px 2rem 5rem" }}>
        {/* Back link */}
        <Link href={`/${locale}/blog`} style={{ color: "#00C9B1", textDecoration: "none", fontSize: "0.88rem", fontWeight: 600 }}>
          ← {backLabel}
        </Link>

        {/* Meta */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "2rem", marginBottom: "1rem" }}>
          {post.keyword && (
            <span style={{
              background: "rgba(0,201,177,0.1)", color: "#00A896",
              fontSize: "0.72rem", fontWeight: 700,
              padding: "0.25rem 0.65rem", borderRadius: "6px",
              letterSpacing: "0.06em", textTransform: "uppercase",
            }}>{post.keyword}</span>
          )}
          <span style={{ color: "#999", fontSize: "0.85rem" }}>{date}</span>
          <span style={{ color: "#BBB", fontSize: "0.8rem" }}>
            {post.views} {locale === "es" ? "lecturas" : "views"}
          </span>
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: "2.2rem", fontWeight: 800, color: "#1A1A2E",
          lineHeight: 1.25, margin: "0 0 2rem",
        }}>{title}</h1>

        {/* Content */}
        <div
          style={{
            color: "#444", fontSize: "1.05rem", lineHeight: 1.85,
          }}
          dangerouslySetInnerHTML={{ __html: content }}
        />

        {/* Back to blog */}
        <div style={{ marginTop: "4rem", paddingTop: "2rem", borderTop: "1px solid #E8EAED" }}>
          <Link href={`/${locale}/blog`} style={{
            display: "inline-block", background: "#00C9B1", color: "#fff",
            textDecoration: "none", padding: "0.85rem 2rem",
            borderRadius: "10px", fontFamily: "var(--font-bebas)",
            fontSize: "1rem", letterSpacing: "0.08em",
          }}>
            ← {backLabel}
          </Link>
        </div>
      </article>

      {/* FOOTER */}
      <Footer locale={locale} />
    </div>
  );
}
