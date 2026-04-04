@echo off
REM AizuaBeauty — Push SEO + Ringana compliance update
REM Run from: C:\Users\aizua\AizuaLabs\aizua-beauty\

cd /d C:\Users\aizua\AizuaLabs\aizua-beauty

git add "app/[locale]/ringana/page.tsx"
git add "app/[locale]/page.tsx"
git add "app/[locale]/tienda/page.tsx"
git add "app/sitemap.ts"
git add "app/robots.ts"
git add "PUSH_RINGANA_UPDATE.bat"
git add "PUSH_BEAUTY_SEO.bat"

git commit -m "seo: metadata all pages + sitemap + robots + ringana compliance (disclosure, neutral descriptions, JSON-LD)"
git push origin main

echo.
echo Done! Vercel auto-deploys in ~2 min.
echo Verificar:
echo   https://aizuabeauty.vercel.app/es/ringana
echo   https://aizuabeauty.vercel.app/sitemap.xml
echo   https://aizuabeauty.vercel.app/robots.txt
pause
