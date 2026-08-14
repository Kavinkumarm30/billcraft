const fs = require('fs');
let code = fs.readFileSync('src/components/Layout.tsx', 'utf8');

code = code.replace(
  /style=\{\{ width: \\`\$\{\(dbUser\.trialInvoicesRemaining \/ 3\) \* 100\}%`\\` \}\}/g,
  "style={{ width: `${(dbUser.trialInvoicesRemaining / 3) * 100}%` }}"
);

fs.writeFileSync('src/components/Layout.tsx', code);
