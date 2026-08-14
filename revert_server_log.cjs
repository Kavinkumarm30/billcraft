const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  /console\.log\("GET \/api\/me called for user:", req\.dbUser\?\.email\);\n\s*fs\.appendFileSync\('api-me\.log', new Date\(\)\.toISOString\(\) \+ " GET \/api\/me called for " \+ req\.dbUser\?\.email \+ "\\n"\);/g,
  ''
);

code = code.replace(
  /console\.error\("GET \/api\/me Error:", error\);\n\s*fs\.appendFileSync\('api-me\.log', new Date\(\)\.toISOString\(\) \+ " GET \/api\/me ERROR: " \+ error\.message \+ "\\n"\);/g,
  ''
);

fs.writeFileSync('server.ts', code);
