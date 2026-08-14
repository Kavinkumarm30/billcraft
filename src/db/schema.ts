import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, boolean, numeric, uuid } from 'drizzle-orm/pg-core';

export const organizations = pgTable('organizations', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  name: text('name'),
  phone: text('phone'),
  role: text('role').notNull().default('EMPLOYEE'), // SUPER_ADMIN, ADMIN, EMPLOYEE
  isActive: boolean('is_active').notNull().default(true),
  orgId: integer('org_id').references(() => organizations.id),
  subscriptionStatus: text('subscription_status').notNull().default('TRIAL'), // TRIAL, PENDING_VERIFICATION, ACTIVE, EXPIRED, REJECTED
  trialInvoicesRemaining: integer('trial_invoices_remaining').notNull().default(3),
  onboardingCompleted: boolean('onboarding_completed').notNull().default(false),
  subscriptionStartAt: timestamp('subscription_start_at'),
  subscriptionEndsAt: timestamp('subscription_ends_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const companySettings = pgTable('company_settings', {
  id: serial('id').primaryKey(),
  orgId: integer('org_id').references(() => organizations.id).notNull().unique(),
  logoUrl: text('logo_url'),
  address: text('address'),
  phone: text('phone'),
  email: text('email'),
  website: text('website'),
  gstNo: text('gst_no'),
  panNo: text('pan_no'),
  bankName: text('bank_name'),
  accountNo: text('account_no'),
  ifsc: text('ifsc'),
  upiId: text('upi_id'),
  invoicePrefix: text('invoice_prefix').default('INV-'),
  invoiceLayout: text('invoice_layout').default('standard'),
  hasCustomLayoutAccess: boolean('has_custom_layout_access').notNull().default(false),
  footer: text('footer'),
  terms: text('terms'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  orgId: integer('org_id').references(() => organizations.id).notNull(),
  name: text('name').notNull(),
  phone: text('phone'),
  email: text('email'),
  address: text('address'),
  gstNo: text('gst_no'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const invoices = pgTable('invoices', {
  id: serial('id').primaryKey(),
  orgId: integer('org_id').references(() => organizations.id).notNull(),
  customerId: integer('customer_id').references(() => customers.id),
  createdBy: integer('created_by').references(() => users.id),
  invoiceNumber: text('invoice_number').notNull(),
  date: timestamp('date').notNull().defaultNow(),
  subtotal: numeric('subtotal').notNull().default('0'),
  discount: numeric('discount').notNull().default('0'),
  taxAmount: numeric('tax_amount').notNull().default('0'), // GST, CGST, SGST total
  grandTotal: numeric('grand_total').notNull().default('0'),
  notes: text('notes'),
  status: text('status').notNull().default('PENDING'), // PENDING, PAID, CANCELLED
  paymentMethod: text('payment_method'),
  paymentReference: text('payment_reference'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const invoiceItems = pgTable('invoice_items', {
  id: serial('id').primaryKey(),
  invoiceId: integer('invoice_id').references(() => invoices.id).notNull(),
  description: text('description').notNull(),
  quantity: numeric('quantity').notNull().default('1'),
  unit: text('unit').default('pcs'),
  rate: numeric('rate').notNull().default('0'),
  amount: numeric('amount').notNull().default('0'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const organizationsRelations = relations(organizations, ({ many, one }) => ({
  users: many(users),
  settings: one(companySettings, {
    fields: [organizations.id],
    references: [companySettings.orgId],
  }),
  customers: many(customers),
  invoices: many(invoices),
  payments: many(payments),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.orgId],
    references: [organizations.id],
  }),
  invoices: many(invoices),
  payments: many(payments),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [customers.orgId],
    references: [organizations.id],
  }),
  invoices: many(invoices),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [invoices.orgId],
    references: [organizations.id],
  }),
  customer: one(customers, {
    fields: [invoices.customerId],
    references: [customers.id],
  }),
  creator: one(users, {
    fields: [invoices.createdBy],
    references: [users.id],
  }),
  items: many(invoiceItems),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
}));

export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  orgId: integer('org_id').references(() => organizations.id).notNull(),
  amount: numeric('amount').notNull().default('499'),
  screenshotUrl: text('screenshot_url').notNull(), // base64 data URL
  status: text('status').notNull().default('PENDING'), // PENDING, APPROVED, REJECTED
  submittedAt: timestamp('submitted_at').defaultNow(),
  verifiedAt: timestamp('verified_at'),
  verifiedBy: integer('verified_by').references(() => users.id),
  note: text('note'),
});

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
  verifier: one(users, {
    fields: [payments.verifiedBy],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [payments.orgId],
    references: [organizations.id],
  }),
}));

export const customLayoutRequests = pgTable('custom_layout_requests', {
  id: serial('id').primaryKey(),
  orgId: integer('org_id').references(() => organizations.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  fileUrl: text('file_url').notNull(),
  status: text('status').notNull().default('PENDING'), // PENDING, APPROVED, REJECTED
  submittedAt: timestamp('submitted_at').defaultNow(),
  verifiedAt: timestamp('verified_at'),
  note: text('note'),
});

export const customLayoutRequestsRelations = relations(customLayoutRequests, ({ one }) => ({
  user: one(users, {
    fields: [customLayoutRequests.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [customLayoutRequests.orgId],
    references: [organizations.id],
  }),
}));
