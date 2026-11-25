const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const parse = file => ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
const dictionary = new Map();
const dictionaryFile = parse(path.join(root, 'src/i18n/de.ts'));
function readTranslations(node) {
  if (ts.isPropertyAssignment(node) && ts.isStringLiteral(node.name) && ts.isStringLiteral(node.initializer)) {
    dictionary.set(node.name.text, node.initializer.text);
  }
  ts.forEachChild(node, readTranslations);
}
readTranslations(dictionaryFile);
const errors = [];
const placeholders = text => [...text.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort().join(',');
for (const [key, value] of dictionary) {
  if (placeholders(key) !== placeholders(value)) errors.push('Translation placeholders do not match: ' + key);
}
let count = 0;
function scan(directory) {
  for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, item.name);
    if (item.isDirectory()) { scan(file); continue; }
    if (!/\.tsx?$/.test(file)) continue;
    const source = parse(file);
    function visit(node) {
      if (ts.isCallExpression(node) && ['t', 'translate'].includes(node.expression.getText(source))
        && node.arguments[0] && ts.isStringLiteralLike(node.arguments[0])) {
        count++;
        const key = node.arguments[0].text;
        if (!dictionary.has(key)) errors.push(path.relative(root, file) + ': missing German translation for ' + JSON.stringify(key));
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
}
scan(path.join(root, 'src'));
if (errors.length) {
  errors.forEach(error => console.error(error));
  process.exitCode = 1;
} else {
  console.log('Interface translations passed: ' + count + ' references and ' + dictionary.size + ' German entries.');
}
