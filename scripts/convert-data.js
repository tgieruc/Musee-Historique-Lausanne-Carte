import { readFileSync, writeFileSync } from 'fs';

const raw = readFileSync('js/data.js', 'utf8');
// data.js uses "var json = [...]" with JS single-quote escapes — must eval, not JSON.parse
const jsonArray = eval(raw.replace('var json =', '(') + ')');
writeFileSync('static/data.json', JSON.stringify(jsonArray));
console.log(`Converted ${jsonArray.length} entries to static/data.json`);
