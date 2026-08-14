const fs = require('fs');
let code = fs.readFileSync('src/db/schema.ts', 'utf8');

// Add hasCustomLayoutAccess to companySettings
code = code.replace(
  /invoiceLayout: text\('invoice_layout'\)\.default\('standard'\),/,
  `invoiceLayout: text('invoice_layout').default('standard'),\n  hasCustomLayoutAccess: boolean('has_custom_layout_access').notNull().default(false),`
);

// Add customLayoutRequests table
const tableCode = `
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
`;

code += tableCode;

fs.writeFileSync('src/db/schema.ts', code);
