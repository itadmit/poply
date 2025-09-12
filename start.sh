#!/bin/bash

echo "🚀 Starting Poply Marketing Automation Platform..."

# Kill existing processes
echo "🛑 Stopping existing processes..."
pkill -f "poply" 2>/dev/null || true
pkill -f "nodemon" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Creating from template..."
    cp env.example .env
    echo "✅ .env file created. Please update with your database credentials."
fi

# Check if database exists
if ! psql -lqt | cut -d \| -f 1 | grep -qw poply; then
    echo "📊 Creating database..."
    createdb poply
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Push database schema
echo "📊 Syncing database schema..."
npx prisma db push

# Start server
echo "🖥️  Starting server on port 3001..."
PORT=3001 node server/index.js &
SERVER_PID=$!

# Wait for server to start
sleep 3

# Start client
echo "🎨 Starting client on port 5173..."
cd client
npm run dev &
CLIENT_PID=$!

# Function to cleanup on exit
cleanup() {
    echo "🛑 Stopping services..."
    kill $SERVER_PID 2>/dev/null || true
    kill $CLIENT_PID 2>/dev/null || true
    exit 0
}

# Set trap for cleanup
trap cleanup SIGINT SIGTERM

echo "✅ Poply is running successfully!"
echo "   🌐 Server: http://localhost:3001"
echo "   🎨 Client: http://localhost:5173"
echo "   📊 API Health: http://localhost:3001/api/health"
echo "   Press Ctrl+C to stop"

# Wait for processes
wait