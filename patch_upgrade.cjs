const fs = require('fs');
let code = fs.readFileSync('src/components/Layout.tsx', 'utf8');

code = code.replace(
  /\{dbUser\.trialInvoicesRemaining <= 0 && \(\s*<Link to="\/payment" className="mt-2 block text-center text-xs bg-blue-600 text-white py-1 rounded hover:bg-blue-700">\s*Upgrade Now\s*<\/Link>\s*\)\}/g,
  `<Link to="/payment" className="mt-2 block text-center text-xs bg-blue-600 text-white py-1 rounded hover:bg-blue-700">
                  Upgrade Now
                </Link>`
);

fs.writeFileSync('src/components/Layout.tsx', code);
