const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/amount: '399'/g, "amount: '499'");

fs.writeFileSync('server.ts', code);
