const fs = require('fs');
let code = fs.readFileSync('src/pages/Settings.tsx', 'utf8');

code = code.replace(
  /<div className="flex flex-col sm:flex-row gap-2 w-full">\s*<Input type="file" accept="image\/\*,\.pdf" className="bg-white text-sm w-full sm:max-w-sm" \/>\s*<button type="button" className="px-4 py-2 shrink-0 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors" onClick={\(e\) => { e\.preventDefault\(\); alert\("Custom layout request submitted to support\."\); }}>\s*Upload\s*<\/button>\s*<\/div>/g,
  `{settings?.hasCustomLayoutAccess ? (
                      <div className="text-sm text-green-700 font-medium bg-green-50 p-2 rounded border border-green-200">
                        You have been granted access to the custom layout! Please contact support to provide the final HTML template.
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-2 w-full">
                        <Input type="file" accept="image/*,.pdf" className="bg-white text-sm w-full sm:max-w-sm" id="custom-layout-file" />
                        <button type="button" className="px-4 py-2 shrink-0 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors" onClick={async (e) => {
                          e.preventDefault();
                          const fileInput = document.getElementById('custom-layout-file') as HTMLInputElement;
                          const file = fileInput.files?.[0];
                          if (!file) {
                            alert("Please select a file first");
                            return;
                          }
                          const reader = new FileReader();
                          reader.onloadend = async () => {
                            try {
                              const res = await fetch('/api/custom-layouts', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                  'Authorization': \`Bearer \${await auth.currentUser?.getIdToken()}\`
                                },
                                body: JSON.stringify({ fileUrl: reader.result })
                              });
                              if (!res.ok) throw new Error(await res.text());
                              alert("Custom layout request submitted successfully!");
                              fileInput.value = '';
                            } catch (err: any) {
                              alert("Error submitting request: " + err.message);
                            }
                          };
                          reader.readAsDataURL(file);
                        }}>
                          Upload
                        </button>
                      </div>
                    )}`
);

fs.writeFileSync('src/pages/Settings.tsx', code);
