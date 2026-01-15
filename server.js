import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

import router from "./server/routes/index.js";
import { registerSocketHandlers } from "./server/socket/handlers.js";
import { RoomManager } from "./server/socket/roomManager.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3000;
const ORIGIN = process.env.CORS_ORIGIN || "*";

const io = new Server(server, {
  cors: {
    origin: ORIGIN,
    methods: ["GET", "POST"],
  },
  pingTimeout: Number(process.env.SOCKET_PING_TIMEOUT || 60000),
  pingInterval: Number(process.env.SOCKET_PING_INTERVAL || 25000),
});

// Static assets
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "images")));

// Routes
app.use("/", router);

// Socket setup with room manager
const roomManager = new RoomManager();
registerSocketHandlers(io, roomManager);

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});

process.on("SIGINT", () => {
  console.log("Đang tắt server (SIGINT)...");
  server.close(() => process.exit(0));
});

process.on("SIGTERM", () => {
  console.log("Đang tắt server (SIGTERM)...");
  server.close(() => process.exit(0));
});

