const fs = require('fs');
let code = fs.readFileSync('src/pages/Payment.tsx', 'utf8');

code = code.replace(
  /onClick=\{\(\) => window\.location\.href = '\/login'\}/,
  `onClick={async () => {
              const { auth } = await import('../lib/firebase');
              await auth.signOut();
              window.location.href = '/login';
            }}`
);

fs.writeFileSync('src/pages/Payment.tsx', code);
