/* global module */
module.exports = {
  apps : [{
    name   : "SuperSmart-server",
    script : "./dist/src/app.js",
    env_production:{
      NODE_ENV:"production"
    }
  }]
}
