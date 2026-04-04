// app/api/meta-campaigns/route.ts
// Aizua — Crear y gestionar campañas Meta vía API
// POST { action: "create_campaign" | "create_adset" | "create_ad" | "get_insights" }

import { NextRequest, NextResponse } from "next/server";

const META_API   = "https://graph.facebook.com/v19.0";
const ADS_TOKEN  = process.env.META_ADS_TOKEN!;
const AD_ACCOUNT = process.env.META_AD_ACCOUNT_ID!;
const PAGE_ID    = process.env.META_PAGE_ID!;

// ── CREAR CAMPAÑA DE CONVERSIÓN ──
async function createCampaign(name: string, objective = "OUTCOME_SALES") {
  const res = await fetch(`${META_API}/${AD_ACCOUNT}/campaigns`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      name,
      objective,
      status:         "PAUSED",          // Empezar pausada, activar manualmente tras review
      special_ad_categories: "[]",
      access_token:   ADS_TOKEN,
    }).toString(),
  });
  return res.json();
}

// ── CREAR AD SET ──
async function createAdSet(params: {
  campaignId:   string;
  name:         string;
  budget:       number;       // euros/día
  countries:    string[];     // ["ES","FR","DE"]
  ageMin?:      number;
  ageMax?:      number;
  interests?:   string[];     // IDs de intereses Meta
  pixelId:      string;
  isRetargeting?: boolean;
  retargetingDays?: number;
}) {
  const targeting: Record<string, unknown> = {
    geo_locations: { countries: params.countries },
    age_min: params.ageMin || 22,
    age_max: params.ageMax || 55,
  };

  // Audiencia fría con intereses
  if (params.interests?.length && !params.isRetargeting) {
    targeting.flexible_spec = [{
      interests: params.interests.map(id => ({ id, name: "" })),
    }];
  }

  // Audiencia de retargeting (visitantes del sitio)
  if (params.isRetargeting) {
    targeting.custom_audiences = [{
      // ID de la audiencia personalizada de visitantes — crear en Meta Audiences
      id: process.env.META_VISITORS_AUDIENCE_ID || "",
    }];
  }

  const res = await fetch(`${META_API}/${AD_ACCOUNT}/adsets`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      name:                     params.name,
      campaign_id:              params.campaignId,
      daily_budget:             String(Math.round(params.budget * 100)),
      billing_event:            "IMPRESSIONS",
      optimization_goal:        "OFFSITE_CONVERSIONS",
      status:                   "PAUSED",
      targeting:                JSON.stringify(targeting),
      promoted_object:          JSON.stringify({
        pixel_id:       params.pixelId,
        custom_event_type: "PURCHASE",
      }),
      // Advantage+ Audience — Meta optimiza la audiencia automáticamente
      use_audience_network:     "true",
      access_token:             ADS_TOKEN,
    }).toString(),
  });
  return res.json();
}

// ── CREAR ANUNCIO ──
async function createAd(params: {
  adSetId:      string;
  name:         string;
  headline:     string;
  body:         string;
  imageUrl:     string;
  cta:          string;      // "SHOP_NOW", "LEARN_MORE", "BUY_NOW"
  websiteUrl:   string;
}) {
  // 1. Crear creative
  const creativeRes = await fetch(`${META_API}/${AD_ACCOUNT}/adcreatives`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      name:        `${params.name} Creative`,
      object_story_spec: JSON.stringify({
        page_id: PAGE_ID,
        link_data: {
          image_url:   params.imageUrl,
          link:        params.websiteUrl,
          message:     params.body,
          name:        params.headline,
          call_to_action: { type: params.cta },
        },
      }),
      access_token: ADS_TOKEN,
    }).toString(),
  });

  const creative = await creativeRes.json();
  if (creative.error) throw new Error(`Creative error: ${creative.error.message}`);

  // 2. Crear anuncio usando el creative
  const adRes = await fetch(`${META_API}/${AD_ACCOUNT}/ads`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      name:        params.name,
      adset_id:    params.adSetId,
      creative:    JSON.stringify({ creative_id: creative.id }),
      status:      "PAUSED",
      access_token: ADS_TOKEN,
    }).toString(),
  });
  return adRes.json();
}

// ── INSIGHTS ──
async function getCampaignInsights(campaignId: string, datePreset = "last_7d") {
  const fields = "spend,purchase_roas,impressions,clicks,ctr,cpc,actions,cost_per_action_type";
  const res = await fetch(
    `${META_API}/${campaignId}/insights?fields=${fields}&date_preset=${datePreset}&access_token=${ADS_TOKEN}`
  );
  return res.json();
}

// ── ENDPOINT ──
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.SYNC_SECRET_TOKEN}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { action, params } = await req.json();

    switch (action) {
      case "create_campaign":
        return NextResponse.json(await createCampaign(params.name, params.objective));

      case "create_adset":
        return NextResponse.json(await createAdSet(params));

      case "create_ad":
        return NextResponse.json(await createAd(params));

      case "get_insights":
        return NextResponse.json(await getCampaignInsights(params.campaignId, params.datePreset));

      // ── SETUP COMPLETO DE LA PRIMERA CAMPAÑA ──
      // Llama a este endpoint con action="setup_first_campaign" para crear toda la estructura
      case "setup_first_campaign": {
        const campaign = await createCampaign("Aizua — AizuaPod Pro X — Conversión");
        if (campaign.error) throw new Error(campaign.error.message);

        const adSet = await createAdSet({
          campaignId: campaign.id,
          name:       "ES+FR+DE · 22-45 · Tecnología",
          budget:     5,
          countries:  ["ES", "FR", "DE", "IT", "PT"],
          ageMin:     22,
          ageMax:     45,
          pixelId:    process.env.META_PIXEL_ID || "",
        });
        if (adSet.error) throw new Error(adSet.error.message);

        const ad = await createAd({
          adSetId:    adSet.id,
          name:       "AizuaPod — Creative A — Metro",
          headline:   "Silencia el mundo. Siente la música.",
          body:       "ANC 40dB · 40h batería · Desde €89.99 con envío gratis ✈️",
          imageUrl:   params.imageUrl || `${process.env.NEXT_PUBLIC_APP_URL}/ads/aizuapod-metro.jpg`,
          cta:        "SHOP_NOW",
          websiteUrl: `${process.env.NEXT_PUBLIC_APP_URL}/es/product/auriculares-anc-40db-aizuapod-pro-x`,
        });

        return NextResponse.json({
          success: true,
          campaignId: campaign.id,
          adSetId:    adSet.id,
          adId:       ad.id,
          note:       "Campaña creada en estado PAUSED. Revisa en Meta Ads Manager y activa cuando esté lista.",
        });
      }

      default:
        return NextResponse.json({ error: `Acción desconocida: ${action}` }, { status: 400 });
    }

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
