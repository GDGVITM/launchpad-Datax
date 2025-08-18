#!/bin/bash

# Full Stack Setup Script for Cybersecurity SaaS Platform
echo "🚀 Setting up Cybersecurity SaaS Platform..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 16 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 16 ]; then
    print_error "Node.js version 16 or higher is required. Current version: $(node --version)"
    exit 1
fi

print_success "Node.js version check passed: $(node --version)"

# Check if MongoDB is running (optional check)
print_status "Checking MongoDB connection..."
if command -v mongosh &> /dev/null; then
    print_success "MongoDB client found"
else
    print_warning "MongoDB client not found locally. Make sure your MongoDB URI in .env is correct."
fi

# Backend setup
print_status "Setting up backend..."
cd backend || {
    print_error "Backend directory not found!"
    exit 1
}

# Install backend dependencies
print_status "Installing backend dependencies..."
npm install
if [ $? -eq 0 ]; then
    print_success "Backend dependencies installed successfully"
else
    print_error "Failed to install backend dependencies"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_warning ".env file not found in backend directory"
    if [ -f ".env.example" ]; then
        print_status "Copying .env.example to .env..."
        cp .env.example .env
        print_warning "Please configure your .env file with proper values"
    else
        print_error "No .env.example file found"
    fi
else
    print_success "Backend .env file found"
fi

# Test backend database connection
print_status "Testing backend connection..."
timeout 10s npm run test:connection 2>/dev/null || {
    print_warning "Backend connection test failed or timed out"
}

# Go back to root directory
cd ..

# Frontend setup
print_status "Setting up frontend..."

# Install frontend dependencies
print_status "Installing frontend dependencies..."
npm install
if [ $? -eq 0 ]; then
    print_success "Frontend dependencies installed successfully"
else
    print_error "Failed to install frontend dependencies"
    exit 1
fi

# Check if .env.local file exists
if [ ! -f ".env.local" ]; then
    print_warning ".env.local file not found in frontend directory"
    print_status "Creating default .env.local file..."
    cat > .env.local << EOF
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
EOF
    print_success "Default .env.local file created"
else
    print_success "Frontend .env.local file found"
fi

# Create startup scripts
print_status "Creating startup scripts..."

# Backend start script
cat > backend/start.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Cybersecurity SaaS Backend..."
echo "📊 Environment: $(grep NODE_ENV .env | cut -d '=' -f2)"
echo "🔌 Port: $(grep PORT .env | cut -d '=' -f2)"
echo "🗄️  Database: $(grep MONGODB_URI .env | cut -d '=' -f2 | cut -d '@' -f2 | cut -d '/' -f1)"
echo ""
npm run dev
EOF

chmod +x backend/start.sh

# Frontend start script
cat > start-frontend.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Cybersecurity SaaS Frontend..."
echo "🌐 URL: http://localhost:3000"
echo "🔗 API: $(grep NEXT_PUBLIC_API_URL .env.local | cut -d '=' -f2)"
echo ""
npm run dev
EOF

chmod +x start-frontend.sh

# Full stack start script
cat > start-fullstack.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Full Stack Cybersecurity SaaS Platform..."

# Function to cleanup background processes
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    kill $(jobs -p) 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start backend
echo "🔧 Starting backend server..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "🎨 Starting frontend server..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Full stack is starting up..."
echo "📊 Backend: http://localhost:5000"
echo "🎨 Frontend: http://localhost:3000"
echo "📋 API Docs: http://localhost:5000/api/health"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for background processes
wait
EOF

chmod +x start-fullstack.sh

# Development scripts
cat > package.json.scripts << 'EOF'
{
  "scripts": {
    "dev:backend": "cd backend && npm run dev",
    "dev:frontend": "npm run dev",
    "dev:fullstack": "./start-fullstack.sh",
    "build": "npm run build && cd backend && npm run build",
    "start:prod": "npm start && cd backend && npm start",
    "install:all": "npm install && cd backend && npm install",
    "test:all": "npm test && cd backend && npm test"
  }
}
EOF

print_success "Startup scripts created"

# Summary
echo ""
print_success "🎉 Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "  1. Configure your backend/.env file with proper database credentials"
echo "  2. Start the backend: cd backend && npm run dev"
echo "  3. In another terminal, start the frontend: npm run dev"
echo "  4. Or use the full stack script: ./start-fullstack.sh"
echo ""
echo "📊 Endpoints:"
echo "  • Frontend: http://localhost:3000"
echo "  • Backend API: http://localhost:5000/api"
echo "  • Health Check: http://localhost:5000/api/health"
echo "  • System Status: http://localhost:5000/api/status"
echo ""
echo "🔧 Optional: Seed the database with sample data:"
echo "  cd backend && npm run seed"
echo ""
print_success "Happy coding! 🚀"
