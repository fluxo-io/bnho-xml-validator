#! /usr/bin/env node
import fs from 'fs';
import path from 'path';
import libxmljs from 'libxmljs2';

// Default ignore list: attributes or element names to skip; can be overridden via compareFiles argument
const defaultIgnoreList = [
  'xmlns:xsi',
  'xmlns:xsd',
  'Schema_Version',
  'schemaLocation',
  'xmlns',
  'Absender_ID',
  'Software_ID',
  'Software_Version'
];

// Helper to build full path to an element, including any ID attribute
function getPath(node) {
  const parts = [];
  while (node && node.type() === 'element') {
    let seg = node.name();
    const idAttr = node.attr('ID');
    if (idAttr) seg += `[@ID="${idAttr.value()}"]`;
    parts.unshift(seg);
    node = node.parent();
  }
  return '/' + parts.join('/');
}

// Default export directory for comparator results
const exportDir = 'exports';
if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true });

export function compareFiles(templatePath, comparePath, ignoreList = defaultIgnoreList) {
  // Create a Set of names (attributes or element names) to ignore
  const IGNORED = new Set(ignoreList);

  // Load and parse both XML documents
  const tplDoc = libxmljs.parseXml(fs.readFileSync(templatePath, 'utf8'));
  const cmpDoc = libxmljs.parseXml(fs.readFileSync(comparePath, 'utf8'));

  // Recursive extractor: records every element (including nested <Meldung>)
  function extractEntries(doc) {
    const map = new Map();
    function traverse(node) {
      if (node.type() !== 'element') return;
      // Skip entire element (and subtree) if its name is in the ignore list
      if (IGNORED.has(node.name())) return;

      const name = node.name();
      // filter out ignored attributes
      const attrs = node.attrs()
        .filter(a => !IGNORED.has(a.name()))
        .map(a => [a.name(), a.value()])
        .sort((a, b) => a[0].localeCompare(b[0]));
      const attrsString = attrs.map(a => `${a[0]}=${a[1]}`).join('&');

      // record this element if it has attributes
      if (attrs.length > 0) {
        const key = `${name}|${attrsString}|`;
        const entry = map.get(key) || { count: 0, details: [] };
        entry.count++;
        entry.details.push({ path: getPath(node), value: null });
        map.set(key, entry);
      }

      const childElems = node.childNodes().filter(n => n.type() === 'element');
      if (childElems.length === 0) {
        // leaf without attributes
        const text = (node.text() || '').trim();
        const key = `${name}|${attrsString}|${text}`;
        const entry = map.get(key) || { count: 0, details: [] };
        entry.count++;
        entry.details.push({ path: getPath(node), value: text });
        map.set(key, entry);
      } else {
        // recurse into every child
        childElems.forEach(traverse);
      }
    }
    traverse(doc.root());
    return map;
  }

  const map1 = extractEntries(tplDoc);
  const map2 = extractEntries(cmpDoc);
  const allKeys = new Set([...map1.keys(), ...map2.keys()]);
  const diffs = [];

  for (const key of allKeys) {
    const v1 = map1.get(key) || { count: 0, details: [] };
    const v2 = map2.get(key) || { count: 0, details: [] };
    if (v1.count !== v2.count) {
      const src = v1.count > v2.count ? v1.details[0] : v2.details[0];
      diffs.push({
        value:   src.value,
        path:    src.path,
        template: v1.count,
        compare:  v2.count
      });
    }
  }

  // Sort differences by path alphabetically
  diffs.sort((a, b) => a.path.localeCompare(b.path));

  // Filter out deeper diffs beneath attribute-mismatch elements
  const attrDiffPaths = new Set(
    diffs
      .filter(d => d.value === null)  // entries for elements with attributes
      .map(d => d.path)
  );
  const filteredDiffs = diffs.filter(d => {
    for (const base of attrDiffPaths) {
      if (d.path !== base && d.path.startsWith(base + '/')) {
        return false;
      }
    }
    return true;
  });

  // Write results to JSON
  const result = {
    template: templatePath,
    compare: comparePath,
    equal: filteredDiffs.length === 0,
    differences: filteredDiffs
  };
  const tplName = path.basename(templatePath, '.xml');
  const cmpName = path.basename(comparePath, '.xml');
  const outFile = `${tplName}_vs_${cmpName}.json`;
  const outPath = path.join(exportDir, outFile);
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf8');

  // Console output
  if (result.equal) {
    console.log(`✅ XMLs sind inhaltlich gleich. (Ergebnis: ${outPath})`);
  } else {
    console.error(`❌ XMLs unterscheiden sich. Details in ${outPath}`);
    process.exit(1);
  }
}

// CLI entrypoint
if (import.meta.url === `file://${process.argv[1]}`) {
  const [ , , tplPath, cmpPath ] = process.argv;
  if (!tplPath || !cmpPath) {
    console.error('Usage: comparator <template.xml> <compare.xml>');
    process.exit(1);
  }
  compareFiles(tplPath, cmpPath);
}