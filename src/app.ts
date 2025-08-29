import initApp from "./server";
import https from "https";
import fs from "fs";
import { setupWebsockets } from "./services/websocket";

const port = process.env.PORT;
if (!port) {
  console.error("❌ PORT is not defined in environment variables.");
  process.exit(1);
}

initApp()
  .then(({ app, server }) => {
    app.use((req, res, next) => {
      console.log(`${req.method} ${req.url}`);
      next();
    });

    if(process.env.NODE_ENV != "production") {
      server.listen(port, () => {
        setupWebsockets(server); 
        console.log(`🌐 Server running at http://localhost:${port}`);
        console.log(`📄 Swagger Docs available at http://localhost:${port}/api-docs`);
        console.log(`🔌 WebSocket server initialized`);
        
      });
    }
    else {
       const prop = {
         key: fs.readFileSync('./ssl/myserver.key'),  
         cert: fs.readFileSync('./ssl/CSB.crt'),
      }
      const httpsServer = https.createServer(prop, app);
      setupWebsockets(httpsServer); 
      
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