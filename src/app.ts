import initApp from "./server";
import cartRoutes from "./routes/cart";
import wishlistRoutes from "./routes/wishlist";
import https from "https";
import fs from "fs";
import { setupWebsockets } from "./services/websocket";

const port = process.env.PORT;

initApp()
  .then(({ app, server }) => {
    app.use((req, res, next) => {
      console.log(`${req.method} ${req.url}`);
      next();
    });

    app.use("/carts", cartRoutes);
    app.use("/wishlists", wishlistRoutes);

    if(process.env.NODE_ENV != "production") {
      server.listen(port, () => {
        console.log(`🌐 Server running at http://localhost:${port}`);
        console.log(`📄 Swagger Docs available at http://localhost:${port}/api-docs`);
        console.log(`🔌 WebSocket server initialized`);
      });
    }
    else {
      const prop = {
        key: fs.readFileSync("../client-key.pem"),
        cert: fs.readFileSync("../client-cert.pem"),
      }
      // Create HTTPS server and set up WebSockets with it
      const httpsServer = https.createServer(prop, app);
      setupWebsockets(httpsServer); // Setup WebSockets with HTTPS server
      
      httpsServer.listen(port, () => {
        console.log(`🔒 Secure server running at https://supersmart.cs.colman.ac.il`);
        console.log(`📄 Swagger Docs available at https://supersmart.cs.colman.ac.il/api-docs`);
        console.log(`🔌 Secure WebSocket server initialized`);
      });
    }
  })
  .catch((error) => {
    console.error("❌ Failed to initialize application:", error);
    process.exit(1);
  });