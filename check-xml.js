import { readFileSync } from 'fs';
const xml = readFileSync('repomix-src.xml', 'utf8');
console.log(xml.includes('handlers/code.ts') ? 'XML OK' : 'XML borked');
console.log(`XML length: ${xml.length} chars`);
console.log(`Directory structure section: ${xml.includes('<directory_structure>') ? 'Found' : 'Missing'}`);
console.log(`Sample file paths: ${xml.match(/<file path="([^"]+)">/g)?.slice(0, 5).join(', ') || 'None found'}`);
