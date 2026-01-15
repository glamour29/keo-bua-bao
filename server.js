import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import dotenv from "dotenv";
import { RoomManager } from "./server/socket/roomManager.js";
import { setupSocketHandlers } from "./server/socket/handlers.js";
import routes from "./server/routes/index.js";

// Load environment variables
dotenv.config();

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(join(__dirname, "public")));

// Serve images
app.use("/images", express.static(join(__dirname, "images")));

// Serve CSS files
app.use("/css", express.static(join(__dirname, "public", "css")));

// Serve JS files
app.use("/js", express.static(join(__dirname, "public", "js")));

// Routes
app.use("/", routes);

// Initialize Room Manager
const roomManager = new RoomManager();

// Setup Socket.IO handlers
setupSocketHandlers(io, roomManager);

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
  console.log(`📡 Socket.IO server đã sẵn sàng`);
});

// Handle errors
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});
