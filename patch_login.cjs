const fs = require('fs');
let code = fs.readFileSync('src/pages/Login.tsx', 'utf8');

code = code.replace(
  /toast\.success\('Logged in successfully'\);\s*navigate\('\/dashboard'\);/g,
  `toast.success('Logged in successfully');
      // Navigation is handled by the useEffect watching the 'user' state`
);

fs.writeFileSync('src/pages/Login.tsx', code);
