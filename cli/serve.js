#!/usr/bin/env node
const { runOperation } = require("./_common");

console.info("serve an app in production mode");
runOperation(__dirname, "serve", { NODE_ENV: "production" });
