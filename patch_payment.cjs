const fs = require('fs');
let code = fs.readFileSync('src/pages/Payment.tsx', 'utf8');

code = code.replace(
  /<Button\s*type="button"\s*className="w-full mt-6"\s*disabled=\{!base64Image \|\| loading\}\s*onClick=\{handleSubmit\}\s*>\s*\{loading \? 'Submitting\.\.\.' : 'Submit for Verification'\}\s*<\/Button>/,
  `<Button
            type="button"
            className="w-full mt-6"
            disabled={!base64Image || loading}
            onClick={handleSubmit}
          >
            {loading ? 'Submitting...' : 'Submit for Verification'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full mt-2 text-gray-500 hover:text-gray-700"
            onClick={async () => {
              const { auth } = await import('../lib/firebase');
              await auth.signOut();
            }}
          >
            Sign Out
          </Button>`
);

fs.writeFileSync('src/pages/Payment.tsx', code);
