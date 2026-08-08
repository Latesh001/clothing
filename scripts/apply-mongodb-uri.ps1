# Usage:
#   .\scripts\apply-mongodb-uri.ps1 "mongodb+srv://user:pass@cluster.mongodb.net/manikanta_khadi?retryWrites=true&w=majority"
# Sets MONGODB_URI on the Vercel API project and redeploys + seeds.

param(
  [Parameter(Mandatory = $true)]
  [string]$MongoUri
)

$ErrorActionPreference = 'Stop'
$env:NODE_TLS_REJECT_UNAUTHORIZED = '0'

Write-Host "Setting MONGODB_URI on Vercel (manikanta-khadi-api)..."
Set-Location "$PSScriptRoot\..\backend"
foreach ($envName in @('production', 'preview', 'development')) {
  $MongoUri | npx vercel env add MONGODB_URI $envName --force --yes
}

Write-Host "Redeploying API..."
npx vercel deploy --yes --prod

Write-Host "Seeding database (local script against Atlas URI)..."
$env:MONGODB_URI = $MongoUri
$env:NODE_ENV = 'production'
node .\scripts\seedDatabase.js

Write-Host "Done. Health check:"
try {
  Invoke-RestMethod "https://manikanta-khadi-api.vercel.app/api/health" | ConvertTo-Json
} catch {
  Write-Warning $_.Exception.Message
}
