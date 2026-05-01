# ConnectChat - Real-Time Messaging Application

A full-stack real-time chat application built with modern web technologies.

## Features

- 🔐 Secure authentication with JWT
- 💬 Real-time messaging with WebSockets
- 👤 Online/offline user status
- ⌨️ Typing indicators
- 📎 File and image sharing
- 😊 Emoji support
- 🌓 Dark/Light mode
- 📱 Responsive design
- ✅ Message delivery & read receipts
- 🗑️ Delete messages
- 🔍 User search
- 👥 Private and group chats

## Tech Stack

**Frontend:**
- React with Vite
- Tailwind CSS
- Socket.io-client
- Axios
- Zustand for state management

**Backend:**
- Node.js & Express
- MongoDB with Mongoose
- Socket.io
- JWT for authentication
- Multer for file uploads

## Vercel deployment (multiple services)

This repo includes a Vite frontend (`frontend/`) and an Express API (`backend/`).

- `vercel.json` builds the frontend and deploys the API as a Serverless Function via `api/index.js`.
- API is available at `/api/*` on the same domain as the frontend.

### Important limitation (Socket.IO)

Vercel Serverless Functions do **not** support long-lived Socket.IO connections reliably. The REST API will work, but realtime chat via Socket.IO should be hosted on a long-running server (e.g. Render/Railway/Fly.io) or moved to a WebSocket-friendly service.

### Environment variables

Set these in your Vercel Project settings:

- `MONGODB_URI`
- `JWT_SECRET`
- `CLIENT_URL` (your deployed frontend URL, e.g. `https://<project>.vercel.app`)
- `MAX_FILE_SIZE` (optional)

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
