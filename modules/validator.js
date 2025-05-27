import libxmljs from "libxmljs2";
import fs from "fs";
import path from "path";


export async function validateFiles(schemaPath, importDir, exportDir) {
  const files = fs.readdirSync(importDir).filter(file => file.endsWith(".xml"));

  for (const file of files) {
    const xmlPath = path.join(importDir, file);
    const exportPath = path.join(exportDir, file.replace(".xml", ".json"));

    try {
      const xml = fs.readFileSync(xmlPath, "utf8");
      const xsd = fs.readFileSync(schemaPath, "utf8");
      
      const xsdDoc = libxmljs.parseXml(xsd);
      const xmlDoc = libxmljs.parseXml(xml);
      
      const isValid = xmlDoc.validate(xsdDoc);
      
      if (isValid) {
        fs.writeFileSync(exportPath, JSON.stringify({ status: "[success]", file }, null, 2));
        console.log(`✅ Validation successful for ${file}`);
      } else {
        const detailedErrors = xmlDoc.validationErrors.map(err => ({
          message: err.message,
          line: err.line || "unknown"
        }));
        
        fs.writeFileSync(exportPath, JSON.stringify({ status: "[error]", file, errors: detailedErrors }, null, 2));
        console.error(`❌ Validation error in ${file}`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${file}`);
      fs.writeFileSync(exportPath, JSON.stringify({ error: error.message }, null, 2));
    }
  }
}