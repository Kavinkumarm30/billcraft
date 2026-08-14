const fs = require('fs');
let code = fs.readFileSync('src/components/Layout.tsx', 'utf8');

const trialBlock = `
        <div className="p-4 border-t border-gray-100">
          {dbUser?.subscriptionStatus === 'TRIAL' && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-xs font-semibold text-blue-900 mb-1">Free Trial Active</p>
              <div className="w-full bg-blue-200 rounded-full h-1.5 mb-2">
                <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: \\\`\${(dbUser.trialInvoicesRemaining / 3) * 100}%\`\\\` }}></div>
              </div>
              <p className="text-[10px] text-blue-800">{dbUser.trialInvoicesRemaining} of 3 bills remaining</p>
              {dbUser.trialInvoicesRemaining <= 0 && (
                <Link to="/payment" className="mt-2 block text-center text-xs bg-blue-600 text-white py-1 rounded hover:bg-blue-700">
                  Upgrade Now
                </Link>
              )}
            </div>
          )}
          <div className="flex items-center gap-3 px-3 py-2 mb-2">`;

code = code.replace(
  /<div className="p-4 border-t border-gray-100">\s*<div className="flex items-center gap-3 px-3 py-2 mb-2">/,
  trialBlock
);

fs.writeFileSync('src/components/Layout.tsx', code);
