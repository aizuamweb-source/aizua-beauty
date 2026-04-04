#!/bin/bash
# Run this on your local machine (not in Cowork VM) to push all new/modified files to GitHub
# cd to your Aizua-store directory first

cd "$(dirname "$0")"

# Remove stale lock files if they exist
rm -f .git/index.lock .git/HEAD.lock 2>/dev/null

# Add all new/modified files
git add \
  "app/globals.css" \
  "app/[locale]/page.tsx" \
  "app/[locale]/blog/page.tsx" \
  "app/[locale]/blog/[slug]/page.tsx" \
  "app/[locale]/academy/page.tsx" \
  "app/[locale]/consulting/page.tsx" \
  "app/[locale]/legal/[slug]/page.tsx" \
  "components/checkout/CheckoutClient.tsx" \
  "components/product/ProductClient.tsx" \
  "components/tienda/CatalogoClient.tsx" \
  "migrations/ALL_PENDING_MIGRATIONS.sql"

# Commit
git commit -m "fix: mobile layout, logo size, checkout errors, legal footer

- Fix mobile responsiveness: product detail page 2-col → 1-col on small screens
- Fix product image gallery: selected image now fills full width on mobile
- Fix upsells/trust grids: responsive breakpoints via globals.css classes
- Double logo size in all navbars and footers (nav: 300px, footer: 240px)
- Add maxWidth inner container to all navbars for proper centering
- Fix tienda footer: replace AIZÜA text with actual logo image
- Enrich legal page footer with Home + Tienda links and active page highlight
- Fix checkout error handling: show actual API error + Retry button
- Fix checkout grid: stacks to single column on mobile
- Add checkout loading spinner with descriptive text
- Add blog, academy, consulting pages
- Add globals.css responsive CSS helper classes

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"

# Push
git push origin main

echo ""
echo "✅ Done! Vercel will auto-deploy in ~2 minutes."
echo ""
echo "Fixes deployed:"
echo "  • Mobile layout responsive (product page, checkout)"
echo "  • Logo doubled in size everywhere"
echo "  • Nav properly centered with maxWidth container"
echo "  • Checkout shows real error + retry button"
echo "  • Legal pages have full footer navigation"
