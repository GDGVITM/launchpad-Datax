# Full Stack Setup Script for Cybersecurity SaaS Platform
Write-Host "🚀 Setting up Cybersecurity SaaS Platform..." -ForegroundColor Cyan

function Write-Status {
    param($Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param($Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param($Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param($Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Success "Node.js version check passed: $nodeVersion"
} catch {
    Write-Error "Node.js is not installed. Please install Node.js 16 or higher."
    exit 1
}

# Backend setup
Write-Status "Setting up backend..."
if (Test-Path "backend") {
    Set-Location backend
} else {
    Write-Error "Backend directory not found!"
    exit 1
}

# Install backend dependencies
Write-Status "Installing backend dependencies..."
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Success "Backend dependencies installed successfully"
} else {
    Write-Error "Failed to install backend dependencies"
    exit 1
}

# Check if .env file exists
if (!(Test-Path ".env")) {
    Write-Warning ".env file not found in backend directory"
    if (Test-Path ".env.example") {
        Write-Status "Copying .env.example to .env..."
        Copy-Item ".env.example" ".env"
        Write-Warning "Please configure your .env file with proper values"
    } else {
        Write-Error "No .env.example file found"
    }
} else {
    Write-Success "Backend .env file found"
}

# Go back to root directory
Set-Location ..

# Frontend setup
Write-Status "Setting up frontend..."

# Install frontend dependencies
Write-Status "Installing frontend dependencies..."
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Success "Frontend dependencies installed successfully"
} else {
    Write-Error "Failed to install frontend dependencies"
    exit 1
}

# Check if .env.local file exists
if (!(Test-Path ".env.local")) {
    Write-Warning ".env.local file not found in frontend directory"
    Write-Status "Creating default .env.local file..."
    
    $envContent = @"
# Frontend Environment Variables
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_WS_URL=http://localhost:5000
NEXT_PUBLIC_APP_NAME=Cybersecurity SaaS Platform
NEXT_PUBLIC_APP_VERSION=1.0.0

# Blockchain Configuration (Public)
NEXT_PUBLIC_BLOCKCHAIN_NETWORK=polygon-mumbai
NEXT_PUBLIC_CHAINSHIELD_CONTRACT_ADDRESS=0x01B0CB02107Cd66Df4DB390Dce2EeD391D3B57F3

# Feature Flags
NEXT_PUBLIC_ENABLE_BLOCKCHAIN=true
NEXT_PUBLIC_ENABLE_WALLET_CONNECT=true
NEXT_PUBLIC_ENABLE_REAL_TIME=true
"@
    
    $envContent | Out-File -FilePath ".env.local" -Encoding UTF8
    Write-Success "Default .env.local file created"
} else {
    Write-Success "Frontend .env.local file found"
}

# Create startup scripts
Write-Status "Creating startup scripts..."

# Backend start script
$backendScript = @"
@echo off
echo 🚀 Starting Cybersecurity SaaS Backend...
cd backend
npm run dev
"@

$backendScript | Out-File -FilePath "start-backend.bat" -Encoding ASCII

# Frontend start script  
$frontendScript = @"
@echo off
echo 🚀 Starting Cybersecurity SaaS Frontend...
echo 🌐 URL: http://localhost:3000
npm run dev
"@

$frontendScript | Out-File -FilePath "start-frontend.bat" -Encoding ASCII

# PowerShell full stack script
$fullStackScript = @"
# Full Stack Startup Script
Write-Host "🚀 Starting Full Stack Cybersecurity SaaS Platform..." -ForegroundColor Cyan

# Start backend in new window
Write-Host "🔧 Starting backend server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev"

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start frontend in new window
Write-Host "🎨 Starting frontend server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"

Write-Host ""
Write-Host "✅ Full stack is starting up..." -ForegroundColor Green
Write-Host "📊 Backend: http://localhost:5000" -ForegroundColor Blue
Write-Host "🎨 Frontend: http://localhost:3000" -ForegroundColor Blue
Write-Host "📋 API Docs: http://localhost:5000/api/health" -ForegroundColor Blue
Write-Host ""
Write-Host "Close the PowerShell windows to stop the services" -ForegroundColor Yellow
"@

$fullStackScript | Out-File -FilePath "start-fullstack.ps1" -Encoding UTF8

Write-Success "Startup scripts created"

# Summary
Write-Host ""
Write-Success "🎉 Setup completed successfully!"
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "  1. Configure your backend\.env file with proper database credentials"
Write-Host "  2. Run .\start-backend.bat to start the backend"
Write-Host "  3. Run .\start-frontend.bat to start the frontend"
Write-Host "  4. Or run .\start-fullstack.ps1 to start both"
Write-Host ""
Write-Host "📊 Endpoints:" -ForegroundColor Cyan
Write-Host "  • Frontend: http://localhost:3000"
Write-Host "  • Backend API: http://localhost:5000/api"
Write-Host "  • Health Check: http://localhost:5000/api/health"
Write-Host "  • System Status: http://localhost:5000/api/status"
Write-Host ""
Write-Host "🔧 Optional: Seed the database with sample data:" -ForegroundColor Cyan
Write-Host "  cd backend && npm run seed"
Write-Host ""
Write-Success "Happy coding! 🚀"
