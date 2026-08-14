const fs = require('fs');
let code = fs.readFileSync('src/components/Layout.tsx', 'utf8');

const activeBlock = `
          {dbUser?.subscriptionStatus === 'ACTIVE' && dbUser?.subscriptionEndsAt && (
            <div className="mb-4 p-3 bg-green-50 border border-green-100 rounded-lg">
              <p className="text-xs font-semibold text-green-900 mb-1">Pro Plan Active</p>
              <p className="text-[10px] text-green-800">
                Valid until {new Date(dbUser.subscriptionEndsAt).toLocaleDateString()}
              </p>
            </div>
          )}
          {dbUser?.subscriptionStatus === 'PENDING_VERIFICATION' && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-100 rounded-lg">
              <p className="text-xs font-semibold text-yellow-900 mb-1">Payment Pending</p>
              <p className="text-[10px] text-yellow-800">
                Awaiting admin approval.
              </p>
            </div>
          )}
          <div className="flex items-center gap-3 px-3 py-2 mb-2">`;

code = code.replace(
  /<div className="flex items-center gap-3 px-3 py-2 mb-2">/,
  activeBlock
);

fs.writeFileSync('src/components/Layout.tsx', code);
