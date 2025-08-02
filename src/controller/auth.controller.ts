import { Response, Request, NextFunction } from "express";
import {
  ValidationError,
  ConflictError,
  OTPExpiredError,
  OTPInvalidError,
  OTPAttemptsExceededError,
  UnauthorizedError,
  InvalidCredentialsError,
  NotFoundError,
} from "../../packages/error-handaler/index";
import {
  asyncHandler,
  sendSuccessResponse,
  validateRequiredFields,
  validateField,
  checkResourceExists,
  handleDatabaseOperation,
} from "../../packages/error-handaler/error-middleware";
import prisma from "../../packages/libs/prisma";
import {
  checkOtpRestriction,
  sendOtpEmail,
  verifyOtp,
  cleanupOtp,
} from "../../packages/utils/helpers/auth.helper";
import {
  createSession,
  invalidateSession,
  getSessionByRefreshToken,
  updateSessionTokens,
  invalidateAllUserSessions,
} from "../../packages/utils/helpers/session.helper";
import {
  verifyRefreshToken,
  generateTokenPair,
} from "../../packages/utils/helpers/jwt.helper";
import bcrypt from "bcryptjs";

//register a new user
export const userRegister = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, fullName, password } = req.body;

    // Validate required fields
    const requiredFieldError = validateRequiredFields(req.body, [
      "email",
      "fullName",
      "password",
    ]);
    if (requiredFieldError) {
      throw requiredFieldError;
    }

    // Validate email format
    const emailValidationError = validateField(email, "email", {
      required: true,
      type: "email",
    });
    if (emailValidationError) {
      throw emailValidationError;
    }

    // Validate full name
    const nameValidationError = validateField(fullName, "fullName", {
      required: true,
      type: "string",
      minLength: 2,
      maxLength: 100,
    });
    if (nameValidationError) {
      throw nameValidationError;
    }

    // Validate password strength
    const passwordValidationError = validateField(password, "password", {
      required: true,
      type: "password",
      minLength: 8,
      maxLength: 128,
    });

    if (passwordValidationError) {
      throw passwordValidationError;
    }

    // Check if user already exists
    const existingUser = await handleDatabaseOperation(
      () => prisma.user.findUnique({ where: { email } }),
      "checking existing user"
    );

    if (existingUser) {
      throw new ConflictError("User already exists with this email");
    }

    // Check OTP restrictions
    const restrictionCheck = await checkOtpRestriction(email);
    if (!restrictionCheck.allowed) {
      throw new OTPAttemptsExceededError(restrictionCheck.message!);
    }

    // Send OTP email
    const otpResult = await sendOtpEmail(email, "verifyEmailOtpTemplate");

    // create user as veriified false

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the new user
    const newUser = await handleDatabaseOperation(
      () =>
        prisma.user.create({
          data: {
            email,
            fullName: fullName,
            password: hashedPassword,
            status: "inactive",
          },
        }),
      "creating user"
    );

    if (!newUser) {
      throw new ConflictError("Failed to create user");
    }

    sendSuccessResponse(res, null, otpResult.message, 201);
  }
);

// verify user registration
export const verifyUserRegistration = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, otp } = req.body;

    // Validate required fields
    const requiredFieldError = validateRequiredFields(req.body, [
      "email",
      "otp",
    ]);
    if (requiredFieldError) {
      throw requiredFieldError;
    }

    // Validate email format
    const emailValidationError = validateField(email, "email", {
      required: true,
      type: "email",
    });
    if (emailValidationError) {
      throw emailValidationError;
    }

    // Validate OTP format
    const otpValidationError = validateField(otp, "otp", {
      required: true,
      type: "string",
      pattern: /^\d{6}$/,
    });
    if (otpValidationError) {
      throw new ValidationError("OTP must be a 6-digit number");
    }

    // Check if the user exists
    const existingUser = await handleDatabaseOperation(
      () => prisma.user.findUnique({ where: { email } }),
      "checking existing user"
    );

    if (!existingUser) {
      throw new UnauthorizedError("User not found");
    }

    // Verify the OTP
    const otpResult = await verifyOtp(email, otp);
    if (!otpResult.valid) {
      if (otpResult.message.includes("expired")) {
        throw new OTPExpiredError(otpResult.message);
      } else {
        throw new OTPInvalidError(otpResult.message);
      }
    }

    // Update user status to active

    const updatedUser = await handleDatabaseOperation(
      () =>
        prisma.user.update({
          where: { email },
          data: { status: "active" }, // Set user status to active
        }),
      "updating user status"
    );

    if (!updatedUser) {
      throw new ConflictError("Failed to update user status");
    }

    // Clean up OTP record
    await cleanupOtp(email);

    // Prepare user data for response (exclude password)

    const userData = {
      id: updatedUser.id,
      email: updatedUser.email,
      fullName: updatedUser.fullName,
      createdAt: updatedUser.createdAt,
    };
    // Send success response
    sendSuccessResponse(res, userData, "User registered successfully", 201);
  }
);

// User login
export const userLogin = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Validate required fields
  const requiredFieldError = validateRequiredFields(req.body, [
    "email",
    "password",
  ]);
  if (requiredFieldError) {
    throw requiredFieldError;
  }

  // Validate email format
  const emailValidationError = validateField(email, "email", {
    required: true,
    type: "email",
  });
  if (emailValidationError) {
    throw emailValidationError;
  }

  // Validate password is provided
  const passwordValidationError = validateField(password, "password", {
    required: true,
    type: "string",
    minLength: 1,
  });
  if (passwordValidationError) {
    throw passwordValidationError;
  }

  // Find user by email
  const user = await handleDatabaseOperation(
    () =>
      prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          password: true,
          fullName: true,
          status: true,
          createdAt: true,
        },
      }),
    "finding user for login"
  );

  if (!user) {
    throw new NotFoundError("User not found with this email");
  }

  // Check if user account is active
  if (user.status !== "active") {
    throw new UnauthorizedError(
      "Account is not active. Please contact support."
    );
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new InvalidCredentialsError("Invalid email or password");
  }

  // Get request metadata
  const userAgent = req.get("User-Agent");
  const ipAddress = req.ip || req.connection.remoteAddress;

  // Create new session and generate tokens
  const { session, tokens } = await createSession(
    user.id,
    user.email,
    userAgent,
    ipAddress
  );

  // Prepare user data for response (exclude password)
  const userData = {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    status: user.status,
    createdAt: user.createdAt,
  };

  // Prepare response data
  const responseData = {
    user: userData,
    session: {
      id: session.id,
      expiresAt: session.expiresAt,
    },
    tokens: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      accessTokenExpiresAt: tokens.accessTokenExpiresAt,
      refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
    },
  };

  sendSuccessResponse(res, responseData, "Login successful", 200);
});

// Request Forgot password (send OTP)
export const forgotPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = req.body;

    // Validate required fields
    const requiredFieldError = validateRequiredFields(req.body, ["email"]);

    if (requiredFieldError) {
      throw requiredFieldError;
    }

    // Validate email format
    const emailValidationError = validateField(email, "email", {
      required: true,
      type: "email",
    });

    if (emailValidationError) {
      throw emailValidationError;
    }

    // Check if user exists
    const user = await handleDatabaseOperation(
      () => prisma.user.findUnique({ where: { email } }),
      "checking user for forgot password"
    );

    if (!user) {
      throw new UnauthorizedError("User not found");
    }

    // Check OTP restrictions
    const restrictionCheck = await checkOtpRestriction(email);

    if (!restrictionCheck.allowed) {
      throw new OTPAttemptsExceededError(restrictionCheck.message!);
    }

    // Send OTP email
    const otpResult = await sendOtpEmail(email, "forgotPasswordOtpTemplate");
    if (!otpResult.success) {
      throw new Error("Failed to send OTP email");
    }

    sendSuccessResponse(res, null, otpResult.message, 200);
  }
);

// Verify forgot password OTP
export const verifyForgotPasswordOtp = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, otp } = req.body;

    // Validate required fields
    const requiredFieldError = validateRequiredFields(req.body, [
      "email",
      "otp",
    ]);

    if (requiredFieldError) {
      throw requiredFieldError;
    }

    // Validate email format
    const emailValidationError = validateField(email, "email", {
      required: true,
      type: "email",
    });

    if (emailValidationError) {
      throw emailValidationError;
    }

    // Validate OTP format
    const otpValidationError = validateField(otp, "otp", {
      required: true,
      type: "string",
      pattern: /^\d{6}$/,
    });

    if (otpValidationError) {
      throw new ValidationError("OTP must be a 6-digit number");
    }

    // Check if user exists
    const user = await handleDatabaseOperation(
      () => prisma.user.findUnique({ where: { email } }),
      "checking user for forgot password OTP verification"
    );
    if (!user) {
      throw new UnauthorizedError("User not found");
    }

    // Verify the OTP
    const otpResult = await verifyOtp(email, otp);
    if (!otpResult.valid) {
      if (otpResult.message.includes("expired")) {
        throw new OTPExpiredError(otpResult.message);
      } else {
        throw new OTPInvalidError(otpResult.message);
      }
    }

    sendSuccessResponse(res, null, "OTP verified successfully", 200);
  }
);

// Reset password
export const resetPassword = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { email, newPassword } = req.body;

      // Validate required fields
      const requiredFieldError = validateRequiredFields(req.body, [
        "email",
        "newPassword",
      ]);
      if (requiredFieldError) {
        throw requiredFieldError;
      }

      // Validate email format
      const emailValidationError = validateField(email, "email", {
        required: true,
        type: "email",
      });

      if (emailValidationError) {
        throw emailValidationError;
      }


      // Validate new password
      const passwordValidationError = validateField(
        newPassword,
        "newPassword",
        {
          required: true,
          type: "password",
          minLength: 8,
          maxLength: 128,
        }
      );

      if (passwordValidationError) {
        throw passwordValidationError;
      }

      // Check if user exists
      const user = await handleDatabaseOperation(
        () => prisma.user.findUnique({ where: { email } }),
        "checking user for password reset"
      );

      if (!user) {
        throw new UnauthorizedError("User not found");
      }

      // Verify the OTP
      const otpResult = await verifyOtp(email, "resetPasswordOtp");

      if (!otpResult.valid) {
        if (otpResult.message.includes("expired")) {
          throw new OTPExpiredError(otpResult.message);
        } else {
          throw new OTPInvalidError(otpResult.message);
        }
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update the user's password
      const updatedUser = await handleDatabaseOperation(
        () =>
          prisma.user.update({
            where: { email },
            data: { password: hashedPassword },
          }),
        "updating user password"
      );

      if (!updatedUser) {
        throw new UnauthorizedError("Failed to update password");
      }

      // Clean up OTP record
      await cleanupOtp(email);

      // Invalidate all sessions for the user
      await invalidateAllUserSessions(updatedUser.id);

      sendSuccessResponse(res, null, "Password reset successfully", 200);
    } catch (error) {
      console.error("Error in resetPassword:", error);
      if (
        error instanceof ValidationError ||
        error instanceof OTPExpiredError ||
        error instanceof OTPInvalidError
      ) {
        throw error; // Re-throw validation and OTP errors
      }
      throw new Error("Failed to reset password");
    }
  }
);

// Refresh token
export const refreshToken = asyncHandler(
  async (req: Request, res: Response) => {
    const { refreshToken: clientRefreshToken } = req.body;

    // Validate required fields
    const requiredFieldError = validateRequiredFields(req.body, [
      "refreshToken",
    ]);
    if (requiredFieldError) {
      throw requiredFieldError;
    }

    // Verify the refresh token
    const tokenPayload = verifyRefreshToken(clientRefreshToken);

    // Find session by refresh token
    const session = await getSessionByRefreshToken(clientRefreshToken);
    if (!session) {
      throw new UnauthorizedError("Invalid refresh token");
    }

    // Verify session belongs to the token
    if (session.id !== tokenPayload.sessionId) {
      throw new UnauthorizedError("Token session mismatch");
    }

    // Get user data
    const user = await handleDatabaseOperation(
      () =>
        prisma.user.findUnique({
          where: { id: session.userId },
          select: {
            id: true,
            email: true,
            fullName: true,
            status: true,
          },
        }),
      "finding user for token refresh"
    );

    if (!user) {
      throw new UnauthorizedError("User not found");
    }

    if (user.status !== "active") {
      throw new UnauthorizedError("Account is not active");
    }

    // Generate new token pair
    const newTokens = generateTokenPair(user.id, user.email, session.id);

    // Update session with new tokens
    const updatedSession = await updateSessionTokens(session.id, newTokens);

    // Prepare response
    const responseData = {
      tokens: {
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
        accessTokenExpiresAt: newTokens.accessTokenExpiresAt,
        refreshTokenExpiresAt: newTokens.refreshTokenExpiresAt,
      },
      session: {
        id: updatedSession.id,
        expiresAt: updatedSession.expiresAt,
      },
    };

    sendSuccessResponse(res, responseData, "Token refreshed successfully", 200);
  }
);

// User logout
export const userLogout = asyncHandler(async (req: Request, res: Response) => {
  // Get session ID from authenticated request (will be set by auth middleware)
  const sessionId = (req as any).sessionId;

  if (!sessionId) {
    throw new UnauthorizedError("No active session found");
  }

  // Invalidate the session
  await invalidateSession(sessionId);

  sendSuccessResponse(res, null, "Logged out successfully", 200);
});
