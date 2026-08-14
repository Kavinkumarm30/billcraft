const fs = require('fs');
let code = fs.readFileSync('src/pages/Payment.tsx', 'utf8');

code = code.replace(
  /const \{ dbUser, getToken \} = useAuth\(\);/,
  "const { dbUser, getToken, logout } = useAuth();"
);

code = code.replace(
  /onClick=\{async \(\) => \{\s*const \{ auth \} = await import\('\.\.\/lib\/firebase'\);\s*await auth\.signOut\(\);\s*window\.location\.href = '\/login';\s*\}\}/,
  "onClick={logout}"
);

code = code.replace(
  /onClick=\{async \(\) => \{\s*const \{ auth \} = await import\('\.\.\/lib\/firebase'\);\s*await auth\.signOut\(\);\s*\}\}/,
  "onClick={logout}"
);

fs.writeFileSync('src/pages/Payment.tsx', code);
