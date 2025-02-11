import validator from "xsd-schema-validator";
import fs from "fs";
import path from "path";


export async function processFiles(schemaPath,importDir,exportDir) {
  const files = fs.readdirSync(importDir).filter(file => file.endsWith(".xml"));

  for (const file of files) {
    const xmlPath = path.join(importDir, file);
    const exportPath = path.join(exportDir, file.replace(".xml", ".json"));

    try {
      const result = await validator.validateXML({ file: xmlPath }, schemaPath);
      fs.writeFileSync(exportPath, JSON.stringify(result, null, 2));
      console.log(`✅ ${file}`);
    } catch (error) {
      console.error(`❌ ${file}`);
      fs.writeFileSync(exportPath, JSON.stringify(error, null, 2));
    }
  }
}