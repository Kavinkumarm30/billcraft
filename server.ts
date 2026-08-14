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

      const targetUsers = await db.select().from(users).where(eq(users.id, targetUserId));
      if (targetUsers.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const targetUser = targetUsers[0];
      if (targetUser.orgId !== u.orgId && u.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: "Forbidden: User belongs to another organization" });
      }

      const { role, canReadInvoices, canWriteInvoices, canCustomizeLayout, canManageCustomers, isActive } = req.body;

      const updatedUser = await db.update(users)
        .set({
          role: role !== undefined ? role : targetUser.role,
          canReadInvoices: canReadInvoices !== undefined ? Boolean(canReadInvoices) : targetUser.canReadInvoices,
          canWriteInvoices: canWriteInvoices !== undefined ? Boolean(canWriteInvoices) : targetUser.canWriteInvoices,
          canCustomizeLayout: canCustomizeLayout !== undefined ? Boolean(canCustomizeLayout) : targetUser.canCustomizeLayout,
          canManageCustomers: canManageCustomers !== undefined ? Boolean(canManageCustomers) : targetUser.canManageCustomers,
          isActive: isActive !== undefined ? Boolean(isActive) : targetUser.isActive,
          updatedAt: new Date(),
        })
        .where(eq(users.id, targetUserId))
        .returning();

      res.json(updatedUser[0]);
    } catch (error: any) {
      console.error("Update permissions error:", error);
      res.status(500).json({ error: error.message || "Failed to update permissions" });
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

      // 1. Find or create customer
      let customerId = null;
      if (customerName) {
        const existingCustomers = await db.select().from(customers).where(eq(customers.orgId, u.orgId));
        const customer = existingCustomers.find(c => c.name.toLowerCase() === String(customerName).trim().toLowerCase());
        
        if (customer) {
          customerId = customer.id;
        } else {
          const newCustomer = await db.insert(customers).values({
            orgId: u.orgId,
            name: String(customerName).trim(),
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

      let targetInvoices: any[] = [];
      if (!isNaN(invoiceId)) {
        targetInvoices = await db.select().from(invoices).where(eq(invoices.id, invoiceId));
      }

      // If not found by numeric ID, try searching by invoiceNumber
      if (targetInvoices.length === 0 && invoiceNumber) {
        targetInvoices = await db.select().from(invoices).where(and(eq(invoices.orgId, u.orgId), eq(invoices.invoiceNumber, invoiceNumber)));
      }

      // If still not found in database, seamlessly create a new invoice!
      if (targetInvoices.length === 0) {
        let customerId = null;
        if (customerName) {
          const existingCustomers = await db.select().from(customers).where(eq(customers.orgId, u.orgId));
          const customer = existingCustomers.find(c => c.name.toLowerCase() === String(customerName).trim().toLowerCase());
          if (customer) {
            customerId = customer.id;
          } else {
            const newCustomer = await db.insert(customers).values({
              orgId: u.orgId,
              name: String(customerName).trim(),
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

      // 1. Update or create customer
      let customerId = targetInvoice.customerId;
      if (customerName) {
        const existingCustomers = await db.select().from(customers).where(eq(customers.orgId, u.orgId));
        const customer = existingCustomers.find(c => c.name.toLowerCase() === String(customerName).trim().toLowerCase());
        if (customer) {
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
            name: String(customerName).trim(),
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
      
      res.status(500).json({ error: error.message });
    }
  });


  

  // Settings endpoints
  app.get("/api/settings", requireAuth, async (req: AuthRequest, res) => {
    try {
      const u = req.dbUser;
      if (!u.orgId) return res.status(404).json({ error: "Organization not found" });

      const orgs = await db.select().from(organizations).where(eq(organizations.id, u.orgId));
      let settingsList = await db.select().from(companySettings).where(eq(companySettings.orgId, u.orgId));

      if (settingsList.length === 0) {
        const newSettings = await db.insert(companySettings).values({
          orgId: u.orgId,
          invoiceLayout: 'standard'
        }).returning();
        settingsList = newSettings;
      }

      const org = orgs[0] || { name: 'My Company' };
      const currentSettings = settingsList[0];

      res.json({
        companyName: org.name || 'My Company',
        ...currentSettings
      });
    } catch (error: any) {
      console.error("Fetch settings error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/settings", requireAuth, async (req: AuthRequest, res) => {
    try {
      const u = req.dbUser;
      if (!u.orgId) return res.status(404).json({ error: "Organization not found" });

      const { companyName, ...settingData } = req.body;

      if (companyName) {
        await db.update(organizations)
          .set({ name: companyName, updatedAt: new Date() })
          .where(eq(organizations.id, u.orgId));
      }

      const existingSettings = await db.select().from(companySettings).where(eq(companySettings.orgId, u.orgId));
      
      let updatedSettings;
      if (existingSettings.length === 0) {
        updatedSettings = await db.insert(companySettings).values({
          orgId: u.orgId,
          ...settingData,
        }).returning();
      } else {
        updatedSettings = await db.update(companySettings)
          .set({
            ...settingData,
            updatedAt: new Date()
          })
          .where(eq(companySettings.orgId, u.orgId))
          .returning();
      }

      res.json({
        companyName: companyName || (await db.select().from(organizations).where(eq(organizations.id, u.orgId)))[0]?.name,
        ...updatedSettings[0]
      });
    } catch (error: any) {
      console.error("Update settings error:", error);
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
