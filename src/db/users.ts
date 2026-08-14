import { db } from './index.ts';
import { users, organizations, companySettings } from './schema.ts';
import { eq } from 'drizzle-orm';

export async function getOrCreateUser(uid: string, email: string) {
  try {
    // SECURITY: Super admin emails are read from environment variables, not hardcoded in source
    const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
    const isSuperAdminEmail = superAdminEmails.includes(email.toLowerCase());
    
    // Check if user already exists
    const existingUsers = await db.select().from(users).where(eq(users.uid, uid));
    let user = existingUsers[0];

    if (user) {
      // If super admin email or role is super admin, guarantee ACTIVE subscription & unlimited access
      if (isSuperAdminEmail || user.role === 'SUPER_ADMIN') {
        const updated = await db.update(users)
          .set({ 
            role: 'SUPER_ADMIN',
            subscriptionStatus: 'ACTIVE',
            trialInvoicesRemaining: 999999,
            email: email || user.email,
            updatedAt: new Date() 
          })
          .where(eq(users.id, user.id))
          .returning();
        if (updated.length > 0) {
          user = updated[0];
        }
      } else if (email && user.email !== email) {
        const updated = await db.update(users)
          .set({ email, updatedAt: new Date() })
          .where(eq(users.id, user.id))
          .returning();
        if (updated.length > 0) {
          user = updated[0];
        }
      }
    } else {
      // Create new user
      const role = isSuperAdminEmail ? 'SUPER_ADMIN' : 'EMPLOYEE';
      const subscriptionStatus = isSuperAdminEmail ? 'ACTIVE' : 'TRIAL';
      const trialInvoicesRemaining = isSuperAdminEmail ? 999999 : 3;

      const result = await db.insert(users)
        .values({
          uid,
          email: email || `${uid}@user.com`,
          role,
          subscriptionStatus,
          trialInvoicesRemaining,
          onboardingCompleted: true,
        })
        .returning();
      user = result[0];
    }

    // If user doesn't have an organization, create one for them (first-time signup)
    if (!user.orgId) {
      const orgResult = await db.insert(organizations)
        .values({
          name: "My Company",
        })
        .returning();

      const org = orgResult[0];

      // Create default settings for this new org
      await db.insert(companySettings)
        .values({
          orgId: org.id,
          logoUrl: "",
          address: "123 Design Avenue, Creative Dist.",
          phone: "+1 234-567-8901",
          email: email || "",
          gstNo: "27AABCU9603R1ZN",
        });

      // Link user to org
      const updatedUserResult = await db.update(users)
        .set({ orgId: org.id })
        .where(eq(users.id, user.id))
        .returning();

      return updatedUserResult[0];
    }

    return user;
  } catch (error) {
    console.error("Error in getOrCreateUser:", error);
    throw error;
  }
}
