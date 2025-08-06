import { ValidationError } from "../../../packages/error-handaler";
import sgMail from "@sendgrid/mail";
import { verifyEmailOtpTemplate } from "./verifyEmailOtpTemplate";
import { resetPasswordTemplate } from "./resetPasswordTemplate";
import { welcomeTemplate } from "./welcomeTemplate";
import { forgotPasswordOtpTemplate } from "./forgotPasswordOtpTemplate";

const enabled = true; // Set to true to enable email sending
const emailSender = process.env.SENDGRID_FROM_EMAIL!;

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);



export const sendEmail = async (
  email: string,
  subject: string,
  text: string,
  emailTemplateName: string,
  data: { [key: string]: any }
) => {
  // Check if email sending is enabled
  if (!email || !subject || !text || !emailTemplateName) {
    return "Email, subject, text, and emailTemplateName are required";
  }

  if (!emailSender) {
    return "Email sender is not configured";
  }

  // Debug: Check environment variables
  // console.log("=== SendGrid Debug Info ===");
  console.log("SENDGRID_FROM_EMAIL:", emailSender);
  console.log("SENDGRID_API_KEY exists:", !!process.env.SENDGRID_API_KEY);
  // console.log("SENDGRID_API_KEY length:", process.env.SENDGRID_API_KEY?.length || 0);

  if (enabled) {
    try {
      if (!enabled) {
        return "Email sending is disabled";
      }

      // If you have a specific template, you can use it here

      let template = "";

      if (emailTemplateName === "welcomeTemplate") {
        template = welcomeTemplate(data);
      } else if (emailTemplateName === "verifyEmailOtpTemplate") {
        template = verifyEmailOtpTemplate(data);
      } else if (emailTemplateName === "resetPasswordTemplate") {
        template = resetPasswordTemplate(data);
      } else if (emailTemplateName === "forgotPasswordOtpTemplate") {
        template = forgotPasswordOtpTemplate(data);
      }else{
        throw new ValidationError("Invalid email template name", {
          details: { emailTemplateName },
        });
      }

      const msg = {
        to: email,
        from: emailSender,
        subject: subject,
        text: text,
        html: template,
      };

      // console.log("=== Sending Email ===");
      // console.log("To:", email);
      // console.log("From:", emailSender);
      // console.log("Subject:", subject);

      await sgMail.send(msg);
    } catch (error) {
      console.error("Error sending email:=========", error);

      // Enhanced error logging for SendGrid
      if (error && typeof error === "object" && "response" in error) {
        const sgError = error as any;
        console.error("SendGrid Error Details:");
        console.error("Status Code:", sgError.code);
        console.error("Response Body:", sgError.response?.body);

        if (sgError.response?.body?.errors) {
          console.error("Specific Errors:", sgError.response.body.errors);
        }
      }

      throw new ValidationError("Failed to send email", {
        details: { error },
      });
    }
  }
};
