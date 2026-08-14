const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const newEndpoints = `
  // Custom Layout Submit endpoint
  app.post("/api/custom-layouts", requireAuth, async (req: AuthRequest, res) => {
    try {
      const u = req.dbUser;
      if (!u.orgId) return res.status(404).json({ error: "Organization not found" });
      
      const { fileUrl } = req.body;
      if (!fileUrl) return res.status(400).json({ error: "File URL is required" });

      const newRequest = await db.insert(customLayoutRequests)
        .values({
          userId: u.id,
          orgId: u.orgId,
          fileUrl,
          status: 'PENDING'
        }).returning();

      res.json(newRequest[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin Custom Layouts endpoint
  app.get("/api/admin/custom-layouts", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (req.dbUser.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: "Forbidden: Super Admin only" });
      }
      
      const pendingRequests = await db.query.customLayoutRequests.findMany({
        where: eq(customLayoutRequests.status, 'PENDING'),
        with: {
          user: true,
          organization: true
        },
        orderBy: [desc(customLayoutRequests.submittedAt)]
      });
      
      res.json(pendingRequests);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin Approve Custom Layout
  app.post("/api/admin/custom-layouts/:id/approve", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (req.dbUser.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: "Forbidden: Super Admin only" });
      }
      
      const requestId = parseInt(req.params.id);
      const targetRequests = await db.select().from(customLayoutRequests).where(eq(customLayoutRequests.id, requestId));
      if (targetRequests.length === 0) return res.status(404).json({ error: "Request not found" });

      const request = targetRequests[0];

      await db.update(customLayoutRequests)
        .set({ status: 'APPROVED', verifiedAt: new Date() })
        .where(eq(customLayoutRequests.id, requestId));

      await db.update(companySettings)
        .set({ hasCustomLayoutAccess: true })
        .where(eq(companySettings.orgId, request.orgId));

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin Reject Custom Layout
  app.post("/api/admin/custom-layouts/:id/reject", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (req.dbUser.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: "Forbidden: Super Admin only" });
      }
      
      const requestId = parseInt(req.params.id);
      const { note } = req.body;
      
      await db.update(customLayoutRequests)
        .set({ status: 'REJECTED', verifiedAt: new Date(), note })
        .where(eq(customLayoutRequests.id, requestId));

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
`;

code = code.replace(
  '// Admin Reject Payment',
  newEndpoints + '\n  // Admin Reject Payment'
);

// We need to import customLayoutRequests in server.ts
code = code.replace(
  /export const {([^}]+)} = require\('\.\/src\/db\/schema\.ts'\);/g, // This might not match, let's see how schema is imported
  (match) => { return match; }
);

fs.writeFileSync('server.ts', code);
