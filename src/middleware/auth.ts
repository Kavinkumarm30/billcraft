import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { DecodedIdToken } from 'firebase-admin/auth';
import { getOrCreateUser } from '../db/users.ts';
import { db } from '../db/index.ts';
import { users } from '../db/schema.ts';
import { eq } from 'drizzle-orm';

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
  dbUser?: any;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    
    // Sync with DB
    let dbUser = await getOrCreateUser(decodedToken.uid, decodedToken.email || '');
    
    // Lazy subscription expiry check
    if (dbUser.role !== 'SUPER_ADMIN') {
      if (dbUser.subscriptionStatus === 'ACTIVE' && dbUser.subscriptionEndsAt) {
        if (new Date(dbUser.subscriptionEndsAt) < new Date()) {
          const updatedUserResult = await db.update(users)
            .set({ subscriptionStatus: 'EXPIRED' })
            .where(eq(users.id, dbUser.id))
            .returning();
          if (updatedUserResult.length > 0) {
            dbUser = updatedUserResult[0];
          }
        }
      }
    }

    if (!dbUser.isActive) {
      return res.status(403).json({ error: 'Access revoked' });
    }
    
    req.dbUser = dbUser;
    
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
