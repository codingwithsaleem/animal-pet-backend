import prisma from '../../libs/prisma';
import { generateSessionId, generateTokenPair, TokenPair } from './jwt.helper';
import { DatabaseError, NotFoundError } from '../../error-handaler/index';

export interface SessionData {
  id: string;
  userId: string;
  token: string;
  refreshToken: string | null;
  expiresAt: Date;
  createdAt: Date;
}

/**
 * Create a new session for user login
 */
export const createSession = async (
  userId: string,
  email: string,
  userAgent?: string,
  ipAddress?: string
): Promise<{ session: SessionData; tokens: TokenPair }> => {
  try {
    const sessionId = generateSessionId();
    const tokens = generateTokenPair(userId, email, sessionId);

    const session = await prisma.session.create({
      data: {
        id: sessionId,
        userId,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.refreshTokenExpiresAt, // Use refresh token expiry as session expiry
      },
    });

    return { session, tokens };
  } catch (error: any) {
    throw new DatabaseError('Failed to create session', {
      userId,
      error: error.message
    });
  }
};

/**
 * Get session by ID
 */
export const getSessionById = async (sessionId: string): Promise<SessionData | null> => {
  try {
    const session = await prisma.session.findUnique({
      where: { id: sessionId }
    });
    return session;
  } catch (error: any) {
    throw new DatabaseError('Failed to fetch session', {
      sessionId,
      error: error.message
    });
  }
};

/**
 * Get active session by user ID (most recent valid session)
 */
export const getActiveSessionByUserId = async (userId: string): Promise<SessionData | null> => {
  try {
    const session = await prisma.session.findFirst({
      where: {
        userId,
        expiresAt: {
          gt: new Date() // Only get sessions that haven't expired
        }
      },
      orderBy: {
        createdAt: 'desc' // Get the most recent session
      }
    });
    return session;
  } catch (error: any) {
    throw new DatabaseError('Failed to fetch active session', {
      userId,
      error: error.message
    });
  }
};

/**
 * Update session with new tokens
 */
export const updateSessionTokens = async (
  sessionId: string,
  tokens: TokenPair
): Promise<SessionData> => {
  try {
    const session = await prisma.session.update({
      where: { id: sessionId },
      data: {
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.refreshTokenExpiresAt
      }
    });
    return session;
  } catch (error: any) {
    if (error.code === 'P2025') {
      throw new NotFoundError('Session not found');
    }
    throw new DatabaseError('Failed to update session', {
      sessionId,
      error: error.message
    });
  }
};

/**
 * Invalidate session (logout) - delete the session
 */
export const invalidateSession = async (sessionId: string): Promise<void> => {
  try {
    await prisma.session.delete({
      where: { id: sessionId }
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      throw new NotFoundError('Session not found');
    }
    throw new DatabaseError('Failed to invalidate session', {
      sessionId,
      error: error.message
    });
  }
};

/**
 * Invalidate all sessions for a user
 */
export const invalidateAllUserSessions = async (userId: string): Promise<void> => {
  try {
    await prisma.session.deleteMany({
      where: { userId }
    });
  } catch (error: any) {
    throw new DatabaseError('Failed to invalidate user sessions', {
      userId,
      error: error.message
    });
  }
};

/**
 * Clean up expired sessions (for periodic cleanup)
 */
export const cleanupExpiredSessions = async (): Promise<number> => {
  try {
    const result = await prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });
    return result.count;
  } catch (error: any) {
    throw new DatabaseError('Failed to cleanup expired sessions', {
      error: error.message
    });
  }
};

/**
 * Validate session and check if it's active and not expired
 */
export const validateSession = async (sessionId: string): Promise<SessionData> => {
  const session = await getSessionById(sessionId);
  
  if (!session) {
    throw new NotFoundError('Session not found');
  }
  
  if (session.expiresAt <= new Date()) {
    // Automatically invalidate expired session
    await invalidateSession(sessionId);
    throw new NotFoundError('Session has expired');
  }
  
  return session;
};

/**
 * Get user sessions with pagination
 */
export const getUserSessions = async (
  userId: string,
  limit = 10,
  offset = 0
): Promise<{ sessions: SessionData[]; total: number }> => {
  try {
    const [sessions, total] = await Promise.all([
      prisma.session.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.session.count({
        where: { userId }
      })
    ]);

    return { sessions, total };
  } catch (error: any) {
    throw new DatabaseError('Failed to fetch user sessions', {
      userId,
      error: error.message
    });
  }
};

/**
 * Find session by refresh token
 */
export const getSessionByRefreshToken = async (refreshToken: string): Promise<SessionData | null> => {
  try {
    const session = await prisma.session.findFirst({
      where: {
        refreshToken,
        expiresAt: {
          gt: new Date()
        }
      }
    });
    return session;
  } catch (error: any) {
    throw new DatabaseError('Failed to fetch session by refresh token', {
      error: error.message
    });
  }
};
