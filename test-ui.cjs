const fs = require('fs');
let code = fs.readFileSync('src/pages/Settings.tsx', 'utf8');
console.log(code.includes('Have a custom bill layout?'));
