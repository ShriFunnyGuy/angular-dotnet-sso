# Backend Quick Start Script

Write-Host "🚀 Setting up Google SSO Backend..." -ForegroundColor Green
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "backend\package.json")) {
    Write-Host "❌ Error: Run this script from the project root directory" -ForegroundColor Red
    exit 1
}

# Navigate to backend
Set-Location backend

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Dependencies already installed" -ForegroundColor Green
}

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "📝 Creating .env file from template..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: Edit backend\.env file with your Google credentials" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Required values:" -ForegroundColor Cyan
    Write-Host "  GOOGLE_CLIENT_ID=your-client-id" -ForegroundColor White
    Write-Host "  GOOGLE_CLIENT_SECRET=your-client-secret" -ForegroundColor White
    Write-Host ""
    
    $response = Read-Host "Do you want to edit .env now? (y/n)"
    if ($response -eq "y") {
        notepad .env
    }
} else {
    Write-Host "✅ .env file exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎯 Next steps:" -ForegroundColor Cyan
Write-Host "  1. Ensure your .env file has correct Google credentials" -ForegroundColor White
Write-Host "  2. Add http://localhost:3000/auth/callback to Google Console Authorized redirect URIs" -ForegroundColor White
Write-Host "  3. Run: cd backend && npm run dev" -ForegroundColor White
Write-Host "  4. In another terminal run: npm start (from project root)" -ForegroundColor White
Write-Host ""
Write-Host "📚 See BACKEND_SETUP.md for detailed instructions" -ForegroundColor Yellow

Set-Location ..
