const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  /app\.get\("\/api\/me", requireAuth, async \(req: AuthRequest, res\) => \{/g,
  `app.get("/api/me", requireAuth, async (req: AuthRequest, res) => {
    console.log("GET /api/me called for user:", req.dbUser?.email);
    fs.appendFileSync('api-me.log', new Date().toISOString() + " GET /api/me called for " + req.dbUser?.email + "\\n");`
);

code = code.replace(
  /res\.status\(500\)\.json\(\{ error: error\.message \}\);/g,
  `console.error("GET /api/me Error:", error);
      fs.appendFileSync('api-me.log', new Date().toISOString() + " GET /api/me ERROR: " + error.message + "\\n");
      res.status(500).json({ error: error.message });`
);

fs.writeFileSync('server.ts', code);
