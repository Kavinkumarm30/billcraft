const fs = require('fs');
let code = fs.readFileSync('src/contexts/AuthContext.tsx', 'utf8');

code = code.replace(
  /alert\("Your access has been revoked by the administrator\."\);/g,
  `console.error("Your access has been revoked by the administrator.");`
);

code = code.replace(
  /alert\("Server error occurred while authenticating\. Please try again\."\);/g,
  `console.error("Server error occurred while authenticating. Please try again.");`
);

fs.writeFileSync('src/contexts/AuthContext.tsx', code);
