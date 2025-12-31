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

# Install Backend dependencies
echo "Installing Backend dependencies..."
cd backend
npm install

# Start Backend on port 5000
echo "Starting Backend with PM2..."
NODE_ENV=production pm2 start server.js --name snapshare-backend

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
