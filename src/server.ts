import express, { Express } from "express";
import http from "http";

const app = express();
import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import itemsRoutes from "./routes/item";
import storesRoutes from "./routes/store";
import bodyParser from "body-parser";
import authRoutes from "./routes/auth";
import swaggerUI from "swagger-ui-express";
import swaggerJsDoc from "swagger-jsdoc";
import cors from "cors";
import file_routes from "./routes/file_routes";
import cartRoutes from "./routes/cart";
import chatRoutes from "./routes/chat"
import { setupWebsockets, io } from './services/websocket';
import emailRoutes from "./routes/email_routes";

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/items", itemsRoutes);
app.use("/stores", storesRoutes);
app.use("/auth", authRoutes);
app.use("/cart", cartRoutes);
app.use("/public", express.static("public"));
app.use("/storage", express.static("storage"));
app.use("/file", file_routes);
app.use("/chat", chatRoutes)
app.use("/", emailRoutes);

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Web Dev 2025 REST API",
      version: "1.0.0",
      description: "REST server including authentication using JWT",
    },
    servers: [{ url: "http://localhost:" + process.env.PORT }],
  },
  apis: ["./src/routes/*.ts"],
};

const specs = swaggerJsDoc(options);
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(specs));

const initApp = async () => {
  return new Promise<{ app: Express; server: http.Server }>(
    (resolve, reject) => {
      const server = http.createServer(app);
      setupWebsockets(server);


     
      // Detailed MongoDB Connection Options
      const mongoOptions = {
        serverSelectionTimeoutMS: 15000, // 15 seconds
        socketTimeoutMS: 45000, // 45 seconds
        maxPoolSize: 10, // Connection pool size
        minPoolSize: 5,
      };

      mongoose.connection.on("error", (err) => {
        console.error("❌ MongoDB Connection Error:", err);
        reject(err);
      });

      mongoose.connection.on("connected", () => {
        console.log("✅ Connected to MongoDB Successfully");
      });

      mongoose.connection.on("disconnected", () => {
        console.log("⚠️ MongoDB Disconnected");
      });

      if (!process.env.DB_CONNECT) {
        console.error("❌ MONGO_URI is not set in environment variables");
        reject(new Error("Database connection string is missing"));
        return;
      }

      mongoose
        .connect(process.env.DB_CONNECT, mongoOptions)
        .then(() => {
          console.log("🚀 Mongoose Connected Successfully");
          resolve({ app, server });
        })
        .catch((connectError) => {
          console.error("❌ Failed to Connect to MongoDB:", connectError);
          console.error("Connection Details:", {
            connectionString: process.env.DB_CONNECT,
            options: mongoOptions,
          });
          reject(connectError);
        });
    }
  );
};

export { io };

export default initApp;
