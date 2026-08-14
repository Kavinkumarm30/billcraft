var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server.ts
import dotenv2 from "dotenv";
import express from "express";
import path from "path";

// src/lib/firebase-admin.ts
import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

// firebase-applet-config.json
var firebase_applet_config_default = {
  projectId: "billcraft-8c8c2",
  appId: "1:515512743607:web:33810c637d9d76465a7f32",
  apiKey: "AIzaSyDHLIKwj0-TuQ5xE7MdbjT3ib7DDfqCf_c",
  authDomain: "billcraft-8c8c2.firebaseapp.com",
  storageBucket: "billcraft-8c8c2.firebasestorage.app",
  messagingSenderId: "515512743607",
  measurementId: "G-245T5B3B68"
};

// src/lib/firebase-admin.ts
if (!getApps().length) {
  initializeApp({
    projectId: firebase_applet_config_default.projectId || process.env.FIREBASE_PROJECT_ID || "billcraft-8c8c2"
  });
}
var adminAuth = getAuth();

// src/db/index.ts
import * as dotenv from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// src/db/schema.ts
var schema_exports = {};
__export(schema_exports, {
  companySettings: () => companySettings,
  customLayoutRequests: () => customLayoutRequests,
  customLayoutRequestsRelations: () => customLayoutRequestsRelations,
  customers: () => customers,
  customersRelations: () => customersRelations,
  invoiceItems: () => invoiceItems,
  invoiceItemsRelations: () => invoiceItemsRelations,
  invoices: () => invoices,
  invoicesRelations: () => invoicesRelations,
  organizations: () => organizations,
  organizationsRelations: () => organizationsRelations,
  payments: () => payments,
  paymentsRelations: () => paymentsRelations,
  users: () => users,
  usersRelations: () => usersRelations
});
import { relations } from "drizzle-orm";
import { integer, pgTable, serial, text, timestamp, boolean, numeric } from "drizzle-orm/pg-core";
var organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  uid: text("uid").notNull().unique(),
  // Firebase Auth UID
  email: text("email").notNull(),
  name: text("name"),
  phone: text("phone"),
  role: text("role").notNull().default("EMPLOYEE"),
  // SUPER_ADMIN, ADMIN, EMPLOYEE
  canReadInvoices: boolean("can_read_invoices").notNull().default(true),
  canWriteInvoices: boolean("can_write_invoices").notNull().default(true),
  canCustomizeLayout: boolean("can_customize_layout").notNull().default(true),
  canManageCustomers: boolean("can_manage_customers").notNull().default(true),
  isActive: boolean("is_active").notNull().default(true),
  orgId: integer("org_id").references(() => organizations.id),
  subscriptionStatus: text("subscription_status").notNull().default("TRIAL"),
  // TRIAL, PENDING_VERIFICATION, ACTIVE, EXPIRED, REJECTED
  trialInvoicesRemaining: integer("trial_invoices_remaining").notNull().default(3),
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
  subscriptionStartAt: timestamp("subscription_start_at"),
  subscriptionEndsAt: timestamp("subscription_ends_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var companySettings = pgTable("company_settings", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").references(() => organizations.id).notNull().unique(),
  logoUrl: text("logo_url"),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  gstNo: text("gst_no"),
  panNo: text("pan_no"),
  bankName: text("bank_name"),
  accountNo: text("account_no"),
  ifsc: text("ifsc"),
  upiId: text("upi_id"),
  invoicePrefix: text("invoice_prefix").default("INV-"),
  invoiceLayout: text("invoice_layout").default("standard"),
  hasCustomLayoutAccess: boolean("has_custom_layout_access").notNull().default(false),
  footer: text("footer"),
  terms: text("terms"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").references(() => organizations.id).notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  gstNo: text("gst_no"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").references(() => organizations.id).notNull(),
  customerId: integer("customer_id").references(() => customers.id),
  createdBy: integer("created_by").references(() => users.id),
  invoiceNumber: text("invoice_number").notNull(),
  date: timestamp("date").notNull().defaultNow(),
  subtotal: numeric("subtotal").notNull().default("0"),
  discount: numeric("discount").notNull().default("0"),
  taxAmount: numeric("tax_amount").notNull().default("0"),
  // GST, CGST, SGST total
  grandTotal: numeric("grand_total").notNull().default("0"),
  notes: text("notes"),
  status: text("status").notNull().default("PENDING"),
  // PENDING, PAID, CANCELLED
  paymentMethod: text("payment_method"),
  paymentReference: text("payment_reference"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var invoiceItems = pgTable("invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").references(() => invoices.id).notNull(),
  description: text("description").notNull(),
  quantity: numeric("quantity").notNull().default("1"),
  unit: text("unit").default("pcs"),
  rate: numeric("rate").notNull().default("0"),
  amount: numeric("amount").notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var organizationsRelations = relations(organizations, ({ many, one }) => ({
  users: many(users),
  settings: one(companySettings, {
    fields: [organizations.id],
    references: [companySettings.orgId]
  }),
  customers: many(customers),
  invoices: many(invoices),
  payments: many(payments)
}));
var usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.orgId],
    references: [organizations.id]
  }),
  invoices: many(invoices),
  payments: many(payments)
}));
var customersRelations = relations(customers, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [customers.orgId],
    references: [organizations.id]
  }),
  invoices: many(invoices)
}));
var invoicesRelations = relations(invoices, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [invoices.orgId],
    references: [organizations.id]
  }),
  customer: one(customers, {
    fields: [invoices.customerId],
    references: [customers.id]
  }),
  creator: one(users, {
    fields: [invoices.createdBy],
    references: [users.id]
  }),
  items: many(invoiceItems)
}));
var invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id]
  })
}));
var payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  orgId: integer("org_id").references(() => organizations.id).notNull(),
  amount: numeric("amount").notNull().default("499"),
  screenshotUrl: text("screenshot_url").notNull(),
  // base64 data URL
  status: text("status").notNull().default("PENDING"),
  // PENDING, APPROVED, REJECTED
  submittedAt: timestamp("submitted_at").defaultNow(),
  verifiedAt: timestamp("verified_at"),
  verifiedBy: integer("verified_by").references(() => users.id),
  note: text("note")
});
var paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id]
  }),
  verifier: one(users, {
    fields: [payments.verifiedBy],
    references: [users.id]
  }),
  organization: one(organizations, {
    fields: [payments.orgId],
    references: [organizations.id]
  })
}));
var customLayoutRequests = pgTable("custom_layout_requests", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").references(() => organizations.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  fileUrl: text("file_url").notNull(),
  status: text("status").notNull().default("PENDING"),
  // PENDING, APPROVED, REJECTED
  submittedAt: timestamp("submitted_at").defaultNow(),
  verifiedAt: timestamp("verified_at"),
  note: text("note")
});
var customLayoutRequestsRelations = relations(customLayoutRequests, ({ one }) => ({
  user: one(users, {
    fields: [customLayoutRequests.userId],
    references: [users.id]
  }),
  organization: one(organizations, {
    fields: [customLayoutRequests.orgId],
    references: [organizations.id]
  })
}));

// src/db/index.ts
dotenv.config();
dotenv.config({ path: ".env.local" });
var createPool = () => {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (connectionString) {
    return new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 15e3
    });
  }
  const sqlHost = process.env.SQL_HOST;
  const sqlUser = process.env.SQL_USER;
  const sqlPassword = process.env.SQL_PASSWORD;
  const sqlDbName = process.env.SQL_DB_NAME || "postgres";
  const sqlPort = process.env.SQL_PORT ? parseInt(process.env.SQL_PORT) : 5432;
  const isSsl = process.env.SQL_SSL === "true" || (sqlHost ? sqlHost.includes("supabase") : false);
  if (!sqlHost || !sqlPassword) {
    console.warn("\u26A0\uFE0F Warning: PostgreSQL environment variables (SQL_HOST, SQL_PASSWORD) are not set. Please configure them in your environment settings.");
  }
  return new Pool({
    host: sqlHost,
    port: sqlPort,
    user: sqlUser,
    password: sqlPassword,
    database: sqlDbName,
    ssl: isSsl ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 15e3
  });
};
var pool = createPool();
pool.on("error", (err) => {
  console.error("Unexpected error on idle SQL pool client:", err);
});
var db = drizzle(pool, { schema: schema_exports });

// src/db/users.ts
import { eq } from "drizzle-orm";
async function getOrCreateUser(uid, email) {
  try {
    const isSuperAdminEmail = email === "kavinkumar.m30@gmail.com" || email === "kavin18072005@gmail.com";
    const existingUsers = await db.select().from(users).where(eq(users.uid, uid));
    let user = existingUsers[0];
    if (user) {
      if (isSuperAdminEmail || user.role === "SUPER_ADMIN") {
        const updated = await db.update(users).set({
          role: "SUPER_ADMIN",
          subscriptionStatus: "ACTIVE",
          trialInvoicesRemaining: 999999,
          email: email || user.email,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq(users.id, user.id)).returning();
        if (updated.length > 0) {
          user = updated[0];
        }
      } else if (email && user.email !== email) {
        const updated = await db.update(users).set({ email, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, user.id)).returning();
        if (updated.length > 0) {
          user = updated[0];
        }
      }
    } else {
      const role = isSuperAdminEmail ? "SUPER_ADMIN" : "EMPLOYEE";
      const subscriptionStatus = isSuperAdminEmail ? "ACTIVE" : "TRIAL";
      const trialInvoicesRemaining = isSuperAdminEmail ? 999999 : 3;
      const result = await db.insert(users).values({
        uid,
        email: email || `${uid}@user.com`,
        role,
        subscriptionStatus,
        trialInvoicesRemaining,
        onboardingCompleted: true
      }).returning();
      user = result[0];
    }
    if (!user.orgId) {
      const orgResult = await db.insert(organizations).values({
        name: "My Company"
      }).returning();
      const org = orgResult[0];
      await db.insert(companySettings).values({
        orgId: org.id,
        logoUrl: "",
        address: "123 Design Avenue, Creative Dist.",
        phone: "+1 234-567-8901",
        email: email || "",
        gstNo: "27AABCU9603R1ZN"
      });
      const updatedUserResult = await db.update(users).set({ orgId: org.id }).where(eq(users.id, user.id)).returning();
      return updatedUserResult[0];
    }
    return user;
  } catch (error) {
    console.error("Error in getOrCreateUser:", error);
    throw error;
  }
}

// src/middleware/auth.ts
import { eq as eq2 } from "drizzle-orm";
var requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing token" });
  }
  const token = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    let dbUser = await getOrCreateUser(decodedToken.uid, decodedToken.email || "");
    if (dbUser.role !== "SUPER_ADMIN") {
      if (dbUser.subscriptionStatus === "ACTIVE" && dbUser.subscriptionEndsAt) {
        if (new Date(dbUser.subscriptionEndsAt) < /* @__PURE__ */ new Date()) {
          const updatedUserResult = await db.update(users).set({ subscriptionStatus: "EXPIRED" }).where(eq2(users.id, dbUser.id)).returning();
          if (updatedUserResult.length > 0) {
            dbUser = updatedUserResult[0];
          }
        }
      }
    }
    if (!dbUser.isActive) {
      return res.status(403).json({ error: "Access revoked" });
    }
    req.dbUser = dbUser;
    next();
  } catch (error) {
    console.error("Error verifying Firebase ID token:", error);
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};

// server.ts
import { eq as eq3, desc, and } from "drizzle-orm";
import { GoogleGenAI } from "@google/genai";
import multer from "multer";
dotenv2.config();
dotenv2.config({ path: ".env.local" });
var ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "dummy_key_if_missing" });
var upload = multer({ storage: multer.memoryStorage() });
var app = express();
var PORT = 3e3;
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});
app.use(express.json({ limit: "10mb" }));
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});
app.get("/api/me", requireAuth, async (req, res) => {
  try {
    const u = req.dbUser;
    res.json(u);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/settings", requireAuth, async (req, res) => {
  try {
    const u = req.dbUser;
    if (!u.orgId) {
      return res.status(404).json({ error: "Organization not found" });
    }
    const orgs = await db.select().from(organizations).where(eq3(organizations.id, u.orgId));
    const org = orgs[0];
    const settings = await db.select().from(companySettings).where(eq3(companySettings.orgId, u.orgId));
    const setting = settings[0];
    res.json({
      ...setting,
      companyName: org?.name
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.put("/api/settings", requireAuth, async (req, res) => {
  try {
    const u = req.dbUser;
    if (!u.orgId) {
      return res.status(404).json({ error: "Organization not found" });
    }
    const { companyName, ...settingData } = req.body;
    if (companyName) {
      await db.update(organizations).set({ name: companyName }).where(eq3(organizations.id, u.orgId));
    }
    const updatedSettings = await db.update(companySettings).set(settingData).where(eq3(companySettings.orgId, u.orgId)).returning();
    res.json(updatedSettings[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/admin/users", requireAuth, async (req, res) => {
  try {
    const u = req.dbUser;
    if (u.role !== "SUPER_ADMIN") {
      return res.status(403).json({ error: "Forbidden: Super Admin only" });
    }
    const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
    res.json(allUsers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post("/api/admin/users/:id/toggle", requireAuth, async (req, res) => {
  try {
    const u = req.dbUser;
    if (u.role !== "SUPER_ADMIN") {
      return res.status(403).json({ error: "Forbidden: Super Admin only" });
    }
    const userId = parseInt(req.params.id);
    const targetUsers = await db.select().from(users).where(eq3(users.id, userId));
    if (targetUsers.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const targetUser = targetUsers[0];
    const updatedUser = await db.update(users).set({ isActive: !targetUser.isActive }).where(eq3(users.id, userId)).returning();
    res.json(updatedUser[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post("/api/extract", requireAuth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const base64Image = req.file.buffer.toString("base64");
    const promptParts = [
      {
        inlineData: {
          mimeType: req.file.mimetype,
          data: base64Image
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
      responseMimeType: "application/json"
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
      } catch (err) {
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
    resultText = resultText.replace(/^\s*```(json)?/i, "").replace(/```\s*$/, "").trim();
    const parsedData = JSON.parse(resultText);
    res.json(parsedData);
  } catch (error) {
    console.error("Extraction error:", error);
    res.status(500).json({ error: error.message || "Failed to extract data" });
  }
});
app.get("/api/custom-layout-requests", requireAuth, async (req, res) => {
  try {
    const u = req.dbUser;
    if (!u.orgId) return res.status(404).json({ error: "Organization not found" });
    const requests = await db.select().from(customLayoutRequests).where(eq3(customLayoutRequests.orgId, u.orgId)).orderBy(desc(customLayoutRequests.submittedAt));
    res.json(requests);
  } catch (error) {
    console.error("Fetch custom layout requests error:", error);
    res.status(500).json({ error: error.message });
  }
});
app.post("/api/custom-layout-requests", requireAuth, upload.single("file"), async (req, res) => {
  try {
    const u = req.dbUser;
    if (!u.orgId) return res.status(404).json({ error: "Organization not found" });
    let fileUrl = "";
    if (req.file) {
      fileUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
    } else if (req.body.fileUrl) {
      fileUrl = req.body.fileUrl;
    }
    if (!fileUrl) {
      return res.status(400).json({ error: "Please upload an invoice design file or image" });
    }
    const newRequest = await db.insert(customLayoutRequests).values({
      orgId: u.orgId,
      userId: u.id,
      fileUrl,
      note: req.body.note || "Custom layout design request",
      status: "PENDING",
      submittedAt: /* @__PURE__ */ new Date()
    }).returning();
    res.json(newRequest[0]);
  } catch (error) {
    console.error("Submit custom layout request error:", error);
    res.status(500).json({ error: error.message || "Failed to submit request" });
  }
});
app.get("/api/team", requireAuth, async (req, res) => {
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
      createdAt: users.createdAt
    }).from(users).where(eq3(users.orgId, u.orgId));
    res.json(teamMembers);
  } catch (error) {
    console.error("Fetch team error:", error);
    res.status(500).json({ error: error.message });
  }
});
app.put("/api/team/:id/permissions", requireAuth, async (req, res) => {
  try {
    const u = req.dbUser;
    if (!u.orgId) return res.status(404).json({ error: "Organization not found" });
    if (u.role !== "SUPER_ADMIN" && u.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden: Only admins can manage team permissions" });
    }
    const targetUserId = parseInt(req.params.id);
    if (isNaN(targetUserId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    const targetUsers = await db.select().from(users).where(eq3(users.id, targetUserId));
    if (targetUsers.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const targetUser = targetUsers[0];
    if (targetUser.orgId !== u.orgId && u.role !== "SUPER_ADMIN") {
      return res.status(403).json({ error: "Forbidden: User belongs to another organization" });
    }
    const { role, canReadInvoices, canWriteInvoices, canCustomizeLayout, canManageCustomers, isActive } = req.body;
    const updatedUser = await db.update(users).set({
      role: role !== void 0 ? role : targetUser.role,
      canReadInvoices: canReadInvoices !== void 0 ? Boolean(canReadInvoices) : targetUser.canReadInvoices,
      canWriteInvoices: canWriteInvoices !== void 0 ? Boolean(canWriteInvoices) : targetUser.canWriteInvoices,
      canCustomizeLayout: canCustomizeLayout !== void 0 ? Boolean(canCustomizeLayout) : targetUser.canCustomizeLayout,
      canManageCustomers: canManageCustomers !== void 0 ? Boolean(canManageCustomers) : targetUser.canManageCustomers,
      isActive: isActive !== void 0 ? Boolean(isActive) : targetUser.isActive,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq3(users.id, targetUserId)).returning();
    res.json(updatedUser[0]);
  } catch (error) {
    console.error("Update permissions error:", error);
    res.status(500).json({ error: error.message || "Failed to update permissions" });
  }
});
app.get("/api/dashboard", requireAuth, async (req, res) => {
  try {
    const u = req.dbUser;
    if (!u.orgId) return res.status(404).json({ error: "Organization not found" });
    const allInvoices = await db.query.invoices.findMany({
      where: eq3(invoices.orgId, u.orgId),
      with: { customer: true },
      orderBy: [desc(invoices.createdAt)]
    });
    const allCustomers = await db.query.customers.findMany({
      where: eq3(customers.orgId, u.orgId)
    });
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    const todayInvoices = allInvoices.filter((i) => new Date(i.date || i.createdAt) >= today);
    const todaysRevenue = todayInvoices.reduce((sum, inv) => sum + Number(inv.grandTotal || 0), 0);
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = /* @__PURE__ */ new Date();
      d.setDate(d.getDate() - (6 - i));
      return d;
    });
    const chartData = last7Days.map((date) => {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      const dayInvoices = allInvoices.filter((i) => {
        const cd = new Date(i.date || i.createdAt);
        return cd >= dayStart && cd <= dayEnd;
      });
      const total = dayInvoices.reduce((sum, inv) => sum + Number(inv.grandTotal || 0), 0);
      return {
        name: date.toLocaleDateString("en-US", { weekday: "short" }),
        total
      };
    });
    const recentActivity = allInvoices.slice(0, 5).map((inv) => ({
      type: "success",
      title: `Invoice ${inv.invoiceNumber} created for ${inv.customer?.name || "Unknown"}`,
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
app.get("/api/invoices", requireAuth, async (req, res) => {
  try {
    const u = req.dbUser;
    if (!u.orgId) return res.status(404).json({ error: "Organization not found" });
    const orgInvoices = await db.query.invoices.findMany({
      where: eq3(invoices.orgId, u.orgId),
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
var parseSafeDate = (d) => {
  if (!d) return /* @__PURE__ */ new Date();
  if (d instanceof Date && !isNaN(d.getTime())) return d;
  if (typeof d === "string") {
    const dt = new Date(d);
    if (!isNaN(dt.getTime())) return dt;
    if (d.includes("/")) {
      const parts = d.split("/");
      if (parts.length === 3) {
        const d1 = /* @__PURE__ */ new Date(`${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`);
        if (!isNaN(d1.getTime())) return d1;
      }
    }
  }
  return /* @__PURE__ */ new Date();
};
var safeNumericStr = (val) => {
  if (val === void 0 || val === null || val === "") return "0";
  const clean = String(val).replace(/[^0-9.-]+/g, "");
  const num = parseFloat(clean);
  return isNaN(num) ? "0" : String(num);
};
app.post("/api/invoices", requireAuth, async (req, res) => {
  try {
    const u = req.dbUser;
    if (!u.orgId) return res.status(404).json({ error: "Organization not found" });
    if (u.role !== "SUPER_ADMIN") {
      if (u.subscriptionStatus === "TRIAL" && u.trialInvoicesRemaining > 0) {
      } else if (u.subscriptionStatus === "ACTIVE" && (!u.subscriptionEndsAt || new Date(u.subscriptionEndsAt) > /* @__PURE__ */ new Date())) {
      } else {
        return res.status(403).json({ error: "SUBSCRIPTION_REQUIRED" });
      }
    }
    const { customerName, phone, address, invoiceNumber, date, subtotal, discount, taxAmount, grandTotal, notes, items, status, paymentMethod, paymentReference } = req.body;
    let customerId = null;
    if (customerName) {
      const existingCustomers = await db.select().from(customers).where(eq3(customers.orgId, u.orgId));
      const customer = existingCustomers.find((c) => c.name.toLowerCase() === String(customerName).trim().toLowerCase());
      if (customer) {
        customerId = customer.id;
      } else {
        const newCustomer = await db.insert(customers).values({
          orgId: u.orgId,
          name: String(customerName).trim(),
          phone: phone ? String(phone).trim() : null,
          address: address ? String(address).trim() : null
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
      status: status || "PENDING",
      paymentMethod: paymentMethod || null,
      paymentReference: paymentReference || null
    }).returning();
    if (items && Array.isArray(items) && items.length > 0) {
      const itemValues = items.map((item) => ({
        invoiceId: newInvoice[0].id,
        description: item.description || "Item",
        quantity: safeNumericStr(item.quantity || 1),
        rate: safeNumericStr(item.rate || 0),
        amount: safeNumericStr(item.amount || 0)
      }));
      await db.insert(invoiceItems).values(itemValues);
    }
    if (u.role !== "SUPER_ADMIN" && u.subscriptionStatus === "TRIAL") {
      await db.update(users).set({ trialInvoicesRemaining: Math.max(0, u.trialInvoicesRemaining - 1) }).where(eq3(users.id, u.id));
    }
    res.json(newInvoice[0]);
  } catch (error) {
    console.error("Create invoice error:", error);
    res.status(500).json({ error: error.message || "Failed to create invoice" });
  }
});
app.put("/api/invoices/:id", requireAuth, async (req, res) => {
  try {
    const u = req.dbUser;
    if (!u.orgId) return res.status(404).json({ error: "Organization not found" });
    const invoiceId = parseInt(req.params.id);
    const { customerName, phone, address, invoiceNumber, date, subtotal, discount, taxAmount, grandTotal, notes, items, status, paymentMethod, paymentReference } = req.body;
    let targetInvoices = [];
    if (!isNaN(invoiceId)) {
      targetInvoices = await db.select().from(invoices).where(eq3(invoices.id, invoiceId));
    }
    if (targetInvoices.length === 0 && invoiceNumber) {
      targetInvoices = await db.select().from(invoices).where(and(eq3(invoices.orgId, u.orgId), eq3(invoices.invoiceNumber, invoiceNumber)));
    }
    if (targetInvoices.length === 0) {
      let customerId2 = null;
      if (customerName) {
        const existingCustomers = await db.select().from(customers).where(eq3(customers.orgId, u.orgId));
        const customer = existingCustomers.find((c) => c.name.toLowerCase() === String(customerName).trim().toLowerCase());
        if (customer) {
          customerId2 = customer.id;
        } else {
          const newCustomer = await db.insert(customers).values({
            orgId: u.orgId,
            name: String(customerName).trim(),
            phone: phone ? String(phone).trim() : null,
            address: address ? String(address).trim() : null
          }).returning();
          customerId2 = newCustomer[0].id;
        }
      }
      const newInvoice = await db.insert(invoices).values({
        orgId: u.orgId,
        customerId: customerId2,
        createdBy: u.id,
        invoiceNumber: invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
        date: parseSafeDate(date),
        subtotal: safeNumericStr(subtotal),
        discount: safeNumericStr(discount),
        taxAmount: safeNumericStr(taxAmount),
        grandTotal: safeNumericStr(grandTotal),
        notes: notes || null,
        status: status || "PENDING",
        paymentMethod: paymentMethod || null,
        paymentReference: paymentReference || null
      }).returning();
      if (items && Array.isArray(items) && items.length > 0) {
        const itemValues = items.map((item) => ({
          invoiceId: newInvoice[0].id,
          description: item.description || "Item",
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
    let customerId = targetInvoice.customerId;
    if (customerName) {
      const existingCustomers = await db.select().from(customers).where(eq3(customers.orgId, u.orgId));
      const customer = existingCustomers.find((c) => c.name.toLowerCase() === String(customerName).trim().toLowerCase());
      if (customer) {
        customerId = customer.id;
        if (phone !== void 0 || address !== void 0) {
          await db.update(customers).set({
            phone: phone !== void 0 ? String(phone).trim() : customer.phone,
            address: address !== void 0 ? String(address).trim() : customer.address,
            updatedAt: /* @__PURE__ */ new Date()
          }).where(eq3(customers.id, customer.id));
        }
      } else {
        const newCustomer = await db.insert(customers).values({
          orgId: u.orgId,
          name: String(customerName).trim(),
          phone: phone ? String(phone).trim() : null,
          address: address ? String(address).trim() : null
        }).returning();
        customerId = newCustomer[0].id;
      }
    }
    const updatedInvoice = await db.update(invoices).set({
      customerId,
      invoiceNumber: invoiceNumber || targetInvoice.invoiceNumber,
      date: parseSafeDate(date),
      subtotal: safeNumericStr(subtotal),
      discount: safeNumericStr(discount),
      taxAmount: safeNumericStr(taxAmount),
      grandTotal: safeNumericStr(grandTotal),
      notes: notes !== void 0 ? notes : targetInvoice.notes,
      status: status || targetInvoice.status || "PENDING",
      paymentMethod: paymentMethod !== void 0 ? paymentMethod : targetInvoice.paymentMethod,
      paymentReference: paymentReference !== void 0 ? paymentReference : targetInvoice.paymentReference,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq3(invoices.id, effectiveInvoiceId)).returning();
    if (items && Array.isArray(items)) {
      await db.delete(invoiceItems).where(eq3(invoiceItems.invoiceId, effectiveInvoiceId));
      if (items.length > 0) {
        const itemValues = items.map((item) => ({
          invoiceId: effectiveInvoiceId,
          description: item.description || "Item",
          quantity: safeNumericStr(item.quantity || 1),
          rate: safeNumericStr(item.rate || 0),
          amount: safeNumericStr(item.amount || 0)
        }));
        await db.insert(invoiceItems).values(itemValues);
      }
    }
    res.json(updatedInvoice[0]);
  } catch (error) {
    console.error("Update invoice error:", error);
    res.status(500).json({ error: error.message || "Failed to update invoice" });
  }
});
app.delete("/api/invoices/:id", requireAuth, async (req, res) => {
  try {
    const u = req.dbUser;
    if (!u.orgId) return res.status(404).json({ error: "Organization not found" });
    const invoiceId = parseInt(req.params.id);
    if (isNaN(invoiceId)) {
      return res.status(400).json({ error: "Invalid invoice ID" });
    }
    const targetInvoices = await db.select().from(invoices).where(eq3(invoices.id, invoiceId));
    if (targetInvoices.length === 0) {
      return res.status(404).json({ error: "Invoice not found" });
    }
    const targetInvoice = targetInvoices[0];
    if (targetInvoice.orgId !== u.orgId) {
      return res.status(403).json({ error: "Forbidden: You do not have permission to delete this invoice" });
    }
    await db.delete(invoiceItems).where(eq3(invoiceItems.invoiceId, invoiceId));
    await db.delete(invoices).where(eq3(invoices.id, invoiceId));
    res.json({ success: true, message: "Invoice deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/settings", requireAuth, async (req, res) => {
  try {
    const u = req.dbUser;
    if (!u.orgId) return res.status(404).json({ error: "Organization not found" });
    const orgs = await db.select().from(organizations).where(eq3(organizations.id, u.orgId));
    let settingsList = await db.select().from(companySettings).where(eq3(companySettings.orgId, u.orgId));
    if (settingsList.length === 0) {
      const newSettings = await db.insert(companySettings).values({
        orgId: u.orgId,
        invoiceLayout: "standard"
      }).returning();
      settingsList = newSettings;
    }
    const org = orgs[0] || { name: "My Company" };
    const currentSettings = settingsList[0];
    res.json({
      companyName: org.name || "My Company",
      ...currentSettings
    });
  } catch (error) {
    console.error("Fetch settings error:", error);
    res.status(500).json({ error: error.message });
  }
});
app.put("/api/settings", requireAuth, async (req, res) => {
  try {
    const u = req.dbUser;
    if (!u.orgId) return res.status(404).json({ error: "Organization not found" });
    const { companyName, ...settingData } = req.body;
    if (companyName) {
      await db.update(organizations).set({ name: companyName, updatedAt: /* @__PURE__ */ new Date() }).where(eq3(organizations.id, u.orgId));
    }
    const existingSettings = await db.select().from(companySettings).where(eq3(companySettings.orgId, u.orgId));
    let updatedSettings;
    if (existingSettings.length === 0) {
      updatedSettings = await db.insert(companySettings).values({
        orgId: u.orgId,
        ...settingData
      }).returning();
    } else {
      updatedSettings = await db.update(companySettings).set({
        ...settingData,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq3(companySettings.orgId, u.orgId)).returning();
    }
    res.json({
      companyName: companyName || (await db.select().from(organizations).where(eq3(organizations.id, u.orgId)))[0]?.name,
      ...updatedSettings[0]
    });
  } catch (error) {
    console.error("Update settings error:", error);
    res.status(500).json({ error: error.message });
  }
});
app.post("/api/onboarding", requireAuth, async (req, res) => {
  try {
    const u = req.dbUser;
    if (!u.orgId) return res.status(404).json({ error: "Organization not found" });
    const { companyName, ...settingData } = req.body;
    if (companyName) {
      await db.update(organizations).set({ name: companyName }).where(eq3(organizations.id, u.orgId));
    }
    if (Object.keys(settingData).length > 0) {
      await db.update(companySettings).set(settingData).where(eq3(companySettings.orgId, u.orgId));
    }
    await db.update(users).set({ onboardingCompleted: true }).where(eq3(users.id, u.id));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post("/api/payments/submit", requireAuth, async (req, res) => {
  try {
    const u = req.dbUser;
    if (!u.orgId) return res.status(404).json({ error: "Organization not found" });
    const { screenshotUrl } = req.body;
    if (!screenshotUrl) return res.status(400).json({ error: "Screenshot is required" });
    const newPayment = await db.insert(payments).values({
      userId: u.id,
      orgId: u.orgId,
      amount: "499",
      screenshotUrl,
      status: "PENDING"
    }).returning();
    await db.update(users).set({ subscriptionStatus: "PENDING_VERIFICATION" }).where(eq3(users.id, u.id));
    res.json(newPayment[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/admin/payments/pending", requireAuth, async (req, res) => {
  try {
    if (req.dbUser.role !== "SUPER_ADMIN") {
      return res.status(403).json({ error: "Forbidden: Super Admin only" });
    }
    const pendingPayments = await db.query.payments.findMany({
      where: eq3(payments.status, "PENDING"),
      with: {
        user: true
      },
      orderBy: [desc(payments.submittedAt)]
    });
    res.json(pendingPayments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post("/api/admin/payments/:id/approve", requireAuth, async (req, res) => {
  try {
    if (req.dbUser.role !== "SUPER_ADMIN") {
      return res.status(403).json({ error: "Forbidden: Super Admin only" });
    }
    const paymentId = parseInt(req.params.id);
    const targetPayments = await db.select().from(payments).where(eq3(payments.id, paymentId));
    if (targetPayments.length === 0) return res.status(404).json({ error: "Payment not found" });
    const payment = targetPayments[0];
    await db.update(payments).set({ status: "APPROVED", verifiedAt: /* @__PURE__ */ new Date(), verifiedBy: req.dbUser.id }).where(eq3(payments.id, paymentId));
    const endsAt = /* @__PURE__ */ new Date();
    endsAt.setDate(endsAt.getDate() + 31);
    const updatedUserResult = await db.update(users).set({ subscriptionStatus: "ACTIVE", subscriptionStartAt: /* @__PURE__ */ new Date(), subscriptionEndsAt: endsAt }).where(eq3(users.id, payment.userId)).returning();
    res.json({ payment, user: updatedUserResult[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post("/api/custom-layouts", requireAuth, async (req, res) => {
  try {
    const u = req.dbUser;
    if (!u.orgId) return res.status(404).json({ error: "Organization not found" });
    const { fileUrl } = req.body;
    if (!fileUrl) return res.status(400).json({ error: "File URL is required" });
    const newRequest = await db.insert(customLayoutRequests).values({
      userId: u.id,
      orgId: u.orgId,
      fileUrl,
      status: "PENDING"
    }).returning();
    res.json(newRequest[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/admin/custom-layouts", requireAuth, async (req, res) => {
  try {
    if (req.dbUser.role !== "SUPER_ADMIN") {
      return res.status(403).json({ error: "Forbidden: Super Admin only" });
    }
    const pendingRequests = await db.query.customLayoutRequests.findMany({
      where: eq3(customLayoutRequests.status, "PENDING"),
      with: {
        user: true,
        organization: true
      },
      orderBy: [desc(customLayoutRequests.submittedAt)]
    });
    res.json(pendingRequests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post("/api/admin/custom-layouts/:id/approve", requireAuth, async (req, res) => {
  try {
    if (req.dbUser.role !== "SUPER_ADMIN") {
      return res.status(403).json({ error: "Forbidden: Super Admin only" });
    }
    const requestId = parseInt(req.params.id);
    const targetRequests = await db.select().from(customLayoutRequests).where(eq3(customLayoutRequests.id, requestId));
    if (targetRequests.length === 0) return res.status(404).json({ error: "Request not found" });
    const request = targetRequests[0];
    await db.update(customLayoutRequests).set({ status: "APPROVED", verifiedAt: /* @__PURE__ */ new Date() }).where(eq3(customLayoutRequests.id, requestId));
    const updatePayload = { hasCustomLayoutAccess: true };
    if (req.body.invoiceLayout) {
      updatePayload.invoiceLayout = typeof req.body.invoiceLayout === "string" ? req.body.invoiceLayout : JSON.stringify(req.body.invoiceLayout);
    }
    await db.update(companySettings).set(updatePayload).where(eq3(companySettings.orgId, request.orgId));
    res.json({ success: true, orgId: request.orgId });
  } catch (error) {
    console.error("Approve custom layout error:", error);
    res.status(500).json({ error: error.message });
  }
});
app.post("/api/admin/custom-layouts/:id/reject", requireAuth, async (req, res) => {
  try {
    if (req.dbUser.role !== "SUPER_ADMIN") {
      return res.status(403).json({ error: "Forbidden: Super Admin only" });
    }
    const requestId = parseInt(req.params.id);
    const { note } = req.body;
    await db.update(customLayoutRequests).set({ status: "REJECTED", verifiedAt: /* @__PURE__ */ new Date(), note }).where(eq3(customLayoutRequests.id, requestId));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post("/api/admin/payments/:id/reject", requireAuth, async (req, res) => {
  try {
    if (req.dbUser.role !== "SUPER_ADMIN") {
      return res.status(403).json({ error: "Forbidden: Super Admin only" });
    }
    const paymentId = parseInt(req.params.id);
    const { note } = req.body;
    const targetPayments = await db.select().from(payments).where(eq3(payments.id, paymentId));
    if (targetPayments.length === 0) return res.status(404).json({ error: "Payment not found" });
    const payment = targetPayments[0];
    await db.update(payments).set({ status: "REJECTED", verifiedAt: /* @__PURE__ */ new Date(), verifiedBy: req.dbUser.id, note }).where(eq3(payments.id, paymentId));
    const targetUserResult = await db.select().from(users).where(eq3(users.id, payment.userId));
    const targetUser = targetUserResult[0];
    let nextStatus = "EXPIRED";
    if (!targetUser.subscriptionStartAt) {
      nextStatus = "TRIAL";
    }
    const updatedUserResult = await db.update(users).set({ subscriptionStatus: nextStatus }).where(eq3(users.id, payment.userId)).returning();
    res.json({ payment, user: updatedUserResult[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.use((err, req, res, next) => {
  console.error("Global Error Handler:", err);
  res.status(500).json({ error: err.message || "Internal Server Error" });
});
if (!process.env.VERCEL) {
  async function startServer() {
    if (process.env.NODE_ENV !== "production") {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa"
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
  startServer();
}
var server_default = app;
export {
  app,
  server_default as default
};
//# sourceMappingURL=index.js.map
