import dotenv from "dotenv";
dotenv.config();
dotenv.config({ path: ".env.local" });

import express from "express";
import path from "path";
import { requireAuth, AuthRequest } from "./src/middleware/auth.ts";
import { db } from "./src/db/index.ts";
import { organizations, users, companySettings, customers, invoices, invoiceItems, payments, customLayoutRequests } from "./src/db/schema.ts";
import { eq, desc } from "drizzle-orm";
import { GoogleGenAI } from "@google/genai";
import multer from "multer";
import fs from "fs";

// Initialize Gemini API for AI Extraction
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "dummy_key_if_missing" });
const upload = multer({ storage: multer.memoryStorage() });

export const app = express();
const PORT = 3000;
  
  app.use(express.json({ limit: '10mb' }));

  // API Routes
  
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
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
      
      res.json({
        ...setting,
        companyName: org?.name
      });
    } catch (error: any) {
      
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/settings", requireAuth, async (req: AuthRequest, res) => {
    try {
      const u = req.dbUser;
      if (!u.orgId) {
        return res.status(404).json({ error: "Organization not found" });
      }

      const { companyName, ...settingData } = req.body;

      if (companyName) {
        await db.update(organizations)
          .set({ name: companyName })
          .where(eq(organizations.id, u.orgId));
      }

      const updatedSettings = await db.update(companySettings)
        .set(settingData)
        .where(eq(companySettings.orgId, u.orgId))
        .returning();

      res.json(updatedSettings[0]);
    } catch (error: any) {
      
      res.status(500).json({ error: error.message });
    }
  });

  // Admin Routes
  app.get("/api/admin/users", requireAuth, async (req: AuthRequest, res) => {
    try {
      const u = req.dbUser;
      if (u.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: "Forbidden: Super Admin only" });
      }
      
      const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
      res.json(allUsers);
    } catch (error: any) {
      
      res.status(500).json({ error: error.message });
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
        
      res.json(updatedUser[0]);
    } catch (error: any) {
      
      res.status(500).json({ error: error.message });
    }
  });

  // OCR & Extraction Route
  app.post("/api/extract", requireAuth, upload.single('file'), async (req: AuthRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      const base64Image = req.file.buffer.toString("base64");
      
      let response;
      const promptParts = [
        {
          inlineData: {
            mimeType: req.file.mimetype,
            data: base64Image,
          }
        },
        {
          text: `Extract the details from this handwritten or printed bill/invoice into structured JSON format.
          
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
          
          Respond ONLY with valid JSON. No markdown tags. Do your best to transcribe the handwriting.`
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
          response = await ai.models.generateContent({
            model: modelName,
            contents: [{ role: "user", parts: promptParts }],
            config: modelConfig
          });
          if (response && response.text) {
            console.log(`Successfully generated OCR content using model: ${modelName}`);
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
      console.error("Extraction error:", error);
      res.status(500).json({ error: error.message || "Failed to extract data" });
    }
  });


  // Invoices Routes
  
  app.get("/api/dashboard", requireAuth, async (req: AuthRequest, res) => {
    try {
      const u = req.dbUser;
      if (!u.orgId) return res.status(404).json({ error: "Organization not found" });

      const allInvoices = await db.query.invoices.findMany({
        where: eq(invoices.orgId, u.orgId),
        with: { customer: true },
        orderBy: [desc(invoices.createdAt)]
      });
      
      const allCustomers = await db.query.customers.findMany({
        where: eq(customers.orgId, u.orgId)
      });

      const today = new Date();
      today.setHours(0,0,0,0);

      const todayInvoices = allInvoices.filter(i => new Date(i.date || i.createdAt) >= today);
      const todaysRevenue = todayInvoices.reduce((sum, inv) => sum + Number(inv.grandTotal || 0), 0);
      
      const last7Days = Array.from({length: 7}).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d;
      });

      const chartData = last7Days.map(date => {
        const dayStart = new Date(date);
        dayStart.setHours(0,0,0,0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23,59,59,999);
        
        const dayInvoices = allInvoices.filter(i => {
          const cd = new Date(i.date || i.createdAt);
          return cd >= dayStart && cd <= dayEnd;
        });
        
        const total = dayInvoices.reduce((sum, inv) => sum + Number(inv.grandTotal || 0), 0);
        
        return {
          name: date.toLocaleDateString('en-US', { weekday: 'short' }),
          total
        };
      });

      const recentActivity = allInvoices.slice(0, 5).map(inv => ({
        type: 'success',
        title: `Invoice ${inv.invoiceNumber} created for ${inv.customer?.name || 'Unknown'}`,
        time: new Date(inv.createdAt).toLocaleString()
      }));

      res.json({
        todaysRevenue,
        billsGenerated: todayInvoices.length,
        totalCustomers: allCustomers.length,
        chartData,
        recentActivity
      });
    } catch (error) {
      console.error(error);
      
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/invoices", requireAuth, async (req: AuthRequest, res) => {
    try {
      const u = req.dbUser;
      if (!u.orgId) return res.status(404).json({ error: "Organization not found" });

      const orgInvoices = await db.query.invoices.findMany({
        where: eq(invoices.orgId, u.orgId),
        with: {
          customer: true,
          items: true
        },
        orderBy: [desc(invoices.createdAt)]
      });
      res.json(orgInvoices);
    } catch (error) {
      console.error(error);
      
      res.status(500).json({ error: error.message });
    }
  });

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

      // 1. Find or create customer
      let customerId = null;
      if (customerName) {
        const existingCustomers = await db.select().from(customers).where(eq(customers.orgId, u.orgId));
        const customer = existingCustomers.find(c => c.name.toLowerCase() === customerName.toLowerCase());
        
        if (customer) {
          customerId = customer.id;
        } else {
          const newCustomer = await db.insert(customers).values({
            orgId: u.orgId,
            name: customerName,
            phone: phone || null,
            address: address || null,
          }).returning();
          customerId = newCustomer[0].id;
        }
      }

      // 2. Create invoice
      const newInvoice = await db.insert(invoices).values({
        orgId: u.orgId,
        customerId: customerId,
        createdBy: u.id,
        invoiceNumber: invoiceNumber || `INV-${Date.now()}`,
        date: date ? new Date(date) : new Date(),
        subtotal: String(subtotal || 0),
        discount: String(discount || 0),
        taxAmount: String(taxAmount || 0),
        grandTotal: String(grandTotal || 0),
        notes: notes || null,
        status: status || 'PENDING',
        paymentMethod: paymentMethod || null,
        paymentReference: paymentReference || null
      }).returning();

      // 3. Create items
      if (items && items.length > 0) {
        const itemValues = items.map(item => ({
          invoiceId: newInvoice[0].id,
          description: item.description || '',
          quantity: String(item.quantity || 1),
          rate: String(item.rate || 0),
          amount: String(item.amount || 0)
        }));
        await db.insert(invoiceItems).values(itemValues);
      }

      // Decrement trial invoices if applicable
      if (u.role !== 'SUPER_ADMIN' && u.subscriptionStatus === 'TRIAL') {
        await db.update(users)
          .set({ trialInvoicesRemaining: u.trialInvoicesRemaining - 1 })
          .where(eq(users.id, u.id));
      }

      res.json(newInvoice[0]);
    } catch (error) {
      console.error(error);
      
      res.status(500).json({ error: error.message });
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
      
      res.status(500).json({ error: error.message });
    }
  });


  

  // Onboarding endpoint
  app.post("/api/onboarding", requireAuth, async (req: AuthRequest, res) => {
    try {
      const u = req.dbUser;
      if (!u.orgId) return res.status(404).json({ error: "Organization not found" });

      const { companyName, ...settingData } = req.body;
      
      if (companyName) {
        await db.update(organizations)
          .set({ name: companyName })
          .where(eq(organizations.id, u.orgId));
      }

      if (Object.keys(settingData).length > 0) {
        await db.update(companySettings)
          .set(settingData)
          .where(eq(companySettings.orgId, u.orgId));
      }
        
      await db.update(users)
        .set({ onboardingCompleted: true })
        .where(eq(users.id, u.id));

      res.json({ success: true });
    } catch (error: any) {
      
      res.status(500).json({ error: error.message });
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
