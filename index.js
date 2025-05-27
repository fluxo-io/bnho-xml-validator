#! /usr/bin/env node
import fs from "fs";
import path from "path";
import { validateFiles } from "./modules/validator.js";
import { compareFiles } from "./modules/comparator.js";

const [,, command, ...args] = process.argv;

const schemaDir = "schema";
const importDir = "imports";
const exportDir = "exports";

// Ensure directories exist
[schemaDir, importDir, exportDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

switch (command) {
  case "validate":
    const schemaPath = path.join(schemaDir, "oBDS_v3.0.3.xsd");
    validateFiles(schemaPath, importDir, exportDir);
    break;
  case "compare":
    // args[0] = templateXML, args[1] = compareXML
    if (args.length < 2) {
      console.error("Usage: node index.js compare <template.xml> <compare.xml>");
      process.exit(1);
    }
    compareFiles(args[0], args[1]);
    break;
  default:
    console.log("So muss das Skript genutzt werden:");
    console.log("  gegen ein XML-Schema validieren:   node index.js validate");
    console.log("  zwei XMLs vergleichen:             node index.js compare datei1.xml datei2.xml");
    process.exit(1);
}
