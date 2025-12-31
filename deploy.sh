#!/bin/bash

# ==========================================
# SNAPSHARE PRODUCTION DEPLOYMENT SCRIPT
# Target: 4.251.118.253
# ==========================================

set -e

echo "🚀 Starting Deployment to 4.251.118.253..."

# 1. Update and Install Node.js 22
echo "📦 Installing Node.js 22..."
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Install PM2 and Serve
echo "🛠️ Installing PM2 and serve..."
sudo npm install -g pm2 serve

# 3. Setup Backend
echo "📡 Setting up Backend..."
cd backend
npm install
# Ensure .env is set for production
cat > .env << EOL
PORT=5000
MONGO_URI=mongodb+srv://wavely_db:wavely.123@cluster0.hw2nqud.mongodb.net/?appName=Cluster0
JWT_SECRET=supersecretjwtkey
CLIENT_ORIGIN=http://4.251.118.253:5173
EOL

# 4. Setup Frontend
echo "💻 Setting up Frontend..."
cd ../frontend
npm install
# Ensure .env is set for production
cat > .env << EOL
VITE_API_BASE=http://4.251.118.253:5000
EOL

echo "🏗️ Building Frontend..."
npm run build

# 5. Process Management with PM2
echo "🔄 Starting processes with PM2..."
pm2 stop all || true
pm2 delete all || true

# Start Backend
cd ../backend
NODE_ENV=production pm2 start server.js --name snapshare-backend

# Start Frontend on port 5173
cd ../frontend
pm2 start serve --name snapshare-frontend -- -s dist -l 5173

pm2 save
echo "✅ Deployment Complete!"
echo "Backend: http://4.251.118.253:5000"
echo "Frontend: http://4.251.118.253:5173"
