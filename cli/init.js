#!/usr/bin/env node
const { runOperation } = require("./_common");

console.info("init an app");
runOperation(__dirname, "init");
