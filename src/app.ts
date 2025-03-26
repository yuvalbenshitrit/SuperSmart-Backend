import initApp from "./server";

const port = process.env.PORT;


initApp()
  .then((app) => {
    app.listen(port, () => {
      console.log(`🌐 Server running at http://localhost:${port}`);
      console.log(`📄 Swagger Docs available at http://localhost:${port}/api-docs`);
    });
  })
  .catch((error) => {
    console.error("❌ Failed to initialize application:", error);
    process.exit(1);
  });