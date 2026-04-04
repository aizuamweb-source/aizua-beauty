@echo off
REM AizuaBeauty — Push Ringana catalog update
REM Run this from: C:\Users\aizua\AizuaLabs\aizua-beauty\

cd /d C:\Users\aizua\AizuaLabs\aizua-beauty

git add "app/[locale]/ringana/page.tsx"
git add "app/[locale]/page.tsx"
git commit -m "feat: add Ringana catalog page with 20 products + fix internal nav links"
git push origin main

echo.
echo Done! Vercel will auto-deploy in ~2 minutes.
echo Check: https://aizuabeauty.vercel.app/es/ringana
pause
