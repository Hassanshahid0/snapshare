# SnapShare - Social Media Application

A full-stack Instagram-like social media application built with the MERN stack.

![SnapShare](https://img.shields.io/badge/SnapShare-Social%20Media-red)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-green)
![Express](https://img.shields.io/badge/Express-Backend-black)
![React](https://img.shields.io/badge/React-Frontend-blue)
![Node.js](https://img.shields.io/badge/Node.js-Runtime-green)

---

## 🚀 Tech Stack

### Frontend
- **React.js** - UI Library
- **React Router DOM** - Client-side routing
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **Font Awesome** - Icons

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL Database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing

---

## ✨ Features

### 👤 User Roles

| Role | Capabilities |
|------|-------------|
| **Creator** | Create posts, upload photos, like, comment, share, follow, message, add stories |
| **Consumer** | Like, comment, share, follow, message (cannot create posts) |
| **Admin** | Dashboard with stats, user management, activity logs |

### 📱 Core Features

- **Authentication**
  - Sign up with role selection (Creator/Consumer)
  - Login with email/password
  - Press Enter to login
  - JWT token-based authentication
  - Persistent sessions

- **Posts**
  - Upload photos (base64 storage)
  - Add captions with emoji support
  - Like posts (button or double-tap)
  - Comment on posts
  - Share posts to followers via DM
  - Save/bookmark posts
  - View saved posts in profile

- **Stories**
  - Add stories (24-hour expiry)
  - View stories on feed
  - Story ring indicator on profile

- **Social**
  - Follow/Unfollow users
  - View followers list
  - View following list
  - Search users
  - Suggested creators

- **Messaging**
  - Direct messages
  - Real-time unread count
  - Red notification badge
  - Read receipts (✓ sent, ✓✓ read)
  - Bold text for unread messages
  - Direct message from profile

- **Profile**
  - Edit bio and avatar
  - View own posts grid
  - View saved posts tab
  - Add stories
  - Followers/Following modals

- **Theme**
  - Light/Dark mode toggle
  - Persists in localStorage
  - Auto-detects system preference

- **Admin Dashboard**
  - Total users, posts, messages stats
  - User management table
  - Activity log (signups, logins, likes, comments, follows)
  - Recent posts overview

---

## 📁 Project Structure

```
snapshare/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js     # Auth logic
│   │   ├── userController.js     # User operations
│   │   ├── postController.js     # Post CRUD + save
│   │   ├── messageController.js  # Messaging
│   │   ├── storyController.js    # Stories
│   │   └── adminController.js    # Admin dashboard
│   ├── middleware/
│   │   └── auth.js               # JWT verification
│   ├── models/
│   │   ├── User.js
│   │   ├── Post.js
│   │   ├── Message.js
│   │   ├── Story.js
│   │   └── Activity.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── postRoutes.js
│   │   ├── messageRoutes.js
│   │   ├── storyRoutes.js
│   │   └── adminRoutes.js
│   ├── scripts/
│   │   └── seed.js               # Create admin user
│   ├── .env
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js          # API configuration
│   │   ├── context/
│   │   │   ├── AuthContext.jsx   # Auth state
│   │   │   └── ThemeContext.jsx  # Theme state
│   │   ├── components/
│   │   │   ├── Layout.jsx        # Main layout
│   │   │   ├── PostCard.jsx      # Post component
│   │   │   ├── PostModal.jsx     # Post detail modal
│   │   │   ├── ShareModal.jsx    # Share post modal
│   │   │   ├── FollowersModal.jsx
│   │   │   ├── FollowingModal.jsx
│   │   │   ├── LoadingScreen.jsx
│   │   │   ├── ThemeToggle.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── pages/
│   │   │   ├── AuthPage.jsx      # Login/Signup
│   │   │   ├── FeedPage.jsx      # Home feed
│   │   │   ├── CreatePostPage.jsx
│   │   │   ├── MessagesPage.jsx
│   │   │   ├── ProfilePage.jsx
│   │   │   └── AdminDashboard.jsx
│   │   ├── App.jsx               # Routes only
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
│
└── README.md
```

---

## 🛠️ Installation & Setup

### Prerequisites

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (local or Atlas) - [Download](https://www.mongodb.com/try/download/community)
- **npm** or **yarn**

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd snapshare
```

### Step 2: Setup MongoDB

**Option A: Local MongoDB**
```bash
# Mac
brew services start mongodb-community

# Windows
net start MongoDB

# Linux
sudo systemctl start mongod
```

**Option B: MongoDB Atlas (Cloud)**
1. Create account at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create free cluster
3. Get connection string
4. Update `backend/.env` with your connection string

### Step 3: Setup Backend

```bash
cd backend
npm install
```

Create `.env` file (if not exists):
```env
PORT=8000
MONGODB_URI=mongodb://localhost:27017/snapshare
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
```

Create admin user:
```bash
node scripts/seed.js
```

Start backend:
```bash
npm run dev
```

You should see:
```
✅ MongoDB Connected: localhost
🚀 Server running on port 8000
```

### Step 4: Setup Frontend

Open a new terminal:
```bash
cd frontend
npm install
npm run dev
```

You should see:
```
VITE v5.0.0  ready in 500 ms

➜  Local:   http://localhost:3000/
```

### Step 5: Open the App

Visit: **http://localhost:3000**

---

## 🔑 Default Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@snapshare.com | admin123 |

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/logout` | Logout user |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/search?q=` | Search users |
| GET | `/api/users/suggested` | Get suggested creators |
| GET | `/api/users/:id` | Get user profile |
| PUT | `/api/users/profile` | Update profile |
| POST | `/api/users/:id/follow` | Follow/Unfollow user |
| GET | `/api/users/:id/followers` | Get followers |
| GET | `/api/users/:id/following` | Get following |

### Posts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/posts` | Get all posts |
| GET | `/api/posts/user/:userId` | Get user's posts |
| GET | `/api/posts/saved` | Get saved posts |
| POST | `/api/posts` | Create post |
| DELETE | `/api/posts/:id` | Delete post |
| POST | `/api/posts/:id/like` | Like/Unlike post |
| POST | `/api/posts/:id/comment` | Add comment |
| POST | `/api/posts/:id/share` | Share post |
| POST | `/api/posts/:id/save` | Save/Unsave post |

### Stories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stories` | Get all stories |
| GET | `/api/stories/user/:userId` | Get user's stories |
| POST | `/api/stories` | Create story |
| POST | `/api/stories/:id/view` | Mark story viewed |
| DELETE | `/api/stories/:id` | Delete story |

### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/messages/conversations` | Get all conversations |
| GET | `/api/messages/unread-count` | Get unread count |
| GET | `/api/messages/:userId` | Get messages with user |
| POST | `/api/messages/:userId` | Send message |
| PUT | `/api/messages/read/:userId` | Mark as read |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Get dashboard stats |
| GET | `/api/admin/users` | Get all users |
| GET | `/api/admin/posts` | Get all posts |
| GET | `/api/admin/activities` | Get activity log |
| DELETE | `/api/admin/users/:id` | Delete user |
| DELETE | `/api/admin/posts/:id` | Delete post |

---

## 🎨 Color Scheme

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Primary | Red (#ef4444) | Red (#dc2626) |
| Background | White (#ffffff) | Black (#09090b) |
| Text | Black (#18181b) | White (#fafafa) |
| Accent | Zinc (#71717a) | Zinc (#a1a1aa) |

---

## 📱 Responsive Design

- **Desktop**: Full sidebar with suggested creators
- **Mobile**: Bottom navigation bar only
- **Tablet**: Adaptive layout

---

## 🔒 Security Features

- JWT token authentication
- Password hashing with bcrypt
- Protected routes
- Role-based access control
- Token expiration (7 days)

---

## 🐛 Troubleshooting

### MongoDB Connection Failed
```bash
# Check if MongoDB is running
brew services list  # Mac
sudo systemctl status mongod  # Linux
```

### Port Already in Use
```bash
# Kill process on port 8000
lsof -i :8000
kill -9 <PID>
```

### Module Not Found
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

---

## 📄 License

MIT License - feel free to use this project for learning or personal use.

---

## 🙏 Acknowledgments

- Design inspired by Instagram
- Icons by Font Awesome
- Styling with Tailwind CSS

---

**Made with ❤️ using MERN Stack**
