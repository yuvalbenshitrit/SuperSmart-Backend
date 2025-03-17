import express, { Express } from "express";
const app = express();
import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import itemRoutes from "./routes/item";
import bodyParser from "body-parser";
import authRoutes from "./routes/auth";
import swaggerUI from "swagger-ui-express"
import swaggerJsDoc from "swagger-jsdoc"
import cors from "cors";
import file_routes from "./routes/file_routes";
import storeRoutes from "./routes/store";

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "*");
  res.header("Access-Control-Allow-Headers", "*");
  next();

});



app.use("/auth", authRoutes);
app.use("/public/", express.static("public"));  // middleware to serve static files
app.use("/storage/", express.static("storage"));
app.use("/", express.static("front"));
app.use("/file/", file_routes);
app.use("/api/items", itemRoutes);
app.use("/api/stores", storeRoutes);

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Web Dev 2025 REST API",
      version: "1.0.0",
      description: "REST server including authentication using JWT",
    },
    servers: [{ url: "http://localhost:" + process.env.PORT },
    { url: "http://10.10.246.84", },
    { url: "https://10.10.246.84", }],
  },
  apis: ["./src/routes/*.ts"],
};
const specs = swaggerJsDoc(options);
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(specs));

const initApp = async () => {
  return new Promise<Express>((resolve, reject) => {
    const db = mongoose.connection;
    db.on("error", (err) => {
      console.error(err);
    });
    db.once("open", () => {
      console.log("Connected to MongoDB");
    });

    if (process.env.DB_CONNECT === undefined) {
      console.error("MONGO_URI is not set");
      reject();
    } else {
      mongoose.connect(process.env.DB_CONNECT).then(() => {
        console.log("initApp finish");
        resolve(app);
      });
    }
  });
};

export default initApp;