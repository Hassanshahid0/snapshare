#!/bin/bash

# Update system and install Node.js if not present
if ! command -v node &> /dev/null; then
    echo "Installing Node.js 22..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install PM2 globally if not present
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    sudo npm install -g pm2
fi

# Install Backend dependencies
echo "Installing Backend dependencies..."
cd backend
npm install

# Install Frontend dependencies and Build
echo "Installing Frontend dependencies and Building..."
cd ../frontend
npm install
npm run build

# Go back to root
cd ..

# Start the application with PM2
echo "Starting application with PM2..."
cd backend
NODE_ENV=production pm2 start server.js --name snapshare

echo "Deployment complete! Application is running on http://4.251.118.253:5000"
echo "Check logs with: pm2 logs snapshare"
