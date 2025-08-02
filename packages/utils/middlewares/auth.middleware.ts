import { Request, Response, NextFunction } from 'express';
import { 
  UnauthorizedError, 
  TokenExpiredError, 
  InvalidTokenError,
  ForbiddenError 
} from '../../error-handaler/index';
import { 
  verifyAccessToken, 
  extractTokenFromHeader,
  isTokenNearExpiry 
} from '../helpers/jwt.helper';
import { validateSession } from '../helpers/session.helper';
import { handleDatabaseOperation } from '../../error-handaler/error-middleware';
import prisma from '../../libs/prisma';

// Extend Express Request type to include user and session data
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        fullName: string | null;
        status: string;
      };
      sessionId?: string;
      tokenPayload?: {
        userId: string;
        email: string;
        sessionId: string;
        type: string;
      };
    }
  }
}

/**
 * Middleware to authenticate requests using JWT access tokens
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    // Verify the access token
    const tokenPayload = verifyAccessToken(token);

    // Validate the session exists and is active
    const session = await validateSession(tokenPayload.sessionId);

    // Verify the token in the session matches
    if (session.token !== token) {
      throw new InvalidTokenError('Token session mismatch');
    }

    // Get fresh user data from database
    const user = await handleDatabaseOperation(
      () => prisma.user.findUnique({
        where: { id: tokenPayload.userId },
        select: {
          id: true,
          email: true,
          fullName: true,
          status: true
        }
      }),
      'fetching user for authentication'
    );

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    if (user.status !== 'active') {
      throw new ForbiddenError('Account is not active');
    }

    // Attach user and session data to request
    req.user = user;
    req.sessionId = session.id;
    req.tokenPayload = tokenPayload;

    // Add token expiry warning header if token is near expiry
    if (isTokenNearExpiry(new Date(session.expiresAt))) {
      res.setHeader('X-Token-Expires-Soon', 'true');
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to optionally authenticate requests
 * If token is provided, it validates it, but doesn't fail if no token
 */
export const optionalAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    // If no auth header, continue without authentication
    if (!authHeader) {
      return next();
    }

    // If auth header exists, validate it
    await authenticateToken(req, res, next);
  } catch (error) {
    // For optional auth, we don't fail on auth errors
    // Just continue without setting user data
    next();
  }
};

/**
 * Middleware to check if user has specific status
 */
export const requireStatus = (requiredStatus: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const allowedStatuses = Array.isArray(requiredStatus) ? requiredStatus : [requiredStatus];
    
    if (!allowedStatuses.includes(req.user.status)) {
      throw new ForbiddenError(`Access denied. Required status: ${allowedStatuses.join(' or ')}`);
    }

    next();
  };
};

/**
 * Middleware to check if user owns the resource
 */
export const requireResourceOwnership = (userIdParam: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const resourceUserId = req.params[userIdParam];
    
    if (!resourceUserId) {
      throw new UnauthorizedError('Resource user ID not found');
    }

    if (req.user.id !== resourceUserId) {
      throw new ForbiddenError('Access denied. You can only access your own resources.');
    }

    next();
  };
};

/**
 * Middleware for admin-only routes (if you have admin roles later)
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  // For now, we'll just check if user exists
  // You can extend this later with role-based permissions
  if (req.user.status !== 'active') {
    throw new ForbiddenError('Admin access required');
  }

  next();
};

/**
 * Rate limiting middleware for sensitive operations
 */
export const rateLimitByUser = (maxAttempts: number, windowMs: number) => {
  const userAttempts = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const userId = req.user.id;
    const now = Date.now();
    const userAttempt = userAttempts.get(userId);

    if (!userAttempt || now > userAttempt.resetTime) {
      // First attempt or window has reset
      userAttempts.set(userId, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (userAttempt.count >= maxAttempts) {
      throw new UnauthorizedError(
        `Too many attempts. Try again after ${new Date(userAttempt.resetTime).toISOString()}`
      );
    }

    // Increment attempt count
    userAttempt.count++;
    next();
  };
};
