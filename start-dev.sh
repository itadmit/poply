#!/bin/bash

echo "🚀 Starting Poply Development Environment..."

# Kill existing processes
echo "🛑 Stopping existing processes..."
pkill -f "poply" 2>/dev/null || true
pkill -f "nodemon" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

# Start server
echo "🖥️  Starting server on port 3001..."
cd /Users/tadmitinteractive/poply
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

echo "✅ Services started successfully!"
echo "   🌐 Server: http://localhost:3001"
echo "   🎨 Client: http://localhost:5173"
echo "   📊 API Health: http://localhost:3001/api/health"
echo "   Press Ctrl+C to stop"

# Wait for processes
wait
