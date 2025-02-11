import fs from "fs";
import path from "path";
import { processFiles } from "./modules/validator.js";

const schemaDir = "schema";
const importDir = "imports";
const exportDir = "exports";

[schemaDir, exportDir, importDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const schemaPath = path.join(schemaDir, "oBDS_v3.0.3.xsd");
processFiles(schemaPath,importDir,exportDir);
