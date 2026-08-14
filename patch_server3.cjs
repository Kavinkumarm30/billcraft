const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
    /import { organizations, users, companySettings, customers, invoices, invoiceItems, payments } from "\.\/src\/db\/schema\.ts";/,
    'import { organizations, users, companySettings, customers, invoices, invoiceItems, payments, customLayoutRequests } from "./src/db/schema.ts";'
);
fs.writeFileSync('server.ts', code);
