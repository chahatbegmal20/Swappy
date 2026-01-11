# Atelier Setup Script
# Run this script to quickly configure your environment

Write-Host "🎨 Atelier Platform Setup" -ForegroundColor Cyan
Write-Host "========================`n" -ForegroundColor Cyan

# Check if .env.local exists
if (-not (Test-Path ".env.local")) {
    Write-Host "❌ .env.local not found! Copying from example..." -ForegroundColor Red
    Copy-Item "env.example.txt" ".env.local"
    Write-Host "✅ Created .env.local`n" -ForegroundColor Green
}

# Generate NextAuth secret
$secret = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

Write-Host "🔐 Generated NextAuth Secret:" -ForegroundColor Yellow
Write-Host "$secret`n" -ForegroundColor White

# Read current .env.local
$envContent = Get-Content ".env.local" -Raw

# Update NEXTAUTH_SECRET
$envContent = $envContent -replace 'NEXTAUTH_SECRET="your-secret-key-generate-with-openssl-rand-base64-32"', "NEXTAUTH_SECRET=`"$secret`""

# Save updated .env.local
$envContent | Set-Content ".env.local"

Write-Host "✅ Updated NEXTAUTH_SECRET in .env.local`n" -ForegroundColor Green

# Check for database
Write-Host "📊 Database Setup" -ForegroundColor Cyan
Write-Host "==================`n"

$setupDb = Read-Host "Do you want to set up a database now? (Y/N)"

if ($setupDb -eq "Y" -or $setupDb -eq "y") {
    Write-Host "`n📌 Choose your database option:" -ForegroundColor Yellow
    Write-Host "1. Supabase (Recommended - Free & Easy)"
    Write-Host "2. Local PostgreSQL (Must have PostgreSQL installed)"
    Write-Host "3. Skip for now (Landing page only)`n"
    
    $choice = Read-Host "Enter choice (1/2/3)"
    
    if ($choice -eq "1") {
        Write-Host "`n🌐 Supabase Setup:" -ForegroundColor Cyan
        Write-Host "1. Go to https://supabase.com"
        Write-Host "2. Sign up and create a new project"
        Write-Host "3. Go to Settings → Database → Connection String → URI"
        Write-Host "4. Copy the connection string"
        Write-Host ""
        
        $dbUrl = Read-Host "Paste your Supabase connection string here"
        
        if ($dbUrl) {
            $envContent = Get-Content ".env.local" -Raw
            $envContent = $envContent -replace 'DATABASE_URL="[^"]*"', "DATABASE_URL=`"$dbUrl`""
            $envContent | Set-Content ".env.local"
            Write-Host "✅ Database URL updated!`n" -ForegroundColor Green
            
            Write-Host "🔄 Initializing database..." -ForegroundColor Yellow
            npm run db:push
            Write-Host "`n🌱 Seeding database..." -ForegroundColor Yellow
            npm run db:seed
            
            Write-Host "`n✅ Database ready! Admin login:" -ForegroundColor Green
            Write-Host "   Email: admin@atelier.com" -ForegroundColor White
            Write-Host "   Password: password123" -ForegroundColor White
        }
    }
    elseif ($choice -eq "2") {
        Write-Host "`n💻 Local PostgreSQL:" -ForegroundColor Cyan
        $dbName = Read-Host "Database name (default: atelier)"
        if (-not $dbName) { $dbName = "atelier" }
        
        $dbUser = Read-Host "Database user (default: postgres)"
        if (-not $dbUser) { $dbUser = "postgres" }
        
        $dbPass = Read-Host "Database password" -AsSecureString
        $dbPassPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPass))
        
        $dbUrl = "postgresql://${dbUser}:${dbPassPlain}@localhost:5432/${dbName}"
        
        $envContent = Get-Content ".env.local" -Raw
        $envContent = $envContent -replace 'DATABASE_URL="[^"]*"', "DATABASE_URL=`"$dbUrl`""
        $envContent | Set-Content ".env.local"
        
        Write-Host "✅ Database URL updated!`n" -ForegroundColor Green
        
        Write-Host "🔄 Initializing database..." -ForegroundColor Yellow
        npm run db:push
        Write-Host "`n🌱 Seeding database..." -ForegroundColor Yellow
        npm run db:seed
        
        Write-Host "`n✅ Database ready!" -ForegroundColor Green
    }
    else {
        Write-Host "`n⚠️  Skipping database setup" -ForegroundColor Yellow
        Write-Host "You can view the landing page, but signup/login won't work`n" -ForegroundColor Yellow
    }
}

Write-Host "`n🎉 Setup Complete!" -ForegroundColor Green
Write-Host "==================`n" -ForegroundColor Green

Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Run: npm run dev"
Write-Host "2. Open: http://localhost:3000"
Write-Host "3. Check: START_HERE.md for more info`n"

$runNow = Read-Host "Start development server now? (Y/N)"

if ($runNow -eq "Y" -or $runNow -eq "y") {
    Write-Host "`n🚀 Starting server...`n" -ForegroundColor Green
    npm run dev
}
else {
    Write-Host "`n✅ When ready, run: npm run dev" -ForegroundColor Green
}

