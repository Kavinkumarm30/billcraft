const fs = require('fs');
let code = fs.readFileSync('src/pages/Settings.tsx', 'utf8');

const startIndex = code.indexOf('                  ))}');
const endIndex = code.indexOf('              <div className="space-y-2">\n                <Label>Company Logo</Label>');

if (startIndex !== -1 && endIndex !== -1) {
    const newCode = code.slice(0, startIndex) +
`                  }))}
                </div>
                
                <div className="mt-6 p-4 rounded-xl border border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-start gap-4">
                  <div className="mt-0.5 text-blue-600 shrink-0">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 w-full">
                    <h4 className="text-sm font-medium text-gray-900">Have a custom bill layout?</h4>
                    <p className="text-sm text-gray-500 mt-1 mb-3">
                      Upload your design, and our team will review it and grant you access.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 w-full">
                      <Input type="file" accept="image/*,.pdf" className="bg-white text-sm w-full sm:max-w-sm" />
                      <button type="button" className="px-4 py-2 shrink-0 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors" onClick={(e) => { e.preventDefault(); alert("Custom layout request submitted to support."); }}>
                        Upload
                      </button>
                    </div>
                  </div>
                </div>
              </div>
` + code.slice(endIndex);
    fs.writeFileSync('src/pages/Settings.tsx', newCode);
    console.log("Replaced using indices");
} else {
    console.log("Indices not found", startIndex, endIndex);
}
