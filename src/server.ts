import express, { Express } from "express";
import http from "http";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import itemsRoutes from "./routes/item";
import storesRoutes from "./routes/store";
import bodyParser from "body-parser";
import authRoutes from "./routes/auth";
import swaggerUI from "swagger-ui-express";
import swaggerJsDoc from "swagger-jsdoc";
import cors from "cors";
import file_routes from "./routes/file_routes";
import cartRoutes from "./routes/cart";
import wishlistRoutes from "./routes/wishlist";
import chatRoutes from "./routes/chat";
//import { setupWebsockets, io } from "./services/websocket";
import emailRoutes from "./routes/email_routes";

import mapSupermarketsRoutes from "./routes/mapSupers";


// Load environment variables based on the environment
if (process.env.NODE_ENV === "test") {
  dotenv.config({ path: ".env_test" });
} else if (process.env.NODE_ENV === "dev") {
  dotenv.config({ path: ".env_dev" });
} else {
  dotenv.config(); // loads default .env if none specified
}



const app = express();


app.use(cors({
  origin: ['http://localhost:3000', 'https://10.10.248.141','https://supersmart.cs.colman.ac.il'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use("/items", itemsRoutes);
app.use("/stores", storesRoutes);
app.use("/auth", authRoutes);
//app.use("/cart", cartRoutes);
app.use("/carts", cartRoutes);
app.use("/wishlists", wishlistRoutes);
app.use("/public", express.static("public"));
app.use("/file", file_routes);
app.use("/chat", chatRoutes)
app.use("/", emailRoutes);
app.use("/",mapSupermarketsRoutes);
app.use("/wishlists", wishlistRoutes);


//app.use(express.static("front"));

// Swagger setup
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Web Dev 2025 REST API",
      version: "1.0.0",
      description: "REST server including authentication using JWT",
    },
    servers: [{ url: "http://localhost:" + process.env.PORT },

    { url: "http://10.10.248.141", },
    { url: "https://10.10.248.141", },
    { url: "https://supersmart.cs.colman.ac.il" }


    ],
  },
  apis: ["./src/routes/*.ts"],
};

const specs = swaggerJsDoc(options);
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(specs));

app.use("/", express.static("front"));
app.use((req, res) => {
  res.status(200).sendFile(path.join(__dirname, "../../front/index.html"));
});

// Initialize the app
const initApp = async () => {
  return new Promise<{ app: Express; server: http.Server }>(
    (resolve, reject) => {
      const server = http.createServer(app);

      // Only set up WebSockets here for non-production
      if (process.env.NODE_ENV !== "production") {
        //setupWebsockets(server);
      }

      // MongoDB connection options
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
        console.log(
          "✅ Connected to MongoDB Successfully at:",
          process.env.DB_CONNECT
        );
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

//export { io };
export default initApp;
