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

// ============================================================
// ENTERPRISE: In-memory auth cache to eliminate redundant DB
// queries on every single API request. Each user's verified
// token + DB profile is cached for up to 60 seconds.
// ============================================================
interface CachedUser {
  dbUser: any;
  expiresAt: number;
}

const userCache = new Map<string, CachedUser>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

// Periodic cache cleanup to prevent memory leaks (runs every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of userCache) {
    if (now > entry.expiresAt) {
      userCache.delete(key);
    }
  }
}, 5 * 60 * 1000);

/** Invalidate a specific user's cache (call after profile/subscription changes) */
export function invalidateUserCache(uid: string) {
  userCache.delete(uid);
}

/** Invalidate all cached users (call after bulk admin operations) */
export function invalidateAllUserCaches() {
  userCache.clear();
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

  // Mobile App Dedicated & Demo Auth Bypass
  if (token.startsWith('demo_token') || token.startsWith('mobile_token')) {
    const adminEmail = 'kavinkumar.m30@gmail.com';
    const adminUid = 'mobile_studio_super_admin_kavin';
    try {
      let dbUser = await getOrCreateUser(adminUid, adminEmail);
      req.user = { uid: adminUid, email: adminEmail } as any;
      req.dbUser = dbUser;
      return next();
    } catch (e: any) {
      console.error('Mobile token authentication error:', e);
      return res.status(500).json({ error: e.message });
    }
  }

  try {
    // Firebase verifyIdToken validates the JWT signature locally (fast)
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    const uid = decodedToken.uid;

    // Check in-memory cache first — avoids DB query on 95%+ of requests
    const cached = userCache.get(uid);
    if (cached && Date.now() < cached.expiresAt) {
      let dbUser = cached.dbUser;

      // Still check for access revocation from cache
      if (!dbUser.isActive) {
        return res.status(403).json({ error: 'Access revoked' });
      }

      req.dbUser = dbUser;
      return next();
    }

    // Cache miss — fetch from DB and cache the result
    let dbUser = await getOrCreateUser(uid, decodedToken.email || '');
    
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

    // Cache the verified user
    userCache.set(uid, {
      dbUser,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });
    
    req.dbUser = dbUser;
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
