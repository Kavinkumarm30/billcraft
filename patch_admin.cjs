const fs = require('fs');
let code = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

// We need to add a tab for Custom Layouts.
// First, add the state
code = code.replace(
  /const \[payments, setPayments\] = useState<any\[\]>\(\[\]\);/,
  `const [payments, setPayments] = useState<any[]>([]);\n  const [customLayouts, setCustomLayouts] = useState<any[]>([]);`
);

// Then add the fetch call
code = code.replace(
  /const paymentsRes = await fetch\('\/api\/admin\/payments'/,
  `const layoutsRes = await fetch('/api/admin/custom-layouts', {
          headers: { 'Authorization': \\\`Bearer \\\${token}\\\` }
        });
        if (layoutsRes.ok) {
          const lData = await layoutsRes.json();
          setCustomLayouts(lData);
        }
        
        const paymentsRes = await fetch('/api/admin/payments'`
);

// Then add a section in the UI. 
// Before: <h2 className="text-xl font-semibold mb-4 text-gray-900 mt-8">Recent Subscriptions</h2>
code = code.replace(
  /<h2 className="text-xl font-semibold mb-4 text-gray-900 mt-8">Recent Subscriptions<\/h2>/,
  `<h2 className="text-xl font-semibold mb-4 text-gray-900 mt-8">Pending Custom Layout Requests</h2>
        {customLayouts.length === 0 ? (
          <p className="text-gray-500 text-sm mb-8">No pending custom layout requests.</p>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200 mb-8">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Layout File</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customLayouts.map(layout => (
                  <tr key={layout.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{layout.organization?.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{layout.user?.name} ({layout.user?.email})</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(layout.submittedAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <a href={layout.fileUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">View File</a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={async () => {
                            if (!confirm('Approve custom layout for this org?')) return;
                            try {
                              const token = await auth.currentUser?.getIdToken();
                              const res = await fetch(\\\`/api/admin/custom-layouts/\\\${layout.id}/approve\\\`, {
                                method: 'POST',
                                headers: { 'Authorization': \\\`Bearer \\\${token}\\\` }
                              });
                              if (!res.ok) throw new Error(await res.text());
                              setCustomLayouts(prev => prev.filter(p => p.id !== layout.id));
                              alert('Approved successfully.');
                            } catch (e: any) {
                              alert('Error approving layout: ' + e.message);
                            }
                          }}
                          className="text-green-600 hover:text-green-900 bg-green-50 px-2 py-1 rounded"
                        >
                          Approve
                        </button>
                        <button
                          onClick={async () => {
                            const note = prompt('Reason for rejection?');
                            if (note === null) return;
                            try {
                              const token = await auth.currentUser?.getIdToken();
                              const res = await fetch(\\\`/api/admin/custom-layouts/\\\${layout.id}/reject\\\`, {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                  'Authorization': \\\`Bearer \\\${token}\\\`
                                },
                                body: JSON.stringify({ note })
                              });
                              if (!res.ok) throw new Error(await res.text());
                              setCustomLayouts(prev => prev.filter(p => p.id !== layout.id));
                              alert('Rejected successfully.');
                            } catch (e: any) {
                              alert('Error rejecting layout: ' + e.message);
                            }
                          }}
                          className="text-red-600 hover:text-red-900 bg-red-50 px-2 py-1 rounded"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        <h2 className="text-xl font-semibold mb-4 text-gray-900 mt-8">Recent Subscriptions</h2>`
);

fs.writeFileSync('src/pages/Admin.tsx', code);
