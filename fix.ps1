$f = Get-Content 'app\api\ads-agent\route.ts' -Raw
$f = $f -replace 'c\.roas_3d \|\| ', ''
$f = $f -replace '\.catch\(console\.error\);', ';'
Set-Content 'app\api\ads-agent\route.ts' $f
