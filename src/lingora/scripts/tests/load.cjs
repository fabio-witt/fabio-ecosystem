// Loads the app's TypeScript modules in Node (like the content checks do),
// so pure learning logic can be tested without a phone or browser.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = path.resolve(__dirname, '../..');
if (!require.extensions['.ts']?.lingora) {
  const compile = (module, file) => {
    const source = fs.readFileSync(file, 'utf8').replace(/(['"])@\/([^'"]+)\1/g,
      (_match, _quote, suffix) => JSON.stringify(path.join(root, 'src', suffix)));
    const result = ts.transpileModule(source, {
      fileName: file,
      compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX },
    });
    module._compile(result.outputText, file);
  };
  compile.lingora = true;
  require.extensions['.ts'] = compile;
}

module.exports = {
  root,
  load: (relative) => require(path.join(root, 'src', relative)),
  migrationsText: () => fs.readdirSync(path.join(root, 'supabase/migrations'))
    .map((file) => fs.readFileSync(path.join(root, 'supabase/migrations', file), 'utf8')).join('\n'),
};
