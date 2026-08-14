const fs = require('fs');
let code = fs.readFileSync('src/db/schema.ts', 'utf8');

code = code.replace(/amount: numeric\('amount'\)\.notNull\(\)\.default\('399'\)/g, "amount: numeric('amount').notNull().default('499')");

fs.writeFileSync('src/db/schema.ts', code);
