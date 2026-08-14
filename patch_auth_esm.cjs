const fs = require('fs');
let code = fs.readFileSync('src/middleware/auth.ts', 'utf8');

code = code.replace(
  /require\('fs'\)\.appendFileSync/,
  `fs.appendFileSync`
);

if (!code.includes("import fs from 'fs';")) {
  code = "import fs from 'fs';\n" + code;
}

fs.writeFileSync('src/middleware/auth.ts', code);
