import fs from "fs";
import path from "path";
import { validateFiles } from "./modules/validator.js";
import { compareFiles } from "./modules/comparator.js";

// Attributes and element names to ignore in comparisons; customize here
const IGNORE_LIST = [
  'xmlns:xsi',
  'xmlns:xsd',
  'Schema_Version',
  'schemaLocation',
  'xmlns',
  'Absender_ID',
  'Software_ID',
  'Software_Version',
  'Meldedatum',
  // 'Absender',
  // 'Menge_Melder',
];

const [,, command, ...args] = process.argv;

const schemaDir = "schema";
const importDir = "imports";
const exportDir = "exports";

[schemaDir, importDir, exportDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

switch (command) {
  case "validate":
    const schemaPath = path.join(schemaDir, "oBDS_v3.0.3.xsd");
    validateFiles(schemaPath, importDir, exportDir);
    break;
  case "compare":
    if (args.length < 2) {
      console.error("So muss das Skript genutzt werden: node index.js compare \"ordner1/template.xml\" \"ordner2/compare.xml\"");
      process.exit(1);
    }
    compareFiles(args[0], args[1], IGNORE_LIST);
    break;
  default:
    console.log("So muss das Skript genutzt werden:");
    console.log("  gegen ein XML-Schema validieren:   node index.js validate");
    console.log("  zwei XMLs vergleichen:             node index.js compare \"ordner1/template.xml\" \"ordner2/compare.xml\"");
    process.exit(1);
}
