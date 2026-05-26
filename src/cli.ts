#!/usr/bin/env node

import { version } from "./index.js";

const args = process.argv.slice(2);

if (args.includes("--version") || args.includes("-v")) {
  console.log(version);
} else {
  console.log("smokegrid");
}
