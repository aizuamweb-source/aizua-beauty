import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import MainNav from "@/components/nav/MainNav";
import Footer from "@/components/nav/Footer";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = params.locale;
  const isEs = locale === "es";
  const isEn = locale === "en";
  const base = "https://beauty.aizualabs.com";
  // Non-ES/EN locales consolidate to /es/ringana (no separate French/German/etc content)
  const canonical = (isEs || isEn) ? `${base}/${locale}/ringana` : `${base}/es/ringana`;
  return {
    title: isEs
      ? "Ringana — Catálogo Completo 85 Productos | Partner Oficial AizuaBeauty"
      : "Ringana — Full Catalog 85 Products | Official AizuaBeauty Partner",
    description: isEs
      ? "85 productos Ringana: FRESH Skincare, Suplementos CAPS y BEYOND, Sport, Fresh Baby. Sin conservantes artificiales. Partner oficial en España."
      : "85 Ringana products: FRESH Skincare, CAPS & BEYOND Supplements, Sport, Fresh Baby. No artificial preservatives. Official partner in Spain.",
    keywords: isEs
      ? ["Ringana España", "cosmética natural Ringana", "FRESH Ringana", "CAPS suplementos", "comprar Ringana", "partner Ringana", "BEYOND Ringana"]
      : ["Ringana Spain", "natural Ringana cosmetics", "FRESH Ringana", "CAPS supplements", "buy Ringana", "Ringana partner", "BEYOND Ringana"],
    openGraph: {
      title: isEs ? "Catálogo Ringana Completo | AizuaBeauty" : "Complete Ringana Catalog | AizuaBeauty",
      description: isEs
        ? "85 productos Ringana. Partner oficial. Sin conservantes artificiales. Enviado desde Austria."
        : "85 Ringana products. Official partner. No artificial preservatives. Shipped from Austria.",
      url: canonical,
      type: "website",
      images: [{ url: `${base}/og-home.jpg`, width: 1200, height: 630 }],
    },
    alternates: {
      canonical,
      languages: {
        es: `${base}/es/ringana`,
        en: `${base}/en/ringana`,
        "x-default": `${base}/es/ringana`,
      },
    },
  };
}

export const revalidate = 3600; // ISR: cached page, low TTFB for crawlers

const RINGANA_BASE = process.env.RINGANA_PARTNER_URL || "https://miguelsaez.ringana.com";
// imgix de Ringana bloquea hotlinking (403) — solo imágenes locales de /public/ringana/

type P = {
  slug: string; cat: string; line: string;
  es: string; en: string; dEs: string; dEn: string; img: string;
};

const PRODUCTS: P[] = [
  // ─── FRESH SKINCARE (47) ────────────────────────────────────────────────────
  { slug:"fresh-adds-effect",            cat:"skincare", line:"FRESH ADDS", es:"ADDS effect",                    en:"ADDS effect",                    dEs:"Booster ADDS concentrado. Potencia tu rutina FRESH.",                     dEn:"Concentrated ADDS booster. Enhances your FRESH routine.",              img:"2022/07/ringana-fresh-add-15ml-effect.png" },
  { slug:"fresh-adds-glow",              cat:"skincare", line:"FRESH ADDS", es:"ADDS glow",                      en:"ADDS glow",                      dEs:"Booster luminosidad ADDS. Activos vegetales de alta concentración.",      dEn:"ADDS glow booster. High-concentration plant actives.",                 img:"yV4qgC1WmXMGmnYV3Q-fB" },
  { slug:"fresh-adds-repair",            cat:"skincare", line:"FRESH ADDS", es:"ADDS repair",                    en:"ADDS repair",                    dEs:"Booster reparador ADDS. Sin conservantes artificiales.",                  dEn:"ADDS repair booster. No artificial preservatives.",                    img:"pjoP3vllUNldnstaSbl_H" },
  { slug:"fresh-after-sun",              cat:"skincare", line:"FRESH SUN",  es:"FRESH after sun & tan booster",  en:"FRESH after sun & tan booster",  dEs:"After-sun y activador de bronceado. Ingredientes naturales.",             dEn:"After-sun and tan booster. Natural ingredients.",                      img:"g-GVXGYvxE7b9W95gexFg" },
  { slug:"fresh-anti-wrinkle-serum",     cat:"skincare", line:"FRESH",      es:"FRESH anti wrinkle serum",       en:"FRESH anti wrinkle serum",       dEs:"Sérum antiedad FRESH. Sin conservantes artificiales.",                   dEn:"FRESH anti-wrinkle serum. No artificial preservatives.",               img:"EqAS3SUTgjglU9pqQlOi5" },
  { slug:"fresh-body-milk-light",        cat:"skincare", line:"FRESH BODY", es:"FRESH body milk light",          en:"FRESH body milk light",          dEs:"Leche corporal ligera FRESH. Ingredientes vegetales.",                   dEn:"Light FRESH body milk. Plant-based ingredients.",                      img:"Tng2vBwV2gBuCg849itsp" },
  { slug:"fresh-body-milk-rich",         cat:"skincare", line:"FRESH BODY", es:"FRESH body milk rich",           en:"FRESH body milk rich",           dEs:"Leche corporal rica FRESH. Nutrición intensa sin conservantes.",          dEn:"Rich FRESH body milk. Intense nourishment, no preservatives.",         img:"A3ZjlsfqBO4BL4PS6x7qa" },
  { slug:"fresh-body-wash-nbc",          cat:"skincare", line:"FRESH BODY", es:"FRESH body wash",                en:"FRESH body wash",                dEs:"Gel de ducha FRESH. Sin sulfatos agresivos ni conservantes.",             dEn:"FRESH body wash. No harsh sulfates or preservatives.",                 img:"2022/08/ringana-fresh-200ml-body-wash-NBC7.png" },
  { slug:"fresh-cleanser",               cat:"skincare", line:"FRESH",      es:"FRESH cleanser",                 en:"FRESH cleanser",                 dEs:"Limpiador facial FRESH. Sin sulfatos ni conservantes artificiales.",      dEn:"FRESH facial cleanser. Sulfate & preservative-free.",                  img:"2022/07/ringana-fresh-125ml-cleanser.png" },
  { slug:"fresh-cleansing-water",        cat:"skincare", line:"FRESH",      es:"FRESH cleansing water",          en:"FRESH cleansing water",          dEs:"Agua micelar FRESH. Limpieza suave sin conservantes artificiales.",       dEn:"FRESH micellar water. Gentle, no artificial preservatives.",           img:"2024/03/RINGANA-produktfoto-cleansing-water-mizellen.png" },
  { slug:"fresh-cream-light",            cat:"skincare", line:"FRESH",      es:"FRESH cream light",              en:"FRESH cream light",              dEs:"Crema facial ligera FRESH. Textura fluida, sin conservantes.",           dEn:"Light FRESH face cream. Fluid texture, no preservatives.",             img:"-aFiTCfIm5FVAOuxXebcq" },
  { slug:"fresh-cream-medium",           cat:"skincare", line:"FRESH",      es:"FRESH cream medium",             en:"FRESH cream medium",             dEs:"Crema facial equilibrada FRESH. Ingredientes naturales.",                dEn:"Balanced FRESH face cream. Natural ingredients.",                      img:"2022/07/ringana-fresh-50ml-cream-medium.png" },
  { slug:"fresh-cream-rich",             cat:"skincare", line:"FRESH",      es:"FRESH cream rich",               en:"FRESH cream rich",               dEs:"Crema facial rica FRESH. Nutrición profunda sin conservantes.",          dEn:"Rich FRESH face cream. Deep nourishment, no preservatives.",           img:"2022/07/ringana-fresh-50ml-cream-rich.png" },
  { slug:"fresh-deodorant",              cat:"skincare", line:"FRESH",      es:"FRESH deodorant",                en:"FRESH deodorant",                dEs:"Desodorante FRESH. Sin aluminio ni conservantes artificiales.",           dEn:"FRESH deodorant. Aluminum-free, no artificial preservatives.",         img:"" },
  { slug:"fresh-deodorant-pocket",       cat:"skincare", line:"FRESH",      es:"FRESH deodorant pocket",         en:"FRESH deodorant pocket",         dEs:"Desodorante bolsillo FRESH. Para llevar siempre contigo.",               dEn:"FRESH pocket deodorant. Take it everywhere.",                          img:"" },
  { slug:"fresh-eye-serum",              cat:"skincare", line:"FRESH",      es:"FRESH eye serum",                en:"FRESH eye serum",                dEs:"Sérum contorno de ojos FRESH. Sin conservantes artificiales.",           dEn:"FRESH eye serum. No artificial preservatives.",                        img:"2024/02/RINGANA-fresh-eye-serum.png" },
  { slug:"fresh-foot-balm",              cat:"skincare", line:"FRESH",      es:"FRESH foot balm",                en:"FRESH foot balm",                dEs:"Bálsamo de pies FRESH. Cuidado intensivo con ingredientes naturales.",   dEn:"FRESH foot balm. Intensive care with natural ingredients.",             img:"TOgPoN_Bg90zjx6c7FXuD" },
  { slug:"fresh-hair-treatment",         cat:"skincare", line:"FRESH HAIR", es:"FRESH hair treatment",           en:"FRESH hair treatment",           dEs:"Tratamiento capilar FRESH. Sin siliconas ni conservantes.",              dEn:"FRESH hair treatment. Silicone & preservative-free.",                  img:"y7PF0opxiHtLZhs24I4Ee" },
  { slug:"fresh-hand-balm",              cat:"skincare", line:"FRESH",      es:"FRESH hand balm",                en:"FRESH hand balm",                dEs:"Bálsamo de manos FRESH. Ingredientes naturales regeneradores.",          dEn:"FRESH hand balm. Natural regenerating ingredients.",                   img:"-_-OIF9yd2crtmCxKOAnm" },
  { slug:"fresh-hand-balm-pocket",       cat:"skincare", line:"FRESH",      es:"FRESH hand balm pocket",         en:"FRESH hand balm pocket",         dEs:"Bálsamo de manos bolsillo. Cuidado en cualquier momento.",               dEn:"FRESH hand balm pocket. Care anytime, anywhere.",                      img:"mVJ_8-DzGzIj5ncXprRVB" },
  { slug:"fresh-hydro-serum",            cat:"skincare", line:"FRESH",      es:"FRESH hydro serum",              en:"FRESH hydro serum",              dEs:"Sérum hidratante FRESH. Hidratación profunda sin conservantes.",         dEn:"FRESH hydrating serum. Deep hydration, no preservatives.",             img:"aFbSwW08H23qmE8ntR925" },
  { slug:"fresh-illuminating-enzyme-mask", cat:"skincare", line:"FRESH",    es:"FRESH illuminating enzyme mask", en:"FRESH illuminating enzyme mask", dEs:"Mascarilla peeling enzimática FRESH. Iluminadora, ingredientes naturales.", dEn:"FRESH enzymatic peeling mask. Illuminating, natural ingredients.", img:"2024/03/RINGANA-Produktfoto-fresh-illuminating-enzyme-mask-peeling.png" },
  { slug:"fresh-light-legs",             cat:"skincare", line:"FRESH",      es:"FRESH light legs",               en:"FRESH light legs",               dEs:"Gel piernas ligeras FRESH. Sensación de frescor con extractos naturales.", dEn:"FRESH light legs gel. Fresh feeling with natural extracts.",        img:"2023/08/R_Produktfoto_light-legs_2000x2000_1_Kopie.png" },
  { slug:"fresh-lip-balm-classic",       cat:"skincare", line:"FRESH",      es:"FRESH lip balm classic",         en:"FRESH lip balm classic",         dEs:"Bálsamo labial FRESH. Cuidado intensivo sin conservantes artificiales.", dEn:"FRESH lip balm. Intensive care, no artificial preservatives.",      img:"_R8mEZERqKRWz4zAqiUdU" },
  { slug:"fresh-liquid-bronzer",         cat:"skincare", line:"FRESH",      es:"FRESH liquid bronzer",           en:"FRESH liquid bronzer",           dEs:"Bronceador líquido FRESH. Tono luminoso con ingredientes naturales.",    dEn:"FRESH liquid bronzer. Luminous tone with natural ingredients.",        img:"WdpX3lL-7savTQBIIJqqD" },
  { slug:"fresh-moisturiser-for-men",    cat:"skincare", line:"FRESH MEN",  es:"FRESH moisturiser for men",      en:"FRESH moisturiser for men",      dEs:"Hidratante para hombre FRESH. Fórmula ligera sin conservantes.",        dEn:"FRESH moisturiser for men. Light formula, no preservatives.",         img:"2022/07/ringana-fresh-50ml-moisturizer-for-men.png" },
  { slug:"fresh-overnight-face-treatment", cat:"skincare", line:"FRESH",    es:"FRESH overnight face treatment", en:"FRESH overnight face treatment", dEs:"Tratamiento nocturno FRESH. Actúa mientras duermes, sin conservantes.", dEn:"FRESH overnight treatment. Works while you sleep, no preservatives.", img:"2024/01/RINGANA-fresh-overnight-face-treatment-veggie-award.png" },
  { slug:"fresh-repair-shampoo",         cat:"skincare", line:"FRESH HAIR", es:"FRESH repair shampoo",           en:"FRESH repair shampoo",           dEs:"Champú reparador FRESH. Sin sulfatos ni siliconas.",                    dEn:"FRESH repair shampoo. Sulfate & silicone-free.",                       img:"" },
  { slug:"fresh-scrub",                  cat:"skincare", line:"FRESH",      es:"FRESH scrub",                    en:"FRESH scrub",                    dEs:"Exfoliante FRESH. Gránulos naturales, sin conservantes artificiales.",  dEn:"FRESH scrub. Natural granules, no artificial preservatives.",          img:"" },
  { slug:"fresh-skin-perfection",        cat:"skincare", line:"FRESH",      es:"FRESH skin perfection",          en:"FRESH skin perfection",          dEs:"Primer natural FRESH. Perfecciona la piel antes del maquillaje.",      dEn:"FRESH natural primer. Perfects skin before makeup.",                   img:"" },
  { slug:"fresh-soap",                   cat:"skincare", line:"FRESH",      es:"FRESH soap",                     en:"FRESH soap",                     dEs:"Jabón sólido FRESH. Sin conservantes artificiales.",                    dEn:"FRESH solid soap. No artificial preservatives.",                       img:"2022/07/ringana-fresh-soap.png" },
  { slug:"fresh-soap-liquid",            cat:"skincare", line:"FRESH",      es:"FRESH soap liquid",              en:"FRESH soap liquid",              dEs:"Jabón líquido FRESH. Limpieza suave sin conservantes artificiales.",    dEn:"FRESH liquid soap. Gentle cleansing, no preservatives.",               img:"2023/08/R_Produktfoto_soap-liquid_2000x2000_01.png" },
  { slug:"fresh-stay-fresh",             cat:"skincare", line:"FRESH",      es:"FRESH stay fresh",               en:"FRESH stay fresh",               dEs:"Spray refrescante FRESH. Para llevar siempre contigo.",                 dEn:"FRESH refreshing spray. Take it everywhere.",                          img:"kEIU4KmRvcuxOIu7zmm2y" },
  { slug:"fresh-sunscreen-face",         cat:"skincare", line:"FRESH SUN",  es:"FRESH sunscreen face SPF30",     en:"FRESH sunscreen face SPF30",     dEs:"Protector solar facial FRESH SPF30. Filtros de origen natural.",        dEn:"FRESH facial sunscreen SPF30. Natural-origin filters.",                img:"Oe8j3VfspwhdSejik39V8" },
  { slug:"fresh-sunscreen-pocket",       cat:"skincare", line:"FRESH SUN",  es:"FRESH sunscreen pocket",         en:"FRESH sunscreen pocket",         dEs:"Protector solar bolsillo FRESH. Protección natural en formato mini.",   dEn:"FRESH pocket sunscreen. Natural protection in mini format.",           img:"2cb58aosfwZPzeNu0XhXc" },
  { slug:"fresh-sunscreen-spf-25",       cat:"skincare", line:"FRESH SUN",  es:"FRESH sunscreen SPF25",          en:"FRESH sunscreen SPF25",          dEs:"Protector solar corporal FRESH SPF25. Filtros de origen natural.",      dEn:"FRESH body sunscreen SPF25. Natural-origin filters.",                  img:"-exk8PkPq1VJUmi6jZwIG" },
  { slug:"fresh-tinted-balm-rosewood",   cat:"skincare", line:"FRESH",      es:"FRESH tinted balm rosewood",     en:"FRESH tinted balm rosewood",     dEs:"Bálsamo de color rosewood FRESH. Tono natural con cuidado labial.",    dEn:"FRESH rosewood tinted balm. Natural shade with lip care.",             img:"l8zgfloEyABOH95WRZEoi" },
  { slug:"fresh-tinted-balm-rosy-pink",  cat:"skincare", line:"FRESH",      es:"FRESH tinted balm rosy pink",    en:"FRESH tinted balm rosy pink",    dEs:"Bálsamo de color rosa FRESH. Tono natural y beso de color.",           dEn:"FRESH rosy pink tinted balm. Natural rosy shade.",                    img:"vwg6-Iv4qqs6NBxiu35H4" },
  { slug:"fresh-tinted-moisturiser-n1",  cat:"skincare", line:"FRESH",      es:"FRESH tinted moisturiser N1",    en:"FRESH tinted moisturiser N1",    dEs:"Hidratante con color FRESH N1. El más claro de la gama.",             dEn:"FRESH tinted moisturiser N1. Lightest shade in the range.",           img:"KGvUpaDwkbTmqe3EqnEuv" },
  { slug:"fresh-tinted-moisturiser-n2",  cat:"skincare", line:"FRESH",      es:"FRESH tinted moisturiser N2",    en:"FRESH tinted moisturiser N2",    dEs:"Hidratante con color FRESH N2. Tono medio natural.",                  dEn:"FRESH tinted moisturiser N2. Natural medium shade.",                  img:"jiFKA0d7BcQddtuG4xenn" },
  { slug:"fresh-tinted-moisturiser-n3",  cat:"skincare", line:"FRESH",      es:"FRESH tinted moisturiser N3",    en:"FRESH tinted moisturiser N3",    dEs:"Hidratante con color FRESH N3. Tono medio-oscuro natural.",           dEn:"FRESH tinted moisturiser N3. Medium-dark natural shade.",             img:"" },
  { slug:"fresh-tinted-moisturiser-n4",  cat:"skincare", line:"FRESH",      es:"FRESH tinted moisturiser N4",    en:"FRESH tinted moisturiser N4",    dEs:"Hidratante con color FRESH N4. El más oscuro de la gama.",            dEn:"FRESH tinted moisturiser N4. Darkest shade in the range.",            img:"" },
  { slug:"fresh-tonic-calm",             cat:"skincare", line:"FRESH",      es:"FRESH tonic calm",               en:"FRESH tonic calm",               dEs:"Tónico calmante FRESH. Para pieles sensibles, sin conservantes.",      dEn:"FRESH calming toner. For sensitive skin, no preservatives.",          img:"" },
  { slug:"fresh-tonic-pure",             cat:"skincare", line:"FRESH",      es:"FRESH tonic pure",               en:"FRESH tonic pure",               dEs:"Tónico purificante FRESH. Extractos botánicos, sin conservantes.",     dEn:"FRESH purifying toner. Botanical extracts, no preservatives.",        img:"2022/07/ringana-fresh-125ml-tonic-pure.png" },
  { slug:"fresh-tooth-balm",             cat:"skincare", line:"FRESH ORAL", es:"FRESH tooth balm",               en:"FRESH tooth balm",               dEs:"Bálsamo dental FRESH. Higiene bucal natural, sin conservantes.",       dEn:"FRESH tooth balm. Natural oral care, no artificial preservatives.",   img:"oPWLFs9WbiL8ShGz6iqHY" },
  { slug:"fresh-tooth-oil",              cat:"skincare", line:"FRESH ORAL", es:"FRESH tooth oil",                en:"FRESH tooth oil",                dEs:"Aceite dental FRESH. Cuidado bucal con aceites esenciales naturales.", dEn:"FRESH tooth oil. Oral care with natural essential oils.",              img:"xcg6xPDSzAN8l-ihwDXzW" },
  { slug:"fresh-volume-shampoo",         cat:"skincare", line:"FRESH HAIR", es:"FRESH volume shampoo",           en:"FRESH volume shampoo",           dEs:"Champú voluminizador FRESH. Sin sulfatos ni siliconas.",               dEn:"FRESH volumizing shampoo. Sulfate & silicone-free.",                  img:"TDiWqBFOcg3DOvRbBi9RB" },

  // ─── SUPLEMENTOS (23) ───────────────────────────────────────────────────────
  { slug:"beyond-biotic",               cat:"suplementos", line:"BEYOND",  es:"BEYOND biotic",                  en:"BEYOND biotic",                  dEs:"Probiótico BEYOND Ringana. Flora intestinal equilibrada.",             dEn:"BEYOND biotic Ringana. Balanced intestinal flora.",                   img:"50CucjhY4KUFZau1H8gXz" },
  { slug:"beyond-omega",                cat:"suplementos", line:"BEYOND",  es:"BEYOND omega",                   en:"BEYOND omega",                   dEs:"Omega-3 vegetal BEYOND. Ácidos grasos esenciales de origen natural.", dEn:"BEYOND plant omega-3. Essential fatty acids from natural sources.",   img:"keGN7sW7keY6Zs-FFrb17" },
  { slug:"beyond-spermidine",           cat:"suplementos", line:"BEYOND",  es:"BEYOND spermidine",              en:"BEYOND spermidine",              dEs:"Espermidina BEYOND Ringana. Longevidad celular con ingredientes naturales.", dEn:"BEYOND spermidine Ringana. Cellular longevity, natural ingredients.", img:"2024/03/RINGANA-Produktfoto-beyond-spermedine-2000x2000-1.png" },
  { slug:"caps-beautyhair",             cat:"suplementos", line:"CAPS",    es:"CAPS beauty & hair",             en:"CAPS beauty & hair",             dEs:"Cápsulas belleza y cabello Ringana. Biotina, zinc y vitaminas.",       dEn:"Ringana beauty & hair caps. Biotin, zinc and vitamins.",             img:"0KyD1B0lEJufcE6TL-yBR" },
  { slug:"caps-cerebro",                cat:"suplementos", line:"CAPS",    es:"CAPS cerebro",                   en:"CAPS cerebro",                   dEs:"Cápsulas función cognitiva Ringana. Extractos naturales.",             dEn:"Ringana cognitive function caps. Natural extracts.",                  img:"Uqqi4XdrlcJm4dVaZY9mD" },
  { slug:"caps-d-gest",                 cat:"suplementos", line:"CAPS",    es:"CAPS d.gest",                    en:"CAPS d.gest",                    dEs:"Cápsulas digestivas Ringana. Enzimas y extractos vegetales.",          dEn:"Ringana digestive caps. Enzymes and plant extracts.",                 img:"2022/07/1FgF8OLt-ringana-caps-d-gest.png" },
  { slug:"caps-fem",                    cat:"suplementos", line:"CAPS",    es:"CAPS fem",                       en:"CAPS fem",                       dEs:"Cápsulas para la mujer Ringana. Formulación específica femenina.",     dEn:"Ringana caps for women. Female-specific formulation.",               img:"L09Fh11eZCkAQRK2eQR8l" },
  { slug:"caps-hydro",                  cat:"suplementos", line:"CAPS",    es:"CAPS hydro",                     en:"CAPS hydro",                     dEs:"Cápsulas hidratación Ringana. Electrolitos y minerales naturales.",    dEn:"Ringana hydration caps. Electrolytes and natural minerals.",         img:"EEwWSHA0_1KtKiLIwwAY3" },
  { slug:"caps-immu",                   cat:"suplementos", line:"CAPS",    es:"CAPS immu",                      en:"CAPS immu",                      dEs:"Cápsulas sistema inmune Ringana. Vitamina C, D y zinc.",               dEn:"Ringana immune system caps. Vitamin C, D and zinc.",                 img:"geNgt0h9fqB9yJ7BfW5m_" },
  { slug:"caps-mascu",                  cat:"suplementos", line:"CAPS",    es:"CAPS mascu",                     en:"CAPS mascu",                     dEs:"Cápsulas para el hombre Ringana. Formulación específica masculina.",   dEn:"Ringana caps for men. Male-specific formulation.",                   img:"2022/07/ringana-caps-mascu.png" },
  { slug:"caps-moodoo",                 cat:"suplementos", line:"CAPS",    es:"CAPS moodoo",                    en:"CAPS moodoo",                    dEs:"Cápsulas bienestar emocional Ringana. Adaptógenos naturales.",         dEn:"Ringana mood wellness caps. Natural adaptogens.",                    img:"hj8xpMWJAXCY0NjIkyd-K" },
  { slug:"caps-move",                   cat:"suplementos", line:"CAPS",    es:"CAPS move",                      en:"CAPS move",                      dEs:"Cápsulas movilidad articular Ringana. Ingredientes naturales.",        dEn:"Ringana joint mobility caps. Natural ingredients.",                  img:"" },
  { slug:"caps-protect",                cat:"suplementos", line:"CAPS",    es:"CAPS protect",                   en:"CAPS protect",                   dEs:"Cápsulas antioxidantes Ringana. Protección celular natural.",          dEn:"Ringana antioxidant caps. Natural cellular protection.",             img:"lte8QVkhfd6ZdBUfEiaOW" },
  { slug:"pack-antiox",                 cat:"suplementos", line:"PACK",    es:"Pack antiox",                    en:"Pack antiox",                    dEs:"Pack antioxidante Ringana. Combinación sinérgica de suplementos.",     dEn:"Ringana antiox pack. Synergistic supplement combination.",           img:"N9UiMPSjCefD1WJtRUtTT" },
  { slug:"pack-balancing",              cat:"suplementos", line:"PACK",    es:"Pack balancing",                 en:"Pack balancing",                 dEs:"Pack equilibrio Ringana. Suplementos complementarios naturales.",      dEn:"Ringana balancing pack. Complementary natural supplements.",         img:"EVzKV4ObHMHXhCHW0Csj1" },
  { slug:"pack-cleansing",              cat:"suplementos", line:"PACK",    es:"Pack cleansing",                 en:"Pack cleansing",                 dEs:"Pack detox Ringana. Purificación con ingredientes naturales.",         dEn:"Ringana cleansing pack. Purification with natural ingredients.",     img:"sZPv6xZDnSlV5Kshcdtfd" },
  { slug:"packs-abc",                   cat:"suplementos", line:"PACKS",   es:"PACKS ABC",                      en:"PACKS ABC",                      dEs:"Pack ABC Ringana. Vitaminas A, B y C en formato práctico.",           dEn:"Ringana ABC pack. Vitamins A, B and C in practical format.",         img:"GFxr-8cxrK3Ce_Dn4orpk" },
  { slug:"packs-abc-3er-set",           cat:"suplementos", line:"PACKS",   es:"PACKS ABC set 3",                en:"PACKS ABC set 3",                dEs:"Set 3 meses PACKS ABC Ringana. Ahorro y constancia.",                 dEn:"3-month PACKS ABC Ringana set. Savings and consistency.",            img:"fh8dIG9vo4MWEGaNptrZj" },
  { slug:"ringanabty",                  cat:"suplementos", line:"DRINK",   es:"RINGANAbty",                     en:"RINGANAbty",                     dEs:"Bebida de belleza Ringana. Colágeno y activos naturales.",             dEn:"Ringana beauty drink. Collagen and natural actives.",                img:"SsbdJ5nv68hptm3iWjR4F" },
  { slug:"ringanachi",                  cat:"suplementos", line:"DRINK",   es:"RINGANAchi",                     en:"RINGANAchi",                     dEs:"Bebida energética Ringana. Extractos naturales adaptógenos.",          dEn:"Ringana energy drink. Natural adaptogen extracts.",                  img:"2024/01/Ringana-produktfoto-ringanachi.png" },
  { slug:"ringana-dea",                 cat:"suplementos", line:"DRINK",   es:"RINGANA dea",                    en:"RINGANA dea",                    dEs:"Bebida nutritiva Ringana dea. Vitaminas y minerales naturales.",       dEn:"Ringana dea nutritious drink. Natural vitamins and minerals.",       img:"2023/09/R_Produktfoto_drinks-dea_700x700_1.png" },
  { slug:"ringanadea-set-of-2",         cat:"suplementos", line:"DRINK",   es:"RINGANA dea set 2",              en:"RINGANA dea set 2",              dEs:"Set 2 bebidas Ringana dea. Ahorro y comodidad.",                      dEn:"Set of 2 Ringana dea drinks. Savings and convenience.",             img:"2023/12/Ringana-Produktfoto-drinks-dea-set.png" },
  { slug:"ringanaisi",                  cat:"suplementos", line:"DRINK",   es:"RINGANA isi",                    en:"RINGANA isi",                    dEs:"Bebida RINGANA isi. Ingredientes naturales de alta calidad.",         dEn:"RINGANA isi drink. High-quality natural ingredients.",               img:"2024/02/RINGANA-drinks-isi.png" },

  // ─── COMPLETE (2) ───────────────────────────────────────────────────────────
  { slug:"complete-d-eat",              cat:"complete",    line:"COMPLETE", es:"COMPLETE d.eat",                 en:"COMPLETE d.eat",                 dEs:"Sustitutivo de comida Ringana. Macronutrientes equilibrados y naturales.", dEn:"Ringana meal replacement. Balanced and natural macronutrients.",  img:"" },
  { slug:"complete-d-eat-set",          cat:"complete",    line:"COMPLETE", es:"COMPLETE d.eat set",             en:"COMPLETE d.eat set",             dEs:"Set COMPLETE Ringana. Múltiples sabores, nutrición completa.",         dEn:"Ringana COMPLETE set. Multiple flavors, complete nutrition.",        img:"" },

  // ─── SPORT (7) ──────────────────────────────────────────────────────────────
  { slug:"ringana-sport-bottle",        cat:"sport",       line:"SPORT",   es:"Botella RINGANA Sport",          en:"RINGANA Sport bottle",           dEs:"Botella oficial Ringana Sport. Diseño deportivo y sostenible.",        dEn:"Official Ringana Sport bottle. Sporty and sustainable design.",      img:"G5ZLQgle7cN7U_Ey_mx3u" },
  { slug:"sport-endurance",             cat:"sport",       line:"SPORT",   es:"SPORT endurance",                en:"SPORT endurance",                dEs:"Complemento resistencia Ringana Sport. Carbohidratos naturales.",      dEn:"Ringana Sport endurance supplement. Natural carbohydrates.",         img:"I_lsonPCn_RlXyxoyuxlX" },
  { slug:"sport-endurance-set",         cat:"sport",       line:"SPORT",   es:"SPORT endurance set",            en:"SPORT endurance set",            dEs:"Set endurance Ringana Sport. Ahorro en formato práctico.",             dEn:"Ringana Sport endurance set. Savings in practical format.",          img:"K4QxAMtd7njEMf4VEFTDR" },
  { slug:"sport-protein",               cat:"sport",       line:"SPORT",   es:"SPORT protein",                  en:"SPORT protein",                  dEs:"Proteína vegetal Ringana Sport. Sin edulcorantes artificiales.",       dEn:"Ringana Sport plant protein. No artificial sweeteners.",            img:"KEJ7bB5rPfAoGuD10CYbL" },
  { slug:"sport-protein-set",           cat:"sport",       line:"SPORT",   es:"SPORT protein set",              en:"SPORT protein set",              dEs:"Set proteína Ringana Sport. Múltiples sabores naturales.",             dEn:"Ringana Sport protein set. Multiple natural flavors.",               img:"kFhd2eUYGJJkOILktcOwZ" },
  { slug:"sport-push",                  cat:"sport",       line:"SPORT",   es:"SPORT push",                     en:"SPORT push",                     dEs:"Pre-entreno Ringana Sport. Energía natural sin estimulantes.",         dEn:"Ringana Sport pre-workout. Natural energy without stimulants.",      img:"MtkV4tN_cr2foIieNoQNL" },
  { slug:"sport-push-set",              cat:"sport",       line:"SPORT",   es:"SPORT push set",                 en:"SPORT push set",                 dEs:"Set pre-entreno Ringana Sport. Formato ahorro.",                      dEn:"Ringana Sport pre-workout set. Savings format.",                     img:"89269cSwsUH6HapUsLTHm" },

  // ─── FRESH BABY (6) ─────────────────────────────────────────────────────────
  { slug:"fresh-baby-body-hair-wash",   cat:"baby",        line:"FRESH BABY", es:"FRESH baby body & hair wash", en:"FRESH baby body & hair wash",    dEs:"Gel baño bebé FRESH. Suave, testado dermatológicamente.",             dEn:"FRESH baby wash. Gentle, dermatologically tested.",                 img:"2024/01/RINGANA-fresh-baby-body-hair-wash-veggie-award.png" },
  { slug:"fresh-baby-bum-cream",        cat:"baby",        line:"FRESH BABY", es:"FRESH baby bum cream",        en:"FRESH baby bum cream",           dEs:"Crema pañal FRESH. Protege la piel del bebé sin conservantes.",      dEn:"FRESH nappy cream. Protects baby's skin, no preservatives.",        img:"2024/01/RINGANa-fresh-baby-bum-cream-veggie-award.png" },
  { slug:"fresh-baby-cream",            cat:"baby",        line:"FRESH BABY", es:"FRESH baby cream",            en:"FRESH baby cream",               dEs:"Crema bebé FRESH. Ingredientes naturales, formulación suave.",        dEn:"FRESH baby cream. Natural ingredients, gentle formulation.",         img:"2024/01/RINGANA-fresh-baby-cream-veggie-award.png" },
  { slug:"fresh-baby-oil",              cat:"baby",        line:"FRESH BABY", es:"FRESH baby oil",              en:"FRESH baby oil",                 dEs:"Aceite bebé FRESH. Nutritivo y suave, sin conservantes artificiales.", dEn:"FRESH baby oil. Nourishing and gentle, no preservatives.",         img:"2024/01/RINGANA-fresh-baby-oil-veggie-award.png" },
  { slug:"fresh-baby-sunscreen-spf-50", cat:"baby",        line:"FRESH BABY", es:"FRESH baby sunscreen SPF50",  en:"FRESH baby sunscreen SPF50",     dEs:"Protector solar bebé FRESH SPF50. Filtros minerales naturales.",      dEn:"FRESH baby sunscreen SPF50. Natural mineral filters.",              img:"" },
  { slug:"fresh-baby-tooth-gel",        cat:"baby",        line:"FRESH BABY", es:"FRESH baby tooth gel",        en:"FRESH baby tooth gel",           dEs:"Gel dental bebé FRESH. Para los primeros dientes, sin fluoruros sintéticos.", dEn:"FRESH baby tooth gel. For first teeth, no synthetic fluorides.", img:"" },
];

// Local images from /public/ringana/ — verified 1:1 product matches
// Removed: adds-collagen.jpg (empty file), body-oil.jpg (group photo),
//           perfume-nuda.jpg (group of 3 serums), perfume-alm.jpg (group photo)
const LOCAL_IMGS: Record<string, string> = {
  "fresh-adds-glow":                "/ringana/adds-glow.jpg",
  "beyond-omega":                   "/ringana/adds-omega.jpg",
  "caps-immu":                      "/ringana/adds-vitamin-d.jpg",
  "fresh-body-milk-rich":           "/ringana/body-lotion.jpg",
  "fresh-scrub":                    "/ringana/body-scrub.jpg",
  "fresh-cleanser":                 "/ringana/fresh-cleanser.jpg",
  "fresh-eye-serum":                "/ringana/fresh-eye-cream.jpg",
  "fresh-illuminating-enzyme-mask": "/ringana/fresh-mask.jpg",
  "fresh-cream-medium":             "/ringana/fresh-moisturiser.jpg",
  "fresh-hydro-serum":              "/ringana/fresh-serum.jpg",
  "fresh-tonic-pure":               "/ringana/fresh-toner.jpg",
  "fresh-hair-treatment":           "/ringana/hair-mask.jpg",
  "fresh-volume-shampoo":           "/ringana/hair-oil.jpg",
  "fresh-repair-shampoo":           "/ringana/hair-shampoo.jpg",
  "fresh-sunscreen-face":           "/ringana/sun-cream-spf30.jpg",
  "sport-protein":                  "/ringana/sport-shake.jpg",
};

// Fallback genérico (foto de grupo de productos Ringana) para productos sin foto local 1:1.
// Las URLs imgix devuelven 403 (hotlink bloqueado) — nunca usarlas.
const FALLBACK_IMG = "/ringana/body-oil.jpg";

const CAT_ORDER = ["skincare", "suplementos", "complete", "sport", "baby"] as const;
const CATS: Record<string, { es: string; en: string; icon: string; suppDisclaimer?: boolean }> = {
  skincare:    { es: "FRESH Skincare",  en: "FRESH Skincare", icon: "✨" },
  suplementos: { es: "Suplementos",     en: "Supplements",    icon: "💊", suppDisclaimer: true },
  complete:    { es: "COMPLETE",        en: "COMPLETE",       icon: "🥗", suppDisclaimer: true },
  sport:       { es: "Sport",           en: "Sport",          icon: "💪", suppDisclaimer: true },
  baby:        { es: "Fresh Baby",      en: "Fresh Baby",     icon: "👶" },
};

const WHY_RINGANA = [
  { icon: "🌿", es: "Sin Conservantes",      en: "No Preservatives",   dEs: "Fórmulas frescas — sin conservantes artificiales.",       dEn: "Fresh formulas — no artificial preservatives." },
  { icon: "🔬", es: "Formulación Científica", en: "Science-Backed",     dEs: "Testado dermatológicamente en Austria.",                   dEn: "Dermatologically tested in Austria." },
  { icon: "🐇", es: "100% Vegano",           en: "100% Vegan",          dEs: "Certificado PETA. Nunca testado en animales.",             dEn: "PETA certified. Never tested on animals." },
  { icon: "♻️", es: "Packaging Eco",         en: "Eco Packaging",       dEs: "Envases recargables y materiales reciclados.",             dEn: "Refillable containers, recycled materials." },
];

export default async function RinganaPage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  setRequestLocale(locale);
  const isEs = locale === "es";
  const ringanaLang = isEs ? "es" : "en";

  const T = {
    ad_disclosure: isEs
      ? "📢 Publicidad. AizuaBeauty actúa como partner independiente de Ringana (Independent Ringana Partner). Al hacer clic en «Comprar» serás redirigida a la tienda oficial de Ringana. Los precios se muestran en la web oficial de Ringana y son responsabilidad exclusiva de Ringana GmbH."
      : "📢 Advertising. AizuaBeauty is an Independent Ringana Partner. Clicking «Buy» redirects you to the official Ringana store. Prices are shown on Ringana's official website and are the sole responsibility of Ringana GmbH.",
    supp_disclaimer: isEs
      ? "* Los complementos alimenticios no deben utilizarse como sustitutos de una dieta variada y equilibrada ni de un estilo de vida saludable. Mantener fuera del alcance de los niños."
      : "* Food supplements should not replace a varied and balanced diet or a healthy lifestyle. Keep out of reach of children.",
    medical_disclaimer: isEs
      ? "⚕️ Los productos RINGANA no son medicamentos. En caso de tener problemas de salud, consulte a su médico. Los productos RINGANA no están pensados para tratar o curar enfermedades. Los resultados pueden variar según factores individuales (tipo de piel, edad, estilo de vida, etc.)."
      : "⚕️ RINGANA products are not medicine. If you have health concerns, consult your doctor. RINGANA products are not intended to diagnose, treat, or cure any disease. Results may vary depending on individual factors (skin type, age, lifestyle, etc.).",
    important_notes_link: isEs
      ? "Más información en la página de"
      : "More information at",
    important_notes_label: isEs ? "Información Importante de Ringana" : "RINGANA's Important Notes",
    badge:         isEs ? "Independent Ringana Partner" : "Independent Ringana Partner",
    title1:        isEs ? "Cosmética" : "Natural",
    title2:        isEs ? "100% Natural" : "Cosmetics",
    sub:           isEs
      ? "85 productos RINGANA. Fórmulas frescas, ingredientes de origen natural, sin conservantes artificiales. Fabricado y enviado desde Austria."
      : "85 RINGANA products. Fresh formulas, natural-origin ingredients, no artificial preservatives. Made and shipped from Austria.",
    why_title:     isEs ? "¿Por qué Ringana?" : "Why Ringana?",
    catalog_title: isEs ? "Catálogo Completo" : "Full Catalog",
    catalog_sub:   isEs ? "85 productos. Haz clic en cualquier producto para ver el precio y comprar directamente en Ringana." : "85 products. Click any product to see the price and buy directly on Ringana.",
    buy_btn:       isEs ? "Ver precio · Comprar →" : "See price · Buy →",
    all_btn:       isEs ? "Ver catálogo completo en Ringana →" : "Browse full catalog on Ringana →",
    partner_note:  isEs
      ? "Soy Independent Ringana Partner. Al comprar a través de mi enlace de partner me apoyas directamente, sin coste adicional para ti."
      : "I am an Independent Ringana Partner. Buying through my partner link supports me at no extra cost to you.",
    partner_title: isEs ? "¿Te interesa ser partner?" : "Interested in becoming a partner?",
    partner_sub:   isEs
      ? "Ringana dispone de un programa de partnership. Si quieres más información, escríbeme."
      : "Ringana has a partnership program. Write to me if you'd like more information.",
    partner_cta:   isEs ? "Consultar →" : "Learn more →",
  };

  const hasSuppCats = ["suplementos", "complete", "sport"];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ItemList",
        "name": isEs ? "Catálogo Ringana — AizuaBeauty" : "Ringana Catalog — AizuaBeauty",
        "description": isEs ? "85 productos Ringana, partner oficial" : "85 Ringana products, official partner",
        "numberOfItems": PRODUCTS.length,
        "itemListElement": PRODUCTS.slice(0, 20).map((p, i) => ({
          "@type": "ListItem",
          "position": i + 1,
          "item": {
            "@type": "Product",
            "name": isEs ? p.es : p.en,
            "description": isEs ? p.dEs : p.dEn,
            "brand": { "@type": "Brand", "name": "RINGANA" },
            "url": `${RINGANA_BASE}/produkt/${p.slug}/?lang=${ringanaLang}`,
          },
        })),
      },
      {
        "@type": "Organization",
        "name": "AizuaBeauty",
        "url": "https://beauty.aizualabs.com",
        "description": isEs ? "Partner oficial de Ringana en España" : "Official Ringana partner in Spain",
      },
      {
        "@type": "Brand",
        "@id": "https://www.ringana.com/#brand",
        "name": "RINGANA",
        "alternateName": "Ringana GmbH",
        "description": isEs
          ? "Empresa austriaca de cosmética natural y suplementos sin conservantes artificiales, certificada vegana por PETA. Fundada en 2001 en Weiz, Austria."
          : "Austrian natural cosmetics and supplement company without artificial preservatives, PETA vegan certified. Founded in 2001 in Weiz, Austria.",
        "url": "https://www.ringana.com",
        "foundingDate": "2001",
        "foundingLocation": { "@type": "Place", "name": "Weiz, Austria" },
        "sameAs": ["https://www.ringana.com", "https://www.instagram.com/ringana/"],
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": isEs ? "¿Qué es Ringana?" : "What is Ringana?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": isEs
                ? "Ringana es una empresa austriaca de cosmética natural y suplementos fundada en 2001 en Weiz, Austria. Fabrica productos sin conservantes artificiales (sin parabenos, fenoxietanol ni PEG) con ingredientes de origen natural, certificados veganos por PETA. Sus líneas principales son FRESH Skincare, CAPS y BEYOND (suplementos), SPORT y FRESH BABY."
                : "Ringana is an Austrian natural cosmetics and supplement company founded in 2001 in Weiz, Austria. It manufactures products without artificial preservatives (no parabens, phenoxyethanol or PEG) using natural-origin ingredients, PETA vegan certified. Its main lines are FRESH Skincare, CAPS and BEYOND (supplements), SPORT and FRESH BABY.",
            },
          },
          {
            "@type": "Question",
            "name": isEs ? "¿Qué significa que Ringana no usa conservantes artificiales?" : "What does it mean that Ringana does not use artificial preservatives?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": isEs
                ? "Ringana fabrica sus cosméticos en lotes pequeños y los entrega frescos desde Austria. Sin parabenos, fenoxietanol ni PEG, los productos mantienen mayor integridad de los activos vegetales. Su vida útil es más corta que la cosmética convencional, pero la calidad de los ingredientes es más alta."
                : "Ringana manufactures cosmetics in small batches and delivers them fresh from Austria. Without parabens, phenoxyethanol or PEG, the products maintain higher integrity of plant actives. Their shelf life is shorter than conventional cosmetics, but the ingredient quality is higher.",
            },
          },
          {
            "@type": "Question",
            "name": isEs ? "¿Qué productos tiene Ringana?" : "What products does Ringana have?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": isEs
                ? "Ringana tiene más de 300 productos en las líneas FRESH Skincare (cremas, sérums, protección solar, cuidado capilar), CAPS y BEYOND (suplementos para inmunidad, digestión y longevidad celular), COMPLETE (sustitutivos de comida), SPORT (proteínas vegetales, pre-entreno) y FRESH BABY (cosmética infantil certificada)."
                : "Ringana has more than 300 products across the FRESH Skincare (creams, serums, sun protection, hair care), CAPS and BEYOND (supplements for immunity, digestion and cellular longevity), COMPLETE (meal replacements), SPORT (plant proteins, pre-workout) and FRESH BABY (certified baby care) lines.",
            },
          },
          {
            "@type": "Question",
            "name": isEs ? "¿Puedo comprar Ringana en España?" : "Can I buy Ringana in Spain?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": isEs
                ? "Sí. AizuaBeauty es partner oficial de Ringana y puedes comprar cualquier producto haciendo clic en el catálogo de esta página. Serás redirigido a la tienda oficial de Ringana, que envía a toda la Unión Europea desde Austria en 5-10 días hábiles."
                : "Yes. AizuaBeauty is an official Ringana partner and you can buy any product by clicking the catalog on this page. You will be redirected to the official Ringana store, which ships throughout the European Union from Austria in 5-10 business days.",
            },
          },
        ],
      },
    ],
  };

  return (
    <div style={{ minHeight: "100vh", background: "#FAF8F5", fontFamily: "var(--font-lato, sans-serif)" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <MainNav locale={locale} />

      {/* ── ADVERTISING DISCLOSURE ── */}
      <div style={{
        background: "#FFFBEB", borderBottom: "1px solid #F5E6A0",
        padding: "0.65rem 2rem", textAlign: "center",
        marginTop: "80px",
      }}>
        <p style={{ fontSize: "0.76rem", color: "#5C4A00", margin: 0, lineHeight: 1.55, fontWeight: 500 }}>
          {T.ad_disclosure}
        </p>
      </div>

      {/* ── HERO ── */}
      <section style={{
        padding: "2.5rem 2.5rem 2.5rem",
        background: "linear-gradient(155deg, #EAF2E4 0%, #FAF8F5 55%, #F5F0EA 100%)",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: "700px", margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#7BA05B", display: "inline-block" }} />
            <span style={{ fontSize: "0.72rem", color: "#7BA05B", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" as const }}>
              {T.badge}
            </span>
          </div>
          <h1 style={{
            fontFamily: "var(--font-cormorant, Georgia, serif)",
            fontSize: "clamp(2.2rem, 5vw, 3.8rem)",
            fontWeight: 300, lineHeight: 1.15, color: "#2C2C2C",
            margin: "0 0 0.5rem",
          }}>
            {T.title1}{" "}
            <em style={{ fontStyle: "italic", color: "#7BA05B", fontWeight: 400 }}>{T.title2}</em>
          </h1>
          <p style={{ color: "#6B6B6B", fontSize: "clamp(13px,1.4vw,15px)", lineHeight: 1.65, maxWidth: "560px", margin: "0.75rem auto 0" }}>
            {T.sub}
          </p>
        </div>
      </section>

      {/* ── GEO DEFINITION — Qué es Ringana ── */}
      <section style={{ padding: "2rem 2.5rem 0.5rem", background: "#FAF8F5" }}>
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>
          <div style={{
            background: "rgba(123,160,91,0.06)",
            border: "1px solid rgba(123,160,91,0.22)",
            borderRadius: "14px",
            padding: "1.5rem 1.75rem",
          }}>
            <h2 style={{
              fontFamily: "var(--font-cormorant, Georgia, serif)",
              fontSize: "1.35rem", fontWeight: 600, color: "#2C2C2C",
              marginBottom: "0.9rem",
            }}>
              {isEs ? "¿Qué es Ringana?" : "What is Ringana?"}
            </h2>
            <p style={{ fontSize: "0.875rem", color: "#4A4A4A", lineHeight: 1.72, marginBottom: "0.75rem" }}>
              {isEs
                ? "Ringana es una empresa austriaca de cosmética natural y suplementos fundada en 2001 en Weiz, Austria. Su filosofía central consiste en formular todos sus productos sin conservantes artificiales (sin parabenos, fenoxietanol ni PEG), utilizando únicamente ingredientes de origen natural. Los cosméticos se fabrican en lotes pequeños y se envían frescos directamente desde la fábrica, lo que permite preservar la máxima actividad de los extractos botánicos."
                : "Ringana is an Austrian natural cosmetics and supplement company founded in 2001 in Weiz, Austria. Its core philosophy is to formulate all products without artificial preservatives (no parabens, phenoxyethanol or PEG), using only natural-origin ingredients. Cosmetics are produced in small batches and shipped fresh directly from the factory, preserving the maximum activity of botanical extracts."}
            </p>
            <p style={{ fontSize: "0.875rem", color: "#4A4A4A", lineHeight: 1.72, marginBottom: "0.75rem" }}>
              {isEs
                ? "Ringana ofrece más de 300 referencias organizadas en cinco grandes líneas: FRESH Skincare (cremas faciales, sérums, protección solar, cuidado capilar y corporal), CAPS y BEYOND (suplementos alimenticios en cápsulas para inmunidad, digestión, longevidad celular y bienestar), COMPLETE (sustitutivos de comida equilibrados), SPORT (proteínas vegetales, pre-entreno y endurance) y FRESH BABY (cosmética infantil certificada)."
                : "Ringana offers more than 300 references organized into five main lines: FRESH Skincare (face creams, serums, sun protection, hair and body care), CAPS and BEYOND (capsule food supplements for immunity, digestion, cellular longevity and wellness), COMPLETE (balanced meal replacements), SPORT (plant proteins, pre-workout and endurance) and FRESH BABY (certified baby cosmetics)."}
            </p>
            <p style={{ fontSize: "0.875rem", color: "#4A4A4A", lineHeight: 1.72, marginBottom: "0.75rem" }}>
              {isEs
                ? "Desde el punto de vista de las certificaciones, todos los productos Ringana son 100% veganos y están certificados por PETA (nunca testados en animales). La empresa utiliza envases recargables y materiales reciclados, reduciendo significativamente el impacto ambiental de su packaging. Todas las fórmulas son testadas dermatológicamente."
                : "On the certifications front, all Ringana products are 100% vegan and PETA-certified (never tested on animals). The company uses refillable containers and recycled materials, significantly reducing the environmental impact of its packaging. All formulas are dermatologically tested."}
            </p>
            <p style={{ fontSize: "0.875rem", color: "#4A4A4A", lineHeight: 1.72, margin: 0 }}>
              {isEs
                ? "AizuaBeauty es partner oficial de Ringana en España, lo que permite acceder al catálogo completo de más de 300 productos y comprar directamente en la tienda oficial de Ringana con envío a toda la Unión Europea."
                : "AizuaBeauty is an official Ringana partner in Spain, giving access to the full catalog of 300+ products and the ability to purchase directly from the official Ringana store with shipping throughout the European Union."}
            </p>
          </div>
        </div>
      </section>

      {/* ── WHY RINGANA ── */}
      <section style={{ padding: "2.5rem 2.5rem", background: "#fff" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <h2 style={{
            fontFamily: "var(--font-cormorant, Georgia, serif)",
            fontSize: "clamp(1.5rem, 2.5vw, 2rem)",
            fontWeight: 400, color: "#2C2C2C",
            textAlign: "center", marginBottom: "1.75rem",
          }}>
            {T.why_title}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: "1rem" }}>
            {WHY_RINGANA.map((w) => (
              <div key={w.en} style={{ background: "#FAF8F5", border: "1px solid #EDE9E3", borderRadius: "12px", padding: "1.25rem", textAlign: "center" }}>
                <div style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>{w.icon}</div>
                <h3 style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.05rem", fontWeight: 600, color: "#2C2C2C", marginBottom: "0.3rem" }}>
                  {isEs ? w.es : w.en}
                </h3>
                <p style={{ fontSize: "0.8rem", color: "#6B6B6B", lineHeight: 1.5, margin: 0 }}>
                  {isEs ? w.dEs : w.dEn}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PARTNER NOTE ── */}
      <div style={{ background: "#EAF2E4", padding: "0.75rem 2rem", textAlign: "center", borderTop: "1px solid #C8DDB8", borderBottom: "1px solid #C8DDB8" }}>
        <p style={{ fontSize: "0.8rem", color: "#5C8044", margin: 0 }}>
          🌿 <strong>{isEs ? "Publicidad:" : "Ad:"}</strong> {T.partner_note}
        </p>
      </div>

      {/* ── CATALOG ── */}
      <section style={{ padding: "3.5rem 2.5rem", background: "#FAF8F5" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <div style={{ display: "inline-block", background: "#EAF2E4", color: "#5C8044", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.12em", padding: "0.3rem 1rem", borderRadius: "20px", marginBottom: "0.65rem", textTransform: "uppercase" as const }}>
              Ringana
            </div>
            <h2 style={{ fontFamily: "var(--font-cormorant, Georgia, serif)", fontSize: "clamp(1.6rem, 3vw, 2.3rem)", fontWeight: 400, color: "#2C2C2C", margin: "0 0 0.4rem" }}>
              {T.catalog_title}
            </h2>
            <p style={{ color: "#6B6B6B", fontSize: "0.85rem", maxWidth: "480px", margin: "0 auto" }}>
              {T.catalog_sub}
            </p>
          </div>

          {/* Category quick-nav */}
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "0.5rem", justifyContent: "center", marginBottom: "3rem" }}>
            {CAT_ORDER.map((cat) => {
              const info = CATS[cat];
              const count = PRODUCTS.filter((p) => p.cat === cat).length;
              return (
                <a key={cat} href={`#cat-${cat}`} style={{
                  display: "inline-flex", alignItems: "center", gap: "0.4rem",
                  background: "#fff", border: "1px solid #EDE9E3", borderRadius: "30px",
                  padding: "0.4rem 1rem", fontSize: "0.78rem", fontWeight: 600, color: "#4A4A4A",
                  textDecoration: "none", letterSpacing: "0.03em",
                }}>
                  {info.icon} {isEs ? info.es : info.en}
                  <span style={{ background: "#EAF2E4", color: "#5C8044", fontSize: "0.65rem", fontWeight: 700, padding: "1px 6px", borderRadius: "10px" }}>
                    {count}
                  </span>
                </a>
              );
            })}
          </div>

          {/* Products by category */}
          {CAT_ORDER.map((cat) => {
            const catProducts = PRODUCTS.filter((p) => p.cat === cat);
            if (!catProducts.length) return null;
            const info = CATS[cat];
            return (
              <div key={cat} id={`cat-${cat}`} style={{ marginBottom: "4rem", scrollMarginTop: "100px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
                  <span style={{ fontSize: "1.4rem" }}>{info.icon}</span>
                  <h3 style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.45rem", fontWeight: 600, color: "#2C2C2C", margin: 0 }}>
                    {isEs ? info.es : info.en}
                  </h3>
                  <span style={{ background: "#EAF2E4", color: "#5C8044", fontSize: "0.65rem", fontWeight: 700, padding: "2px 8px", borderRadius: "10px" }}>
                    {catProducts.length} {isEs ? "productos" : "products"}
                  </span>
                  <div style={{ flex: 1, height: "1px", background: "#EDE9E3" }} />
                </div>

                {info.suppDisclaimer && (
                  <p style={{ fontSize: "0.75rem", color: "#9A9A9A", fontStyle: "italic", marginBottom: "1rem" }}>
                    {T.supp_disclaimer}
                  </p>
                )}

                <div className="store-products-grid">
                  {catProducts.map((p) => {
                    const name = isEs ? p.es : p.en;
                    const desc = isEs ? p.dEs : p.dEn;
                    const imgSrc = LOCAL_IMGS[p.slug] || (p.img ? FALLBACK_IMG : "");
                    const buyUrl = `${RINGANA_BASE}/produkt/${p.slug}/?lang=${ringanaLang}`;
                    return (
                      <a
                        key={p.slug}
                        href={buyUrl}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        className="premium-card"
                        style={{ textDecoration: "none", display: "block", cursor: "pointer" }}
                      >
                        <div className="card-img-wrap" style={{ position: "relative", overflow: "hidden" }}>
                          {imgSrc ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={imgSrc}
                              alt={name}
                              loading="lazy"
                              style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "center", display: "block", background: "#F5F5F0" }}
                            />
                          ) : (
                            <div style={{
                              width: "100%", height: "100%",
                              background: "linear-gradient(135deg, #EAF2E4, #F5F0EA)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                              <span style={{ fontSize: "2.5rem", opacity: 0.5 }}>{info.icon}</span>
                            </div>
                          )}
                          <span style={{
                            position: "absolute", top: "8px", right: "8px",
                            background: "rgba(255,255,255,0.92)", color: "#5C8044",
                            fontSize: "0.58rem", fontWeight: 700, padding: "2px 6px",
                            borderRadius: "4px", textTransform: "uppercase" as const,
                            backdropFilter: "blur(4px)", letterSpacing: "0.05em",
                          }}>
                            {p.line}
                          </span>
                        </div>

                        <div style={{ padding: "12px 14px 14px" }}>
                          <p style={{ fontSize: "13px", fontWeight: 700, color: "#2C2C2C", marginBottom: "4px", lineHeight: 1.3 }}>{name}</p>
                          <p style={{ fontSize: "11px", color: "#7A7A7A", lineHeight: 1.5, marginBottom: "10px" }}>{desc}</p>

                          <div style={{
                            display: "block", textAlign: "center",
                            background: "#7BA05B", color: "#fff",
                            padding: "0.45rem 0.75rem", borderRadius: "20px",
                            fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.04em",
                            textTransform: "uppercase" as const,
                          }}>
                            {T.buy_btn}
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Bottom CTA */}
          <div style={{ textAlign: "center", marginTop: "2rem", paddingTop: "2rem", borderTop: "1px solid #EDE9E3" }}>
            <p style={{ color: "#6B6B6B", fontSize: "0.86rem", marginBottom: "1.25rem" }}>
              {isEs
                ? "Catálogo completo de más de 300 productos disponible en la tienda oficial de Ringana."
                : "Full catalog of 300+ products available at the official Ringana store."}
            </p>
            <a
              href={RINGANA_BASE}
              target="_blank"
              rel="noopener noreferrer sponsored"
              style={{
                display: "inline-block",
                border: "1.5px solid #7BA05B", color: "#7BA05B",
                padding: "0.8rem 2rem", borderRadius: "50px",
                fontWeight: 700, fontSize: "0.83rem", letterSpacing: "0.05em",
                textTransform: "uppercase" as const, textDecoration: "none",
              }}
            >
              {T.all_btn}
            </a>
          </div>
        </div>
      </section>

      {/* ── RINGANA LEGAL / COMPLIANCE NOTICE ── */}
      <section style={{ background: "#F4F2EE", padding: "2rem 2.5rem", borderTop: "1px solid #E2DDD8" }}>
        <div style={{ maxWidth: "820px", margin: "0 auto" }}>
          <p style={{ fontSize: "0.72rem", color: "#7A7A7A", lineHeight: 1.8, margin: "0 0 0.6rem", textAlign: "center" }}>
            {T.medical_disclaimer}
          </p>
          <p style={{ fontSize: "0.72rem", color: "#9A9A9A", lineHeight: 1.7, margin: 0, textAlign: "center" }}>
            {T.important_notes_link}{" "}
            <a
              href={`${RINGANA_BASE}/informacion-importante/?lang=${ringanaLang}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#7BA05B", textDecoration: "underline" }}
            >
              {T.important_notes_label}
            </a>
            {isEs ? ". Ringana GmbH, Am Anger 1, 8160 Weiz, Austria." : ". Ringana GmbH, Am Anger 1, 8160 Weiz, Austria."}
          </p>
        </div>
      </section>

      {/* ── PARTNER CTA ── */}
      <section style={{
        padding: "3.5rem 2.5rem",
        background: "linear-gradient(135deg, #2C2C2C 0%, #3D3D3D 100%)",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: "520px", margin: "0 auto" }}>
          <div style={{ display: "inline-block", background: "rgba(123,160,91,0.2)", color: "#A8CC80", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.12em", padding: "0.3rem 1rem", borderRadius: "20px", marginBottom: "1.1rem", textTransform: "uppercase" as const }}>
            Ringana Partner Program
          </div>
          <h2 style={{ fontFamily: "var(--font-cormorant, Georgia, serif)", fontSize: "clamp(1.5rem, 2.8vw, 2.1rem)", fontWeight: 400, color: "#FAF8F5", margin: "0 0 0.9rem" }}>
            {T.partner_title}
          </h2>
          <p style={{ color: "#B0B0B0", fontSize: "0.86rem", lineHeight: 1.65, marginBottom: "1.5rem" }}>
            {T.partner_sub}
          </p>
          <a
            href={`mailto:info@aizualabs.com?subject=Ringana%20Partner`}
            style={{
              display: "inline-block",
              background: "#7BA05B", color: "#fff",
              padding: "0.8rem 2rem", borderRadius: "50px",
              fontWeight: 700, fontSize: "0.83rem", letterSpacing: "0.05em",
              textTransform: "uppercase" as const, textDecoration: "none",
            }}
          >
            {T.partner_cta}
          </a>
        </div>
      </section>

      <Footer locale={locale} />
    </div>
  );
}
