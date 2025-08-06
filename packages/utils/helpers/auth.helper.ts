import crypto from "crypto";
import { ValidationError } from "../../../packages/error-handaler";
import prisma from "../../../packages/libs/prisma";
import { sendEmail } from ".././email-templates/index";

// check otp restriction - returns boolean instead of calling next
export const checkOtpRestriction = async (
  email: string
): Promise<{ allowed: boolean; message?: string }> => {
  try {
    const otpVerification = await prisma.otpVerification.findUnique({
      where: { email },
    });

    if (otpVerification?.otpCooldown) {
      const cooldownTime = new Date(otpVerification.otpCooldown);
      const currentTime = new Date();

      if (currentTime < cooldownTime) {
        const remainingTime = Math.ceil(
          (cooldownTime.getTime() - currentTime.getTime()) / 1000
        );
        return {
          allowed: false,
          message: `You can request a new OTP in ${remainingTime} seconds`,
        };
      }
    }

    if (otpVerification?.otpLockedUntil) {
      const lockedUntil = new Date(otpVerification.otpLockedUntil);
      const currentTime = new Date();

      if (currentTime < lockedUntil) {
        const remainingLockTime = Math.ceil(
          (lockedUntil.getTime() - currentTime.getTime()) / 60000
        );
        return {
          allowed: false,
          message: `Account is locked due to too many failed OTP attempts! Try again after ${remainingLockTime} minutes`,
        };
      }
    }

    return { allowed: true };
  } catch (error) {
    console.error("Error checking OTP restriction:", error);
    throw new Error("Failed to check OTP restriction");
  }
};

// send otp email
export const sendOtpEmail = async (
  email: string,
  templateName: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const newOtp = crypto.randomInt(100000, 999999).toString(); // Generate a 6-digit OTP
    const expireAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Save OTP to database using upsert to handle existing records
    const otpRecord = await prisma.otpVerification.upsert({
      where: { email },
      update: {
        otp: newOtp,
        expiresAt: expireAt,
        attemptCount: 0,
        verified: false,
        otpCooldown: new Date(Date.now() + 60 * 1000), // 1 minute cooldown
      },
      create: {
        email,
        otp: newOtp,
        type: "email_verification",
        expiresAt: expireAt,
        attemptCount: 0,
        verified: false,
        otpCooldown: new Date(Date.now() + 60 * 1000),
      },
    });

    // Send email
    await sendEmail(
      email,
      "Your OTP Code",
      `Your OTP code is: ${newOtp}. It is valid for 5 minutes.`,
      templateName,
      {
        otp: newOtp,
        expiresAt: expireAt.toISOString(),
        email: email,
      }
    );

    return { success: true, message: "OTP sent successfully" };
  } catch (error) {
    console.error("Error sending OTP email:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new ValidationError("Failed to send OTP email", {
      details: { error: errorMessage },
    });
  }
};

// verify otp - returns boolean result
export const verifyOtp = async (
  email: string,
  otp: string
): Promise<{ valid: boolean; message: string }> => {
  try {
    const otpVerification = await prisma.otpVerification.findUnique({
      where: { email },
    });

    if (!otpVerification) {
      return { valid: false, message: "No OTP found for this email" };
    }

    if (otpVerification.expiresAt < new Date()) {
      // Clean up expired OTP
      await prisma.otpVerification.delete({ where: { email } });
      return { valid: false, message: "OTP has expired" };
    }

    if(otp === "resetPasswordOtp" && otpVerification.verified) {
      return { valid: true, message: "OTP verified successfully for password reset" };
    }

     if(otp === "resetPasswordOtp" && !otpVerification.verified) {
      return {valid: false, message: "OTP is not verified for password reset"}
    }


    if (otpVerification.otp !== otp) {
      // Increment attempt count
      const newAttemptCount = otpVerification.attemptCount + 1;

      if (newAttemptCount >= 5) {
        // Lock the account and delete OTP
        await prisma.otpVerification.delete({ where: { email } });
        return {
          valid: false,
          message: "Too many failed attempts. Please request a new OTP",
        };
      }

      await prisma.otpVerification.update({
        where: { email },
        data: { attemptCount: newAttemptCount },
      });

      return {
        valid: false,
        message: `Invalid OTP. ${5 - newAttemptCount} attempts remaining`,
      };
    }

   


    // OTP is valid - mark as verified but keep record for registration
    await prisma.otpVerification.update({
      where: { email },
      data: { verified: true },
    });

    return { valid: true, message: "OTP verified successfully" };
  } catch (error) {
    console.error("Error verifying OTP:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new ValidationError("Failed to verify OTP", {
      details: { error: errorMessage },
    });
  }
};

// Clean up OTP after successful registration
export const cleanupOtp = async (email: string): Promise<void> => {
  try {
    await prisma.otpVerification.delete({
      where: { email },
    });
  } catch (error) {
    console.error("Error cleaning up OTP:", error);
  }
};
