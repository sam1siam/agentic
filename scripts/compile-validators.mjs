import { readFile, writeFile, mkdir } from 'node:fs/promises';
import Ajv from 'ajv/dist/2020.js';
import standalone from 'ajv/dist/standalone/index.js';
await mkdir('lib/generated', { recursive: true });
for (const name of ['agentic', 'receipt', 'site']) {
  const schema = JSON.parse(
    await readFile(
      'schemas/' + name + (name === 'site' ? '-1.1' : '-1.0') + '.schema.json',
      'utf8',
    ),
  );
  const ajv = new Ajv({
    allErrors: true,
    strict: true,
    code: { source: true, esm: true },
    unicodeRegExp: false,
  });
  const validate = ajv.compile(schema);
  let code = standalone(ajv, validate);
  // Count Unicode code points without a CommonJS runtime dependency in the browser.
  code = code.replace(
    /const (\w+) = require\("ajv\/dist\/runtime\/ucs2length"\)\.default;/g,
    'const $1 = value => [...value].length;',
  );
  await writeFile(
    'lib/generated/' + name + '.js',
    '// Generated from the versioned JSON Schema. Do not edit.\n' + code + '\n',
  );
}
console.log('Compiled site, action, and receipt validators.');
