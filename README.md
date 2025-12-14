# MERN Real-Time Chat Application 🚀

<div align="center">

![Chat Application](https://img.shields.io/badge/Status-Active-success)
![Version](https://img.shields.io/badge/Version-2.0-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![MongoDB](https://img.shields.io/badge/MongoDB-4.4-green)
![Express](https://img.shields.io/badge/Express-4.18-blue)
![React](https://img.shields.io/badge/React-18-red)
![Node.js](https://img.shields.io/badge/Node.js-20-green)

A full-featured, production-ready real-time chat application built with the MERN stack featuring WebSocket communication, Redis caching, and advanced messaging capabilities.

[Live Demo](https://thug-slayers-chat-app-frontend.vercel.app/) 
</div>

## ✨ Features

### 🤖 **Real-Time Messaging**
- ✅ Instant one-to-one and group messaging
- ✅ WebSocket-based real-time communication using Socket.IO
- ✅ Message reactions (👍, ❤️, 😂, etc.)
- ✅ Read receipts and typing indicators
- ✅ Message editing and deletion

### 👥 **Group Management**
- ✅ Create public/private groups with custom avatars
- ✅ Add/remove members dynamically
- ✅ Group admin controls and permissions
- ✅ Group information and member management
- ✅ Separate models for group and private messages

### 🔐 **Authentication & Security**
- ✅ JWT-based authentication with refresh tokens
- ✅ Email verification with OTP system
- ✅ Password reset functionality
- ✅ Rate limiting and security via Arcjet
- ✅ Session management with Redis

### 🎨 **User Experience**
- ✅ Gaming-themed responsive design for mobile & desktop
- ✅ Keyboard sound effects and audio feedback
- ✅ Animated UI components with Tailwind CSS
- ✅ Virtualized message lists for optimal performance
- ✅ Real-time connection status monitoring

### ⚡ **Performance & Optimization**
- ✅ Redis caching for frequent queries with advanced strategies
- ✅ Message pagination and lazy loading
- ✅ WebSocket connection pooling and optimization
- ✅ Optimized database queries with MongoDB indexing
- ✅ Advanced state management with Zustand

### 📊 **Monitoring & Reliability**
- ✅ Comprehensive health check endpoints
- ✅ Performance monitoring utilities
- ✅ Automated cleanup of unverified accounts
- ✅ Multi-provider email notification system
- ✅ Socket connection debugging tools

## 🏗️ Architecture Overview

This application follows a modern microservices-inspired architecture with clear separation of concerns:

- **Frontend**: React 18 with Vite, Zustand for state management, Socket.IO client for real-time communication
- **Backend**: Express.js with Socket.IO server, MongoDB for data persistence, Redis for caching and sessions
- **Communication**: Real-time bidirectional communication via WebSockets with REST API fallback
- **Storage**: MongoDB for primary data, Redis for sessions and cache, Cloudinary for media files

## 📁 Project Structure

```
ts-redis-chat-app/
├── backend/                 # Express.js backend server
│   ├── src/
│   │   ├── automation/     # Automated tasks (cron jobs)
│   │   │   └── removeUnverifiedAccounts.js
│   │   ├── controllers/    # Route controllers
│   │   │   ├── auth.controller.js
│   │   │   ├── group.controller.js
│   │   │   ├── groupMessage.controller.js
│   │   │   ├── health.controller.js
│   │   │   ├── message.controller.js
│   │   │   ├── reaction.controller.js
│   │   │   └── readReceipt.controller.js
│   │   ├── emails/         # Email service implementations
│   │   │   ├── emailHandlers.js
│   │   │   ├── emailTemplates.js
│   │   │   ├── emailTest.js
│   │   │   └── sendEmail.js
│   │   ├── lib/           # Utilities and service configurations
│   │   │   ├── advancedCache.js
│   │   │   ├── arcjet.js
│   │   │   ├── cache.js
│   │   │   ├── cloudinary.js
│   │   │   ├── cron.js
│   │   │   ├── db.js
│   │   │   ├── env.js
│   │   │   ├── nodemailer.js
│   │   │   ├── redis.js
│   │   │   ├── resend.js
│   │   │   ├── sendgrid.js
│   │   │   ├── socket.js
│   │   │   └── utils.js
│   │   ├── middleware/    # Express middleware
│   │   │   ├── arcjet.middleware.js
│   │   │   ├── auth.middleware.js
│   │   │   ├── rateLimit.middleware.js
│   │   │   └── socket.auth.middleware.js
│   │   ├── models/        # MongoDB schemas
│   │   │   ├── Group.js
│   │   │   ├── GroupMessage.js
│   │   │   ├── Message.js
│   │   │   ├── MessageReaction.js
│   │   │   └── User.js
│   │   ├── routes/        # API route definitions
│   │   │   ├── auth.route.js
│   │   │   ├── group.routes.js
│   │   │   ├── groupMessage.routes.js
│   │   │   ├── message.routes.js
│   │   │   ├── reaction.routes.js
│   │   │   └── readReceipt.routes.js
│   │   └── server.js      # Main server entry point
│   ├── package.json
│   └── .gitignore
│
├── frontend/              # React frontend application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   │   ├── ActiveTabSwitch.jsx
│   │   │   ├── AddMembersModal.jsx
│   │   │   ├── BorderAnimatedContainer.jsx
│   │   │   ├── ChatContainer.jsx
│   │   │   ├── ChatHeader.jsx
│   │   │   ├── ChatsList.jsx
│   │   │   ├── ContactList.jsx
│   │   │   ├── CreateGroupModal.jsx
│   │   │   ├── GroupChatContainer.jsx
│   │   │   ├── GroupInfoModal.jsx
│   │   │   ├── GroupsList.jsx
│   │   │   ├── LandingPage.jsx
│   │   │   ├── LogoutConfirmationDialog.jsx
│   │   │   ├── MessageDebugger.jsx
│   │   │   ├── MessageInput.jsx
│   │   │   ├── MessageReactions.jsx
│   │   │   ├── MessageTimeDisplay.jsx
│   │   │   ├── MessagesLoadingSkeleton.jsx
│   │   │   ├── NoChatHistoryPlaceholder.jsx
│   │   │   ├── NoChatsFound.jsx
│   │   │   ├── NoConversationPlaceholder.jsx
│   │   │   ├── PageLoader.jsx
│   │   │   ├── ProfileHeader.jsx
│   │   │   ├── SocketDebugger.jsx
│   │   │   ├── SocketStatus.jsx
│   │   │   ├── UsersLoadingSkeleton.jsx
│   │   │   └── VirtualizedMessageList.jsx
│   │   ├── hooks/         # Custom React hooks
│   │   │   ├── useGroupMessages.js
│   │   │   ├── useKeyboardSound.js
│   │   │   └── useMobile.js
│   │   ├── pages/         # Page components
│   │   │   ├── ChatPage.jsx
│   │   │   ├── ForgotPasswordPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── OTPVerificationPage.jsx
│   │   │   └── SignUpPage.jsx
│   │   ├── store/         # Zustand state management
│   │   │   ├── useAuthStore.js
│   │   │   ├── useChatStore.js
│   │   │   └── useOptimizedChatStore.js
│   │   ├── utils/         # Utility functions
│   │   │   ├── logger.js
│   │   │   ├── performance.js
│   │   │   ├── performanceMonitor.js
│   │   │   └── timeFormatter.js
│   │   ├── lib/           # External library configs
│   │   │   └── axios.js
│   │   ├── App.jsx        # Main App component
│   │   └── main.jsx       # React entry point
│   ├── public/            # Static assets
│   │   ├── sound/         # Audio files
│   │   │   ├── keystroke1.mp3
│   │   │   ├── keystroke2.mp3
│   │   │   ├── keystroke3.mp3
│   │   │   ├── keystroke4.mp3
│   │   │   ├── mouse-click.mp3
│   │   │   └── notification.mp3
│   │   ├── avatar.png
│   │   ├── forgot.png
│   │   ├── guild-members-squad1.png
│   │   ├── login.png
│   │   ├── signup.png
│   │   ├── thug-slayers-badge.png
│   │   └── vite.svg
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── .gitignore
│
└── package.json           # Root package.json
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **MongoDB** (v6 or higher)
- **Redis** (v7 or higher)
- **npm** or **yarn**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/MohammadAli-14/ts-redis-chat-app.git
   cd ts-redis-chat-app
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Setup Frontend**
   ```bash
   cd ../frontend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start Development Servers**

   **Terminal 1 - Backend:**
   ```bash
   cd backend
   npm run dev
   ```

   **Terminal 2 - Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

5. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000
   - API Health: http://localhost:5000/api/health

## 🔧 Configuration

### Environment Variables

**Backend (.env)**
```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/chat-app
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your_super_secret_jwt_key_here
ARCJET_KEY=your_arcjet_api_key

# Email Service (choose one)
EMAIL_SERVICE=sendgrid  # Options: sendgrid, resend, nodemailer
SENDGRID_API_KEY=your_sendgrid_key
RESEND_API_KEY=your_resend_key

# Cloudinary for File Uploads
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Frontend (.env)**
```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
VITE_ENVIRONMENT=development
```

## 📡 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/auth/register` | Register new user | No |
| `POST` | `/api/auth/login` | User login | No |
| `POST` | `/api/auth/verify-otp` | Verify email OTP | No |
| `POST` | `/api/auth/forgot-password` | Request password reset | No |
| `POST` | `/api/auth/reset-password` | Reset password | No |
| `POST` | `/api/auth/logout` | User logout | Yes |
| `GET` | `/api/auth/me` | Get current user | Yes |

### Message Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/messages/:userId` | Get messages with user | Yes |
| `POST` | `/api/messages` | Send new message | Yes |
| `PUT` | `/api/messages/:id` | Update message | Yes |
| `DELETE` | `/api/messages/:id` | Delete message | Yes |
| `GET` | `/api/messages/unread/count` | Get unread count | Yes |

### Group Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/groups` | Get user's groups | Yes |
| `POST` | `/api/groups` | Create new group | Yes |
| `GET` | `/api/groups/:id` | Get group details | Yes |
| `PUT` | `/api/groups/:id` | Update group | Yes |
| `DELETE` | `/api/groups/:id` | Delete group | Yes |
| `POST` | `/api/groups/:id/members` | Add member | Yes |
| `DELETE` | `/api/groups/:id/members/:userId` | Remove member | Yes |
| `GET` | `/api/groups/:id/messages` | Get group messages | Yes |

### WebSocket Events

**Client → Server:**
```javascript
// Send message
socket.emit('send_message', {
  to: 'userId',
  content: 'Hello!',
  type: 'text'
});

// Typing indicator
socket.emit('typing', {
  to: 'userId',
  isTyping: true
});

// Message reaction
socket.emit('message_reaction', {
  messageId: 'msg123',
  emoji: '❤️'
});

// Read receipt
socket.emit('read_receipt', {
  messageId: 'msg123'
});
```

**Server → Client:**
```javascript
// Listen for events
socket.on('new_message', (message) => {
  console.log('New message:', message);
});

socket.on('message_reaction', (reaction) => {
  console.log('Reaction:', reaction);
});

socket.on('typing', ({ userId, isTyping }) => {
  console.log(`${userId} is ${isTyping ? 'typing...' : 'not typing'}`);
});

socket.on('read_receipt', ({ messageId, userId }) => {
  console.log(`${userId} read message ${messageId}`);
});

socket.on('user_status', ({ userId, isOnline }) => {
  console.log(`${userId} is ${isOnline ? 'online' : 'offline'}`);
});
```

## 🐳 Docker Deployment

### Using Docker Compose

1. **Create `docker-compose.yml`:**
   ```yaml
   version: '3.8'
   services:
     mongodb:
       image: mongo:6
       container_name: chat-mongodb
       ports:
         - "27017:27017"
       volumes:
         - mongodb_data:/data/db
       environment:
         MONGO_INITDB_ROOT_USERNAME: admin
         MONGO_INITDB_ROOT_PASSWORD: password
     
     redis:
       image: redis:7-alpine
       container_name: chat-redis
       ports:
         - "6379:6379"
       command: redis-server --requirepass password
     
     backend:
       build: ./backend
       container_name: chat-backend
       ports:
         - "5000:5000"
       environment:
         - NODE_ENV=production
         - MONGODB_URI=mongodb://admin:password@mongodb:27017/chat-app?authSource=admin
         - REDIS_URL=redis://:password@redis:6379
       depends_on:
         - mongodb
         - redis
     
     frontend:
       build: ./frontend
       container_name: chat-frontend
       ports:
         - "3000:3000"
       depends_on:
         - backend
   
   volumes:
     mongodb_data:
   ```

2. **Build and run:**
   ```bash
   docker-compose up --build
   ```

## 🌐 Production Deployment

### Deploy to Vercel (Frontend)
The frontend is already deployed at: [https://thug-slayers-chat-app-frontend.vercel.app/](https://thug-slayers-chat-app-frontend.vercel.app/)

To redeploy:
```bash
cd frontend
npm run build
# Deploy to Vercel using their CLI or GitHub integration
```

### Deploy to Railway (Backend)
```bash
cd backend
railway up
```

## 🛠️ Built With

### Backend Stack
- [**Express.js**](https://expressjs.com/) - Web framework
- [**MongoDB**](https://www.mongodb.com/) - NoSQL database
- [**Socket.io**](https://socket.io/) - Real-time communication
- [**Redis**](https://redis.io/) - Caching & session store
- [**JWT**](https://jwt.io/) - Authentication tokens
- [**Arcjet**](https://arcjet.com/) - Security & rate limiting

### Frontend Stack
- [**React 18**](https://reactjs.org/) - UI library
- [**Vite**](https://vitejs.dev/) - Build tool & dev server
- [**Tailwind CSS**](https://tailwindcss.com/) - Styling
- [**Zustand**](https://github.com/pmndrs/zustand) - State management
- [**Socket.io Client**](https://socket.io/docs/v4/client-api/) - WebSocket client
- [**Axios**](https://axios-http.com/) - HTTP client

## 🔒 Security Features

| Feature | Implementation | Purpose |
|---------|---------------|---------|
| **JWT Authentication** | Bearer tokens with expiration | Secure API access |
| **Password Hashing** | bcrypt with 12 rounds | Protection against breaches |
| **Rate Limiting** | Arcjet middleware | DDoS protection |
| **Input Validation** | Schema validation | SQL/NoSQL injection prevention |
| **CORS Configuration** | Whitelisted origins | Cross-origin protection |
| **WebSocket Auth** | Middleware for socket connections | Secure real-time communication |

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

### How to Contribute

1. **Fork the Project**
2. **Create your Feature Branch**
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. **Commit your Changes**
   ```bash
   git commit -m 'Add some AmazingFeature'
   ```
4. **Push to the Branch**
   ```bash
   git push origin feature/AmazingFeature
   ```
5. **Open a Pull Request**

### Development Guidelines

- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Follow the existing code style
- Use ESLint and Prettier for code formatting

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](frontend/LICENSE) file for details.

## 👥 Authors

- **Mohammad Ali** - *Full Stack Developer* - [GitHub](https://github.com/MohammadAli-14)

## 🙏 Acknowledgments

- Icons and images from [FlatIcon](https://www.flaticon.com)
- Sound effects from [Freesound](https://freesound.org)
- The amazing open-source community
- All contributors who have helped shape this project

## 🔗 Important Links

- **Live Demo**: [https://thug-slayers-chat-app-frontend.vercel.app/](https://thug-slayers-chat-app-frontend.vercel.app/)
- **Main Repository**: [https://github.com/MohammadAli-14/ts-redis-chat-app](https://github.com/MohammadAli-14/ts-redis-chat-app)
- **Frontend Repository**: [https://github.com/MohammadAli-14/Thug-Slayers-Chat-App-Frontend](https://github.com/MohammadAli-14/Thug-Slayers-Chat-App-Frontend)

---

<div align="center">

### ⭐ Don't forget to star this repo if you found it useful! ⭐

Made with ❤️ by the development team.

[Back to Top ↑](#mern-real-time-chat-application-)

</div>
