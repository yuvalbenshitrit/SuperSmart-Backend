module.exports = {
  apps: [{
    name: "Web-Server",
    script: "./dist/src/app.js",
    env_production: {
      NODE_ENV: "production"
    }
  }]
}
