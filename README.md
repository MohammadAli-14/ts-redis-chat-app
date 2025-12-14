MERN Real-Time Chat Application 🚀
<div align="center">
https://img.shields.io/badge/Status-Active-success
https://img.shields.io/badge/Version-2.0-blue
https://img.shields.io/badge/License-MIT-green
https://img.shields.io/badge/MongoDB-4.4-green
https://img.shields.io/badge/Express-4.18-blue
https://img.shields.io/badge/React-18-red
https://img.shields.io/badge/Node.js-20-green

A full-featured, production-ready real-time chat application built with the MERN stack featuring Socket.io for real-time communication, Redis for advanced caching, and Arcjet for enterprise-grade security.

Live Demo

</div>
✨ Features
🤖 Real-Time Messaging
✅ Instant one-to-one and group messaging

✅ Socket.io-based real-time bidirectional communication

✅ Message reactions (👍, ❤️, 😂, etc.)

✅ Read receipts and typing indicators

✅ Message editing and deletion

👥 Group Management
✅ Create public/private groups with custom avatars

✅ Add/remove members dynamically

✅ Group admin controls and permissions

✅ Separate models for group and private messages

🔐 Authentication & Security
✅ JWT-based authentication with refresh tokens

✅ Email verification with OTP system

✅ Password reset functionality

✅ Arcjet for rate limiting and security protection

✅ Session management with Redis

🎨 User Experience
✅ Gaming-themed responsive design for mobile & desktop

✅ Keyboard sound effects and audio feedback

✅ Animated UI components with Tailwind CSS

✅ Virtualized message lists for optimal performance

✅ Real-time connection status monitoring

⚡ Performance & Optimization
✅ Redis caching for frequent queries with advanced strategies

✅ Message pagination and lazy loading

✅ Socket.io connection optimization

✅ Optimized database queries with MongoDB indexing

✅ Advanced state management with Zustand

📊 Monitoring & Reliability
✅ Comprehensive health check endpoints

✅ Performance monitoring utilities

✅ Automated cleanup of unverified accounts (cron job)

✅ Multi-provider email notification system

✅ Socket connection debugging tools

🏗️ Architecture Overview
This application follows a modern, layered architecture designed for scalability and performance:

Frontend: React 18 with Vite, Zustand for state management, Socket.io client for real-time communication

Backend: Express.js with Socket.io server, MongoDB for data persistence

Communication: Real-time bidirectional communication via Socket.io (WebSocket protocol with fallbacks)

Storage: MongoDB for primary data, Redis for sessions and cache, Cloudinary for media files

Security: Arcjet middleware for API protection and rate limiting

📁 Project Structure
text
ts-redis-chat-app/
├── backend/                 # Express.js backend server
│   ├── src/
│   │   ├── automation/     # Automated tasks (cron jobs)
│   │   │   └── removeUnverifiedAccounts.js
│   │   ├── controllers/    # Route controllers
│   │   ├── emails/         # Email service implementations
│   │   ├── lib/           # Utilities and service configurations
│   │   │   ├── advancedCache.js # Advanced Redis caching strategies
│   │   │   ├── arcjet.js        # Arcjet security configuration
│   │   │   ├── cache.js         # Base Redis cache wrapper
│   │   │   ├── socket.js        # Socket.io server setup
│   │   │   └── ...
│   │   ├── middleware/    # Express middleware
│   │   │   ├── arcjet.middleware.js # Arcjet protection
│   │   │   ├── auth.middleware.js   # JWT verification
│   │   │   └── socket.auth.middleware.js # Socket.io connection auth
│   │   ├── models/        # MongoDB schemas
│   │   ├── routes/        # API route definitions
│   │   └── server.js      # Main server entry point
│   ├── package.json
│   └── .env
│
├── frontend/              # React frontend application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── pages/         # Page components
│   │   ├── store/         # Zustand state management
│   │   ├── utils/         # Utility functions
│   │   ├── lib/           # External library configs
│   │   │   └── axios.js   # HTTP client configuration
│   │   ├── App.jsx        # Main App component
│   │   └── main.jsx       # React entry point
│   ├── public/            # Static assets (images, sounds)
│   ├── package.json
│   ├── tailwind.config.js
│   └── .env
│
└── package.json           # Root package.json
🚀 Quick Start
Prerequisites
Node.js (v18 or higher)

MongoDB (v6 or higher) - Installation Guide

Redis (v7 or higher) - Installation Guide

npm or yarn

Installation
Clone the repository

bash
git clone https://github.com/MohammadAli-14/ts-redis-chat-app.git
cd ts-redis-chat-app
Setup Backend

bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration (see below)
Setup Frontend

bash
cd ../frontend
npm install
cp .env.example .env
# Edit .env with your configuration (see below)
Start Development Servers

Terminal 1 - Start Redis & MongoDB (if not running):

bash
# Start MongoDB (method depends on your OS)
sudo systemctl start mongod  # Linux
# or
mongod --dbpath /path/to/data

# Start Redis
redis-server
Terminal 2 - Backend:

bash
cd backend
npm run dev
Terminal 3 - Frontend:

bash
cd frontend
npm run dev
Access the application:

Frontend: http://localhost:5173

Backend API: http://localhost:5000

API Health: http://localhost:5000/api/health

🔧 Configuration
Environment Variables
Backend (.env)

env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/chat-app
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your_super_secret_jwt_key_here_change_this
ARCJET_KEY=your_arcjet_api_key_optional_for_rate_limiting

# Email Service (choose one)
EMAIL_SERVICE=sendgrid  # Options: sendgrid, resend, nodemailer
SENDGRID_API_KEY=your_sendgrid_key
RESEND_API_KEY=your_resend_key

# Cloudinary for File Uploads (Optional)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
Frontend (.env)

env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
VITE_ENVIRONMENT=development
📡 Core API & Socket Events
Authentication Endpoints
Method	Endpoint	Description
POST	/api/auth/register	Register new user
POST	/api/auth/login	User login
POST	/api/auth/verify-otp	Verify email OTP
POST	/api/auth/logout	User logout
Socket.io Events (Real-Time)
Client → Server Events:

javascript
// Send a private message
socket.emit('send_message', {
  to: 'userId_or_groupId',
  content: 'Hello!',
  type: 'text' // or 'image', 'file'
});

// Typing indicator
socket.emit('typing', {
  to: 'userId_or_groupId',
  isTyping: true
});

// React to a message
socket.emit('message_reaction', {
  messageId: 'msg_123',
  emoji: '❤️'
});
Server → Client Events:

javascript
// Listen for new messages
socket.on('new_message', (message) => {
  // Update UI with new message
});

// Listen for typing indicators
socket.on('typing', ({ userId, isTyping }) => {
  // Show/hide typing indicator for user
});

// Listen for message reactions
socket.on('message_reaction', (reaction) => {
  // Update message with new reaction
});
🐳 Docker Deployment
Using Docker Compose (Recommended)
Ensure you have a docker-compose.yml file in the root (as described in your docs).

Build and run all services:

bash
docker-compose up --build
Access the application:

Frontend: http://localhost:3000

Backend API: http://localhost:5000

🌐 Production Deployment
Deploy to Vercel (Frontend)
The frontend is optimized for Vercel deployment with a vercel.json configuration.

bash
cd frontend
npm run build
# Connect your GitHub repo to Vercel or use Vercel CLI
Deploy Backend to Railway/Render
bash
cd backend
# Configure environment variables in your hosting dashboard
# Ensure MongoDB and Redis add-ons are connected
🛠️ Technology Stack
Backend
Node.js & Express - Server framework

Socket.io - Real-time, bidirectional communication

MongoDB & Mongoose - NoSQL database and ODM

Redis - Session store and cache layer

JWT - Stateless authentication

Arcjet - Security and rate limiting middleware

Cloudinary - Media file storage

Frontend
React 18 - UI library with hooks

Vite - Next-generation build tool

Tailwind CSS - Utility-first styling

Zustand - Lightweight state management

Socket.io Client - Real-time communication

Axios - HTTP client for REST API calls

🔒 Security Implementation
Layer	Technology	Purpose
Transport	HTTPS (in production)	Encrypts data in transit
Authentication	JWT Tokens	Stateless user sessions
Rate Limiting	Arcjet	Protects against DDoS/brute force
Input Validation	Express Validator	Prevents injection attacks
Password Hashing	bcrypt (12 rounds)	Secures user credentials
Session Storage	Redis	Fast, in-memory session store
CORS	Express CORS middleware	Controls cross-origin requests
🤝 Contributing
Contributions are welcome! Please follow these steps:

Fork the repository

Create a feature branch (git checkout -b feature/AmazingFeature)

Commit your changes (git commit -m 'Add some AmazingFeature')

Push to the branch (git push origin feature/AmazingFeature)

Open a Pull Request

Development Guidelines
Follow existing code style and structure

Write meaningful commit messages

Update documentation as needed

Test your changes thoroughly

📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

👥 Author
Mohammad Ali - Full Stack Developer - GitHub

🙏 Acknowledgments
Icons and images from FlatIcon

Sound effects from Freesound

The amazing open-source community

🔗 Links
Live Demo: https://thug-slayers-chat-app-frontend.vercel.app/

Main Repository: https://github.com/MohammadAli-14/ts-redis-chat-app

<div align="center">
⭐ If you find this project useful, please consider giving it a star! ⭐
Built with modern technologies for real-world performance.

Back to Top ↑

</div>
