const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

if (!code.includes('customLayoutRequests')) {
    code = code.replace(
        /import { users, organizations, companySettings, customers, invoices, invoiceItems, payments } from '\.\/src\/db\/schema\.ts';/,
        "import { users, organizations, companySettings, customers, invoices, invoiceItems, payments, customLayoutRequests } from './src/db/schema.ts';"
    );
    fs.writeFileSync('server.ts', code);
    console.log("Updated imports");
}
