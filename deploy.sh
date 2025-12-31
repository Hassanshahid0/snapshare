#!/bin/bash

# Update system and install Node.js if not present
if ! command -v node &> /dev/null; then
    echo "Installing Node.js 22..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install PM2 and serve globally if not present
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    sudo npm install -g pm2
fi

if ! command -v serve &> /dev/null; then
    echo "Installing serve..."
    sudo npm install -g serve
fi

# Stop existing processes to avoid port conflicts
pm2 delete snapshare-backend 2>/dev/null
pm2 delete snapshare-frontend 2>/dev/null

# Start Backend on port 5000
echo "Starting Backend with PM2..."
cd backend
npm install
NODE_ENV=production pm2 start server.js --name snapshare-backend

# Wait for backend to start and check health
echo "Waiting for backend to start..."
sleep 5
if curl -s http://localhost:5000/api/health | grep -q "ok"; then
    echo "✅ Backend is healthy!"
else
    echo "❌ Backend health check failed! Checking logs..."
    pm2 logs snapshare-backend --lines 20 --no-daemon &
    sleep 5
    kill $!
fi

# Install Frontend dependencies and Build
echo "Installing Frontend dependencies and Building..."
cd ../frontend
npm install
npm run build

# Start Frontend on port 5173 using 'serve'
echo "Starting Frontend on port 5173 with PM2..."
pm2 start serve --name snapshare-frontend -- -s dist -l 5173

echo "Deployment complete!"
echo "Frontend: http://4.251.118.253:5173"
echo "Backend:  http://4.251.118.253:5000"
echo "Check status with: pm2 list"
