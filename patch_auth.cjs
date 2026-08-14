const fs = require('fs');
let code = fs.readFileSync('src/middleware/auth.ts', 'utf8');

code = code.replace(
  /console\.error\('Error verifying Firebase ID token:', error\);/,
  `console.error('Error verifying Firebase ID token:', error);
    require('fs').appendFileSync('auth-error.log', new Date().toISOString() + " " + (error.stack || error) + "\\n");`
);

fs.writeFileSync('src/middleware/auth.ts', code);
