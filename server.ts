import dotenv from "dotenv";
try {
  dotenv.config();
  dotenv.config({ path: ".env.local" });
} catch (e) {}

import express from "express";
import path from "path";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { requireAuth, AuthRequest, invalidateUserCache, invalidateAllUserCaches } from "./src/middleware/auth.ts";
import { db, pool } from "./src/db/index.ts";
import { organizations, users, companySettings, customers, invoices, invoiceItems, payments, customLayoutRequests } from "./src/db/schema.ts";
import { eq, desc, and, ilike, sql, count, sum, gte } from "drizzle-orm";
import { GoogleGenAI } from "@google/genai";
import multer from "multer";
import fs from "fs";

// Initialize Gemini API for AI Extraction
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "dummy_key_if_missing" });

// SECURITY: File upload with size limit, max file count, and type validation
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB max per file
    files: 10,                 // Max 10 bill pages / files per request (prevents memory exhaustion)
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'application/pdf'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, WebP, GIF, BMP) and PDFs are allowed'));
    }
  }
});

export const app = express();
const PORT = 3000;

// SECURITY: Enable trust proxy so req.ip correctly resolves client IPs behind Vercel reverse proxies
app.set('trust proxy', 1);
  
// SECURITY: Security headers
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for SPA compatibility; enable when ready
  crossOriginEmbedderPolicy: false,
}));

// SECURITY: CORS restricted to allowed origins (HIGH-01)
const ALLOWED_ORIGINS = [
  'https://bill-craft-three.vercel.app',
  process.env.APP_URL || '',
  process.env.NODE_ENV !== 'production' ? 'http://localhost:3000' : '',
  process.env.NODE_ENV !== 'production' ? 'http://localhost:5173' : '',
].filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// ENTERPRISE: Key rate limits by authenticated user (via token) with fallback to IP
// Prevents shared office / mobile hotspot NATs from blocking all users on the same WiFi
const getRateLimitKey = (req: express.Request) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7, 45); // Unique slice of bearer token
  }
  return req.ip || 'anonymous';
};

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per 15 min window per user
  keyGenerator: getRateLimitKey,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

const extractLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15, // 15 OCR requests per minute per user (matching Gemini free quota)
  keyGenerator: getRateLimitKey,
  message: { error: 'OCR rate limit exceeded. Please wait a moment before trying again.' }
});

app.use('/api/', apiLimiter);
app.use('/api/extract', extractLimiter);

// ENTERPRISE: Request ID & duration tracking middleware
app.use((req, res, next) => {
  const start = Date.now();
  const requestId = Math.random().toString(36).substring(2, 10);
  res.setHeader('X-Request-ID', requestId);

  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 1500 && req.path !== '/api/extract') {
      console.warn(`[SLOW REQUEST] ${req.method} ${req.path} (${res.statusCode}) - ${duration}ms [ReqID: ${requestId}]`);
    }
  });
  next();
});

app.use(express.json({ limit: '10mb' }));

  // API Routes
  
  app.get("/api/health", async (req, res) => {
    try {
      const result = await pool.query("SELECT 1 as ok");
      res.json({ status: "ok", db: "connected", timestamp: new Date().toISOString() });
    } catch (err: any) {
      res.status(503).json({ status: "degraded", db: "disconnected", error: err.message });
    }
  });

  // Current User Info
  app.get("/api/me", requireAuth, async (req: AuthRequest, res) => {
    
    try {
      const u = req.dbUser;
      res.json(u);
    } catch (error: any) {
      
      res.status(500).json({ error: error.message });
    }
  });

  // Settings Endpoints
  app.get("/api/settings", requireAuth, async (req: AuthRequest, res) => {
    try {
      const u = req.dbUser;
      if (!u.orgId) {
        return res.status(404).json({ error: "Organization not found" });
      }

      // Fetch organization details as well
      const orgs = await db.select().from(organizations).where(eq(organizations.id, u.orgId));
      const org = orgs[0];

      const settings = await db.select().from(companySettings).where(eq(companySettings.orgId, u.orgId));
      const setting = settings[0];
      
      // SECURITY: Mask dedicatedApiKey so non-super-admins cannot view plaintext API keys
      const isSuperAdmin = u.role === 'SUPER_ADMIN';
      const safeDedicatedKey = setting?.dedicatedApiKey
        ? (isSuperAdmin ? setting.dedicatedApiKey : `${setting.dedicatedApiKey.slice(0, 6)}...****`)
        : null;

      res.json({
        ...setting,
        dedicatedApiKey: safeDedicatedKey,
        companyName: org?.name || 'My Company'
      });
    } catch (error: any) {
      res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Failed to fetch settings' : error.message });
    }
  });

  app.put("/api/settings", requireAuth, async (req: AuthRequest, res) => {
    try {
      const u = req.dbUser;
      if (!u.orgId) {
        return res.status(404).json({ error: "Organization not found" });
      }

      // SECURITY: Whitelist allowed settings fields to prevent mass assignment (HIGH-04)
      const { companyName, address, phone, email, website, gstNo, panNo, bankName, accountNo, ifsc, upiId, invoicePrefix, invoiceLayout, footer, terms, logoUrl } = req.body;
      const safeSettingData: Record<string, any> = {};
      if (address !== undefined) safeSettingData.address = address;
      if (phone !== undefined) safeSettingData.phone = phone;
      if (email !== undefined) safeSettingData.email = email;
      if (website !== undefined) safeSettingData.website = website;
      if (gstNo !== undefined) safeSettingData.gstNo = gstNo;
      if (panNo !== undefined) safeSettingData.panNo = panNo;
      if (bankName !== undefined) safeSettingData.bankName = bankName;
      if (accountNo !== undefined) safeSettingData.accountNo = accountNo;
      if (ifsc !== undefined) safeSettingData.ifsc = ifsc;
      if (upiId !== undefined) safeSettingData.upiId = upiId;
      if (invoicePrefix !== undefined) safeSettingData.invoicePrefix = invoicePrefix;
      if (invoiceLayout !== undefined) safeSettingData.invoiceLayout = invoiceLayout;
      if (footer !== undefined) safeSettingData.footer = footer;
      if (terms !== undefined) safeSettingData.terms = terms;
      if (logoUrl !== undefined) safeSettingData.logoUrl = logoUrl;

      if (companyName) {
        await db.update(organizations)
          .set({ name: companyName })
          .where(eq(organizations.id, u.orgId));
      }

      const updatedSettings = await db.update(companySettings)
        .set(safeSettingData)
        .where(eq(companySettings.orgId, u.orgId))
        .returning();

      res.json(updatedSettings[0]);
    } catch (error: any) {
      console.error("Update settings error:", error);
      res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Failed to update settings' : error.message });
    }
  });

  // Admin Routes
  app.get("/api/admin/users", requireAuth, async (req: AuthRequest, res) => {
    try {
      const u = req.dbUser;
      if (u.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: "Forbidden: Super Admin only" });
      }

      // ENTERPRISE: Support pagination for large user bases
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(200, Math.max(1, parseInt(req.query.limit as string) || 200));
      const offset = (page - 1) * limit;
      
      const allUsers = await db.select().from(users).orderBy(desc(users.createdAt)).limit(limit).offset(offset);
      
      let settingsMap = new Map();
      try {
        const allSettings = await db.select().from(companySettings);
        settingsMap = new Map(allSettings.map(s => [s.orgId, s]));
      } catch (settingsErr) {
        console.warn("Could not load companySettings for users list:", settingsErr);
      }

      const enrichedUsers = allUsers.map(user => {
        const setting = user.orgId ? settingsMap.get(user.orgId) : null;
        return {
          ...user,
          dedicatedApiKey: setting?.dedicatedApiKey || null,
        };
      });

      res.json(enrichedUsers);
    } catch (error: any) {
      console.error("GET /api/admin/users error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Customers Endpoints
  app.get("/api/customers", requireAuth, async (req: AuthRequest, res) => {
    try {
      const u = req.dbUser;
      if (!u.orgId) return res.status(404).json({ error: "Organization not found" });

      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
      const offset = (page - 1) * limit;
      const search = (req.query.search as string || '').trim();

      if (search) {
        const results = await db.select().from(customers)
          .where(and(eq(customers.orgId, u.orgId), ilike(customers.name, `%${search}%`)))
          .orderBy(desc(customers.createdAt))
          .limit(limit)
          .offset(offset);
        return res.json(results);
      }

      const orgCustomers = await db.select().from(customers)
        .where(eq(customers.orgId, u.orgId))
        .orderBy(desc(customers.createdAt))
        .limit(limit)
        .offset(offset);

      res.json(orgCustomers);
    } catch (error: any) {
      console.error("Fetch customers error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Admin Assign Dedicated API Key to a User's Organization
  app.put("/api/admin/users/:id/api-key", requireAuth, async (req: AuthRequest, res) => {
    try {
      const u = req.dbUser;
      if (u.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: "Forbidden: Super Admin only" });
      }

      const userId = parseInt(req.params.id);
      const { apiKey } = req.body;

      const targetUsers = await db.select().from(users).where(eq(users.id, userId));
      if (targetUsers.length === 0) return res.status(404).json({ error: "User not found" });
      const targetUser = targetUsers[0];

      if (!targetUser.orgId) {
        return res.status(400).json({ error: "User has no associated organization" });
      }

      const cleanedKey = apiKey && typeof apiKey === 'string' && apiKey.trim().length > 0 ? apiKey.trim() : null;

      const existingSettings = await db.select().from(companySettings).where(eq(companySettings.orgId, targetUser.orgId));
      if (existingSettings.length === 0) {
        await db.insert(companySettings).values({
          orgId: targetUser.orgId,
          dedicatedApiKey: cleanedKey,
        });
      } else {
        await db.update(companySettings)
          .set({ dedicatedApiKey: cleanedKey, updatedAt: new Date() })
          .where(eq(companySettings.orgId, targetUser.orgId));
      }

      res.json({ success: true, dedicatedApiKey: cleanedKey });
    } catch (error: any) {
      console.error("Assign API Key error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Admin Test Any API Key Live
  app.post("/api/admin/test-api-key", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (req.dbUser.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: "Forbidden: Super Admin only" });
      }

      const { apiKey } = req.body;
      if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
        return res.status(400).json({ error: "Please provide an API key to test" });
      }

      const testAI = new GoogleGenAI({ apiKey: apiKey.trim() });
      const modelChain = ["gemini-2.5-flash", "gemini-flash-latest", "gemini-3-flash-preview"];
      let testResponse;
      let lastTestError;

      for (const modelName of modelChain) {
        try {
          testResponse = await testAI.models.generateContent({
            model: modelName,
            contents: [{ role: "user", parts: [{ text: "Respond with the word OK." }] }],
            config: { maxOutputTokens: 10 }
          });
          if (testResponse && testResponse.text) break;
        } catch (err: any) {
          lastTestError = err;
        }
      }

      if (testResponse && testResponse.text) {
        return res.json({ success: true, message: "API Key is valid and active!" });
      }
      throw lastTestError || new Error("Failed to communicate with Gemini API");
    } catch (error: any) {
      console.error("Test API Key error:", error);
      return res.status(400).json({ error: error.message || "Invalid API key or network error" });
    }
  });

  app.post("/api/admin/users/:id/toggle", requireAuth, async (req: AuthRequest, res) => {
    try {
      const u = req.dbUser;
      if (u.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: "Forbidden: Super Admin only" });
      }
      
      const userId = parseInt(req.params.id);
      
      // Get target user
      const targetUsers = await db.select().from(users).where(eq(users.id, userId));
      if (targetUsers.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      const targetUser = targetUsers[0];
      
      // Toggle
      const updatedUser = await db.update(users)
        .set({ isActive: !targetUser.isActive })
        .where(eq(users.id, userId))
        .returning();

      // ENTERPRISE: Invalidate cached auth for this user so access change takes effect immediately
      if (targetUser.uid) {
        invalidateUserCache(targetUser.uid);
      }
        
      res.json(updatedUser[0]);
    } catch (error: any) {
      
      res.status(500).json({ error: error.message });
    }
  });

  // OCR & Extraction Route (Supports Single or Multi-page Bills & Dedicated API Keys)
  app.post("/api/extract", requireAuth, upload.any(), async (req: AuthRequest, res) => {
    try {
      const u = req.dbUser;
      const files = (req.files as Express.Multer.File[]) || (req.file ? [req.file] : []);
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No image file(s) uploaded" });
      }
      
      // Determine effective API key: Per-user dedicated API key if assigned, or platform fallback
      let effectiveApiKey = process.env.GEMINI_API_KEY || "dummy_key_if_missing";
      let isDedicated = false;
      if (u.orgId) {
        const orgSettings = await db.select().from(companySettings).where(eq(companySettings.orgId, u.orgId));
        if (orgSettings[0]?.dedicatedApiKey) {
          effectiveApiKey = orgSettings[0].dedicatedApiKey;
          isDedicated = true;
        }
      }

      console.log(`Processing ${files.length} bill page(s) using ${isDedicated ? 'DEDICATED API KEY' : 'DEFAULT API KEY'} for user ${u.email} (Org: ${u.orgId})`);
      const userAI = new GoogleGenAI({ apiKey: effectiveApiKey });

      // Build inlineData for every page uploaded
      const imageParts = files.map((file, idx) => ({
        inlineData: {
          mimeType: file.mimetype,
          data: file.buffer.toString("base64"),
        }
      }));
      
      const promptParts = [
        ...imageParts,
        {
          text: `You are an expert OCR & invoice transcription AI.
          You are provided with ${files.length} consecutive image(s)/page(s) of a handwritten or printed bill/invoice.
          
          CRITICAL MULTI-PAGE INSTRUCTIONS:
          1. Treat all provided images as consecutive pages (Page 1, Page 2, Page 3...) of the SAME invoice/bill.
          2. Sequentially extract and COMBINE ALL LINE ITEMS from every single page into the unified "items" array in exact top-to-bottom page order. Do NOT skip any items from any page.
          3. Extract customer name, phone number, address, invoice number, and bill date (usually on the first page header or summary).
          4. Subtotal: Sum of all item amounts across all pages.
          5. Tax / GST / Discount / Grand Total: Extract or calculate the overall final grand total across all pages (usually found on the final page summary).
          6. Notes: Include any extra notes, payment instructions, or terms mentioned on any page.
          
          Follow this exact JSON structure:
          {
            "customerName": "string",
            "phone": "string",
            "address": "string",
            "invoiceNumber": "string",
            "date": "string (YYYY-MM-DD)",
            "items": [
              {
                "description": "string",
                "quantity": number,
                "rate": number,
                "amount": number
              }
            ],
            "subtotal": number,
            "discount": number,
            "taxAmount": number,
            "grandTotal": number,
            "notes": "string"
          }
          
          Respond ONLY with valid JSON. No markdown tags or explanatory text. Transcribe all handwriting and numbers as accurately as possible.`
        }
      ];

      const modelConfig = {
        temperature: 0.1,
        responseMimeType: "application/json",
      };

      const modelChain = ["gemini-3.6-flash", "gemini-3-flash-preview", "gemini-flash-latest"];
      let response;
      let lastError;

      for (const modelName of modelChain) {
        try {
          response = await userAI.models.generateContent({
            model: modelName,
            contents: [{ role: "user", parts: promptParts }],
            config: modelConfig
          });
          if (response && response.text) {
            console.log(`Successfully generated multi-page OCR content using model: ${modelName} (${files.length} pages processed)`);
            break;
          }
        } catch (err: any) {
          console.warn(`Gemini model ${modelName} error, trying next fallback:`, err.message || err);
          lastError = err;
        }
      }

      if (!response || !response.text) {
        throw lastError || new Error("Failed to extract bill data from AI model");
      }
      
      let resultText = response.text;
      if (!resultText) {
         throw new Error("Empty response from AI");
      }
      
      // Strip markdown code blocks if present
      resultText = resultText.replace(/^\s*```(json)?/i, '').replace(/```\s*$/, '').trim();
      
      const parsedData = JSON.parse(resultText);
      res.json(parsedData);
      
    } catch (error: any) {
      console.error("Multi-page extraction error:", error);
      res.status(500).json({ error: error.message || "Failed to extract data" });
    }
  });

  // Custom Layout Requests Endpoints
  app.get("/api/custom-layout-requests", requireAuth, async (req: AuthRequest, res) => {
    try {
      const u = req.dbUser;
      if (!u.orgId) return res.status(404).json({ error: "Organization not found" });

      const requests = await db.select().from(customLayoutRequests)
        .where(eq(customLayoutRequests.orgId, u.orgId))
        .orderBy(desc(customLayoutRequests.submittedAt));

      res.json(requests);
    } catch (error: any) {
      console.error("Fetch custom layout requests error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/custom-layout-requests", requireAuth, upload.single('file'), async (req: AuthRequest, res) => {
    try {
      const u = req.dbUser;
      if (!u.orgId) return res.status(404).json({ error: "Organization not found" });

      let fileUrl = '';
      if (req.file) {
        fileUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      } else if (req.body.fileUrl) {
        fileUrl = req.body.fileUrl;
      }

      if (!fileUrl) {
        return res.status(400).json({ error: "Please upload an invoice design file or image" });
      }

      const newRequest = await db.insert(customLayoutRequests).values({
        orgId: u.orgId,
        userId: u.id,
        fileUrl: fileUrl,
        note: req.body.note || 'Custom layout design request',
        status: 'PENDING',
        submittedAt: new Date(),
      }).returning();

      res.json(newRequest[0]);
    } catch (error: any) {
      console.error("Submit custom layout request error:", error);
      res.status(500).json({ error: error.message || "Failed to submit request" });
    }
  });

  // Team Members & Role-based Permissions Access Control
  app.get("/api/team", requireAuth, async (req: AuthRequest, res) => {
    try {
      const u = req.dbUser;
      if (!u.orgId) return res.status(404).json({ error: "Organization not found" });

      const teamMembers = await db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        role: users.role,
        isActive: users.isActive,
        canReadInvoices: users.canReadInvoices,
        canWriteInvoices: users.canWriteInvoices,
        canCustomizeLayout: users.canCustomizeLayout,
        canManageCustomers: users.canManageCustomers,
        createdAt: users.createdAt,
      }).from(users).where(eq(users.orgId, u.orgId));

      res.json(teamMembers);
    } catch (error: any) {
      console.error("Fetch team error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/team/:id/permissions", requireAuth, async (req: AuthRequest, res) => {
    try {
      const u = req.dbUser;
      if (!u.orgId) return res.status(404).json({ error: "Organization not found" });

      // Only Super Admin or Admin can manage permissions
      if (u.role !== 'SUPER_ADMIN' && u.role !== 'ADMIN') {
        return res.status(403).json({ error: "Forbidden: Only admins can manage team permissions" });
      }

      const targetUserId = parseInt(req.params.id);
      if (isNaN(targetUserId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      // SECURITY: Prevent self-privilege escalation (MED-05)
      if (targetUserId === u.id) {
        return res.status(403).json({ error: "Forbidden: You cannot modify your own permissions" });
      }

      const targetUsers = await db.select().from(users).where(eq(users.id, targetUserId));
      if (targetUsers.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const targetUser = targetUsers[0];
      if (targetUser.orgId !== u.orgId && u.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: "Forbidden: User belongs to another organization" });
      }

      const { role, canReadInvoices, canWriteInvoices, canCustomizeLayout, canManageCustomers, isActive } = req.body;

      // SECURITY: Only SUPER_ADMIN can assign SUPER_ADMIN or ADMIN roles
      const requestedRole = role !== undefined ? role : targetUser.role;
      if ((requestedRole === 'SUPER_ADMIN' || requestedRole === 'ADMIN') && u.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: "Forbidden: Only Super Admin can assign admin roles" });
      }

      const updatedUser = await db.update(users)
        .set({
          role: requestedRole,
          canReadInvoices: canReadInvoices !== undefined ? Boolean(canReadInvoices) : targetUser.canReadInvoices,
          canWriteInvoices: canWriteInvoices !== undefined ? Boolean(canWriteInvoices) : targetUser.canWriteInvoices,
          canCustomizeLayout: canCustomizeLayout !== undefined ? Boolean(canCustomizeLayout) : targetUser.canCustomizeLayout,
          canManageCustomers: canManageCustomers !== undefined ? Boolean(canManageCustomers) : targetUser.canManageCustomers,
          isActive: isActive !== undefined ? Boolean(isActive) : targetUser.isActive,
          updatedAt: new Date(),
        })
        .where(eq(users.id, targetUserId))
        .returning();

      // ENTERPRISE: Invalidate cached auth for this user so permission changes take effect immediately
      if (targetUser.uid) {
        invalidateUserCache(targetUser.uid);
      }

      res.json(updatedUser[0]);
    } catch (error: any) {
      console.error("Update permissions error:", error);
      res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Failed to update permissions' : error.message });
    }
  });


  // Invoices Routes
  
  app.get("/api/dashboard", requireAuth, async (req: AuthRequest, res) => {
    try {
      const u = req.dbUser;
      if (!u.orgId) return res.status(404).json({ error: "Organization not found" });

      const orgId = u.orgId;

      // ENTERPRISE: Use SQL aggregation instead of loading all invoices into memory
      // Today's revenue and count (returns 1 row, not thousands)
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const todayStats = await pool.query(
        `SELECT COUNT(*)::int as count, COALESCE(SUM(grand_total::numeric), 0)::float as revenue
         FROM invoices WHERE org_id = $1 AND date >= $2`,
        [orgId, todayStart]
      );

      const todaysRevenue = todayStats.rows[0]?.revenue || 0;
      const billsGenerated = todayStats.rows[0]?.count || 0;

      // Total customers (1 row)
      const customerCount = await pool.query(
        `SELECT COUNT(*)::int as total FROM customers WHERE org_id = $1`,
        [orgId]
      );
      const totalCustomers = customerCount.rows[0]?.total || 0;

      // 7-day chart data (max 7 rows returned, not thousands)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      const chartResult = await pool.query(
        `SELECT DATE(date) as day, COALESCE(SUM(grand_total::numeric), 0)::float as total
         FROM invoices WHERE org_id = $1 AND date >= $2
         GROUP BY DATE(date) ORDER BY day`,
        [orgId, sevenDaysAgo]
      );

      // Fill in missing days with 0
      const chartMap = new Map(chartResult.rows.map((r: any) => [r.day.toISOString().slice(0, 10), r.total]));
      const chartData = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const key = d.toISOString().slice(0, 10);
        return {
          name: d.toLocaleDateString('en-US', { weekday: 'short' }),
          total: chartMap.get(key) || 0
        };
      });

      // Recent activity (only 5 rows, with a LIMIT)
      const recentInvoices = await db.query.invoices.findMany({
        where: eq(invoices.orgId, orgId),
        with: { customer: true },
        orderBy: [desc(invoices.createdAt)],
        limit: 5
      });

      const recentActivity = recentInvoices.map(inv => ({
        type: 'success',
        title: `Invoice ${inv.invoiceNumber} created for ${(inv as any).customer?.name || 'Unknown'}`,
        time: new Date(inv.createdAt).toLocaleString()
      }));

      res.json({
        todaysRevenue,
        billsGenerated,
        totalCustomers,
        chartData,
        recentActivity
      });
    } catch (error: any) {
      console.error("Dashboard error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/invoices", requireAuth, async (req: AuthRequest, res) => {
    try {
      const u = req.dbUser;
      if (!u.orgId) return res.status(404).json({ error: "Organization not found" });

      // ENTERPRISE: Support pagination with ?page=1&limit=50
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(200, Math.max(1, parseInt(req.query.limit as string) || 200));
      const offset = (page - 1) * limit;

      const orgInvoices = await db.query.invoices.findMany({
        where: eq(invoices.orgId, u.orgId),
        with: {
          customer: true,
          items: true
        },
        orderBy: [desc(invoices.createdAt)],
        limit: limit,
        offset: offset
      });
      res.json(orgInvoices);
    } catch (error: any) {
      console.error("Invoices list error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  const parseSafeDate = (d: any): Date => {
    if (!d) return new Date();
    if (d instanceof Date && !isNaN(d.getTime())) return d;
    if (typeof d === 'string') {
      const dt = new Date(d);
      if (!isNaN(dt.getTime())) return dt;
      if (d.includes('/')) {
        const parts = d.split('/');
        if (parts.length === 3) {
          const d1 = new Date(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`);
          if (!isNaN(d1.getTime())) return d1;
        }
      }
    }
    return new Date();
  };

  const safeNumericStr = (val: any): string => {
    if (val === undefined || val === null || val === '') return '0';
    const clean = String(val).replace(/[^0-9.-]+/g, '');
    const num = parseFloat(clean);
    return isNaN(num) ? '0' : String(num);
  };

  app.post("/api/invoices", requireAuth, async (req: AuthRequest, res) => {
    try {
      const u = req.dbUser;
      if (!u.orgId) return res.status(404).json({ error: "Organization not found" });

      // Trial / Subscription Check
      if (u.role !== 'SUPER_ADMIN') {
        if (u.subscriptionStatus === 'TRIAL' && u.trialInvoicesRemaining > 0) {
          // Allow
        } else if (u.subscriptionStatus === 'ACTIVE' && (!u.subscriptionEndsAt || new Date(u.subscriptionEndsAt) > new Date())) {
          // Allow
        } else {
          return res.status(403).json({ error: 'SUBSCRIPTION_REQUIRED' });
        }
      }

      const { customerName, phone, address, invoiceNumber, date, subtotal, discount, taxAmount, grandTotal, notes, items, status, paymentMethod, paymentReference } = req.body;

      // 1. Find or create customer — ENTERPRISE: Use DB query, not full table scan
      let customerId = null;
      if (customerName) {
        const trimmedName = String(customerName).trim();
        const existingCustomers = await db.select().from(customers)
          .where(and(eq(customers.orgId, u.orgId), ilike(customers.name, trimmedName)))
          .limit(1);
        
        if (existingCustomers.length > 0) {
          customerId = existingCustomers[0].id;
        } else {
          const newCustomer = await db.insert(customers).values({
            orgId: u.orgId,
            name: trimmedName,
            phone: phone ? String(phone).trim() : null,
            address: address ? String(address).trim() : null,
          }).returning();
          customerId = newCustomer[0].id;
        }
      }

      // 2. Create invoice
      const newInvoice = await db.insert(invoices).values({
        orgId: u.orgId,
        customerId: customerId,
        createdBy: u.id,
        invoiceNumber: invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
        date: parseSafeDate(date),
        subtotal: safeNumericStr(subtotal),
        discount: safeNumericStr(discount),
        taxAmount: safeNumericStr(taxAmount),
        grandTotal: safeNumericStr(grandTotal),
        notes: notes || null,
        status: status || 'PENDING',
        paymentMethod: paymentMethod || null,
        paymentReference: paymentReference || null
      }).returning();

      // 3. Create items
      if (items && Array.isArray(items) && items.length > 0) {
        const itemValues = items.map(item => ({
          invoiceId: newInvoice[0].id,
          description: item.description || 'Item',
          quantity: safeNumericStr(item.quantity || 1),
          rate: safeNumericStr(item.rate || 0),
          amount: safeNumericStr(item.amount || 0)
        }));
        await db.insert(invoiceItems).values(itemValues);
      }

      // Decrement trial invoices if applicable
      if (u.role !== 'SUPER_ADMIN' && u.subscriptionStatus === 'TRIAL') {
        await db.update(users)
          .set({ trialInvoicesRemaining: Math.max(0, u.trialInvoicesRemaining - 1) })
          .where(eq(users.id, u.id));
      }

      res.json(newInvoice[0]);
    } catch (error: any) {
      console.error("Create invoice error:", error);
      res.status(500).json({ error: error.message || "Failed to create invoice" });
    }
  });

  app.put("/api/invoices/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const u = req.dbUser;
      if (!u.orgId) return res.status(404).json({ error: "Organization not found" });

      const invoiceId = parseInt(req.params.id);
      const { customerName, phone, address, invoiceNumber, date, subtotal, discount, taxAmount, grandTotal, notes, items, status, paymentMethod, paymentReference } = req.body;

      // SECURITY FIX (MED-02): Always filter by orgId to prevent IDOR cross-org access
      let targetInvoices: any[] = [];
      if (!isNaN(invoiceId)) {
        targetInvoices = await db.select().from(invoices).where(and(eq(invoices.id, invoiceId), eq(invoices.orgId, u.orgId)));
      }

      // If not found by numeric ID, try searching by invoiceNumber (already org-scoped)
      if (targetInvoices.length === 0 && invoiceNumber) {
        targetInvoices = await db.select().from(invoices).where(and(eq(invoices.orgId, u.orgId), eq(invoices.invoiceNumber, invoiceNumber)));
      }

      // If still not found in database, seamlessly create a new invoice!
      if (targetInvoices.length === 0) {
        let customerId = null;
        if (customerName) {
          const trimmedName = String(customerName).trim();
          const existingCustomers = await db.select().from(customers)
            .where(and(eq(customers.orgId, u.orgId), ilike(customers.name, trimmedName)))
            .limit(1);
          if (existingCustomers.length > 0) {
            customerId = existingCustomers[0].id;
          } else {
            const newCustomer = await db.insert(customers).values({
              orgId: u.orgId,
              name: trimmedName,
              phone: phone ? String(phone).trim() : null,
              address: address ? String(address).trim() : null,
            }).returning();
            customerId = newCustomer[0].id;
          }
        }

        const newInvoice = await db.insert(invoices).values({
          orgId: u.orgId,
          customerId,
          createdBy: u.id,
          invoiceNumber: invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
          date: parseSafeDate(date),
          subtotal: safeNumericStr(subtotal),
          discount: safeNumericStr(discount),
          taxAmount: safeNumericStr(taxAmount),
          grandTotal: safeNumericStr(grandTotal),
          notes: notes || null,
          status: status || 'PENDING',
          paymentMethod: paymentMethod || null,
          paymentReference: paymentReference || null
        }).returning();

        if (items && Array.isArray(items) && items.length > 0) {
          const itemValues = items.map(item => ({
            invoiceId: newInvoice[0].id,
            description: item.description || 'Item',
            quantity: safeNumericStr(item.quantity || 1),
            rate: safeNumericStr(item.rate || 0),
            amount: safeNumericStr(item.amount || 0)
          }));
          await db.insert(invoiceItems).values(itemValues);
        }

        return res.json(newInvoice[0]);
      }

      const targetInvoice = targetInvoices[0];
      if (targetInvoice.orgId !== u.orgId) {
        return res.status(403).json({ error: "Forbidden: You do not have permission to edit this invoice" });
      }

      const effectiveInvoiceId = targetInvoice.id;

      // 1. Update or create customer — ENTERPRISE: Use indexed DB query, not full table scan
      let customerId = targetInvoice.customerId;
      if (customerName) {
        const trimmedName = String(customerName).trim();
        const existingCustomers = await db.select().from(customers)
          .where(and(eq(customers.orgId, u.orgId), ilike(customers.name, trimmedName)))
          .limit(1);

        if (existingCustomers.length > 0) {
          const customer = existingCustomers[0];
          customerId = customer.id;
          if (phone !== undefined || address !== undefined) {
            await db.update(customers)
              .set({
                phone: phone !== undefined ? String(phone).trim() : customer.phone,
                address: address !== undefined ? String(address).trim() : customer.address,
                updatedAt: new Date()
              })
              .where(eq(customers.id, customer.id));
          }
        } else {
          const newCustomer = await db.insert(customers).values({
            orgId: u.orgId,
            name: trimmedName,
            phone: phone ? String(phone).trim() : null,
            address: address ? String(address).trim() : null,
          }).returning();
          customerId = newCustomer[0].id;
        }
      }

      // 2. Update invoice details
      const updatedInvoice = await db.update(invoices)
        .set({
          customerId,
          invoiceNumber: invoiceNumber || targetInvoice.invoiceNumber,
          date: parseSafeDate(date),
          subtotal: safeNumericStr(subtotal),
          discount: safeNumericStr(discount),
          taxAmount: safeNumericStr(taxAmount),
          grandTotal: safeNumericStr(grandTotal),
          notes: notes !== undefined ? notes : targetInvoice.notes,
          status: status || targetInvoice.status || 'PENDING',
          paymentMethod: paymentMethod !== undefined ? paymentMethod : targetInvoice.paymentMethod,
          paymentReference: paymentReference !== undefined ? paymentReference : targetInvoice.paymentReference,
          updatedAt: new Date()
        })
        .where(eq(invoices.id, effectiveInvoiceId))
        .returning();

      // 3. Update line items
      if (items && Array.isArray(items)) {
        await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, effectiveInvoiceId));
        if (items.length > 0) {
          const itemValues = items.map(item => ({
            invoiceId: effectiveInvoiceId,
            description: item.description || 'Item',
            quantity: safeNumericStr(item.quantity || 1),
            rate: safeNumericStr(item.rate || 0),
            amount: safeNumericStr(item.amount || 0)
          }));
          await db.insert(invoiceItems).values(itemValues);
        }
      }

      res.json(updatedInvoice[0]);
    } catch (error: any) {
      console.error("Update invoice error:", error);
      res.status(500).json({ error: error.message || "Failed to update invoice" });
    }
  });

  app.delete("/api/invoices/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const u = req.dbUser;
      if (!u.orgId) return res.status(404).json({ error: "Organization not found" });

      const invoiceId = parseInt(req.params.id);
      if (isNaN(invoiceId)) {
        return res.status(400).json({ error: "Invalid invoice ID" });
      }

      const targetInvoices = await db.select().from(invoices).where(eq(invoices.id, invoiceId));
      
      if (targetInvoices.length === 0) {
        return res.status(404).json({ error: "Invoice not found" });
      }

      const targetInvoice = targetInvoices[0];

      if (targetInvoice.orgId !== u.orgId) {
        return res.status(403).json({ error: "Forbidden: You do not have permission to delete this invoice" });
      }

      await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
      await db.delete(invoices).where(eq(invoices.id, invoiceId));

      res.json({ success: true, message: "Invoice deleted successfully" });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Failed to delete invoice' : error.message });
    }
  });

  // Onboarding endpoint
  app.post("/api/onboarding", requireAuth, async (req: AuthRequest, res) => {
    try {
      const u = req.dbUser;
      if (!u.orgId) return res.status(404).json({ error: "Organization not found" });

      // SECURITY: Whitelist allowed fields to prevent mass assignment of administrative flags
      const { companyName, address, phone, email, website, gstNo, panNo, bankName, accountNo, ifsc, upiId, invoicePrefix, invoiceLayout, footer, terms, logoUrl } = req.body;
      
      if (companyName) {
        await db.update(organizations)
          .set({ name: String(companyName).trim() })
          .where(eq(organizations.id, u.orgId));
      }

      const safeSettingData: Record<string, any> = {};
      if (address !== undefined) safeSettingData.address = address;
      if (phone !== undefined) safeSettingData.phone = phone;
      if (email !== undefined) safeSettingData.email = email;
      if (website !== undefined) safeSettingData.website = website;
      if (gstNo !== undefined) safeSettingData.gstNo = gstNo;
      if (panNo !== undefined) safeSettingData.panNo = panNo;
      if (bankName !== undefined) safeSettingData.bankName = bankName;
      if (accountNo !== undefined) safeSettingData.accountNo = accountNo;
      if (ifsc !== undefined) safeSettingData.ifsc = ifsc;
      if (upiId !== undefined) safeSettingData.upiId = upiId;
      if (invoicePrefix !== undefined) safeSettingData.invoicePrefix = invoicePrefix;
      if (invoiceLayout !== undefined) safeSettingData.invoiceLayout = invoiceLayout;
      if (footer !== undefined) safeSettingData.footer = footer;
      if (terms !== undefined) safeSettingData.terms = terms;
      if (logoUrl !== undefined) safeSettingData.logoUrl = logoUrl;

      if (Object.keys(safeSettingData).length > 0) {
        await db.update(companySettings)
          .set({
            ...safeSettingData,
            updatedAt: new Date()
          })
          .where(eq(companySettings.orgId, u.orgId));
      }
        
      await db.update(users)
        .set({ onboardingCompleted: true })
        .where(eq(users.id, u.id));

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Failed to complete onboarding' : error.message });
    }
  });

  // Payment Submit endpoint
  app.post("/api/payments/submit", requireAuth, async (req: AuthRequest, res) => {
    try {
      const u = req.dbUser;
      if (!u.orgId) return res.status(404).json({ error: "Organization not found" });
      
      const { screenshotUrl } = req.body;
      if (!screenshotUrl) return res.status(400).json({ error: "Screenshot is required" });

      const newPayment = await db.insert(payments)
        .values({
          userId: u.id,
          orgId: u.orgId,
          amount: '499',
          screenshotUrl,
          status: 'PENDING'
        }).returning();

      await db.update(users)
        .set({ subscriptionStatus: 'PENDING_VERIFICATION' })
        .where(eq(users.id, u.id));

      res.json(newPayment[0]);
    } catch (error: any) {
      
      res.status(500).json({ error: error.message });
    }
  });

  // Admin Pending Payments endpoint
  app.get("/api/admin/payments/pending", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (req.dbUser.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: "Forbidden: Super Admin only" });
      }
      
      const pendingPayments = await db.query.payments.findMany({
        where: eq(payments.status, 'PENDING'),
        with: {
          user: true
        },
        orderBy: [desc(payments.submittedAt)]
      });
      
      res.json(pendingPayments);
    } catch (error: any) {
      
      res.status(500).json({ error: error.message });
    }
  });

  // Admin Approve Payment
  app.post("/api/admin/payments/:id/approve", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (req.dbUser.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: "Forbidden: Super Admin only" });
      }
      
      const paymentId = parseInt(req.params.id);
      const targetPayments = await db.select().from(payments).where(eq(payments.id, paymentId));
      if (targetPayments.length === 0) return res.status(404).json({ error: "Payment not found" });
      const payment = targetPayments[0];

      await db.update(payments)
        .set({ status: 'APPROVED', verifiedAt: new Date(), verifiedBy: req.dbUser.id })
        .where(eq(payments.id, paymentId));

      const endsAt = new Date();
      endsAt.setDate(endsAt.getDate() + 31);

      const updatedUserResult = await db.update(users)
        .set({ subscriptionStatus: 'ACTIVE', subscriptionStartAt: new Date(), subscriptionEndsAt: endsAt })
        .where(eq(users.id, payment.userId))
        .returning();

      res.json({ payment: payment, user: updatedUserResult[0] });
    } catch (error: any) {
      
      res.status(500).json({ error: error.message });
    }
  });

  
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

      const updatePayload: any = { hasCustomLayoutAccess: true };
      if (req.body.invoiceLayout) {
        updatePayload.invoiceLayout = typeof req.body.invoiceLayout === 'string' 
          ? req.body.invoiceLayout 
          : JSON.stringify(req.body.invoiceLayout);
      }

      await db.update(companySettings)
        .set(updatePayload)
        .where(eq(companySettings.orgId, request.orgId));

      res.json({ success: true, orgId: request.orgId });
    } catch (error: any) {
      console.error("Approve custom layout error:", error);
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

  // Admin Reject Payment
  app.post("/api/admin/payments/:id/reject", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (req.dbUser.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: "Forbidden: Super Admin only" });
      }
      
      const paymentId = parseInt(req.params.id);
      const { note } = req.body;
      
      const targetPayments = await db.select().from(payments).where(eq(payments.id, paymentId));
      if (targetPayments.length === 0) return res.status(404).json({ error: "Payment not found" });
      const payment = targetPayments[0];

      await db.update(payments)
        .set({ status: 'REJECTED', verifiedAt: new Date(), verifiedBy: req.dbUser.id, note })
        .where(eq(payments.id, paymentId));

      // Decide what state to put the user back into.
      const targetUserResult = await db.select().from(users).where(eq(users.id, payment.userId));
      const targetUser = targetUserResult[0];
      
      let nextStatus = 'EXPIRED';
      if (!targetUser.subscriptionStartAt) {
          nextStatus = 'TRIAL';
      }

      const updatedUserResult = await db.update(users)
        .set({ subscriptionStatus: nextStatus })
        .where(eq(users.id, payment.userId))
        .returning();

      res.json({ payment: payment, user: updatedUserResult[0] });
    } catch (error: any) {
      
      res.status(500).json({ error: error.message });
    }
  });
  app.use((err, req, res, next) => {
    console.error("Global Error Handler:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  });

// Global error handler
  // Vite middleware for development (only when not on Vercel)
if (!process.env.VERCEL) {
  async function startServer() {
    if (process.env.NODE_ENV !== "production") {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }

  startServer();
}

export default app;
