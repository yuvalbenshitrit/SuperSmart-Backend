import initApp from "./server";
import cartRoutes from "./routes/cart";
import wishlistRoutes from "./routes/wishlist";

const port = process.env.PORT;

initApp()
  .then(({ app, server }) => {
  

    app.use((req, res, next) => {
      console.log(`${req.method} ${req.url}`);
      next();
    });

    app.use("/carts", cartRoutes);
    app.use("/wishlists", wishlistRoutes);

    server.listen(port, () => {
      console.log(`🌐 Server running at http://localhost:${port}`);
      console.log(`📄 Swagger Docs available at http://localhost:${port}/api-docs`);
      console.log(`🔌 WebSocket server initialized`);
    });
  })
  .catch((error) => {
    console.error("❌ Failed to initialize application:", error);
    process.exit(1);
  });