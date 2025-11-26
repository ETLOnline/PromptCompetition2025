import express, { Request, Response } from "express";
import { transporter } from "../config/email.js";
import { verifyClerkToken } from "../middleware/clerkAuth.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

router.post("/", verifyClerkToken, async (req: Request, res: Response) => {
  try {
    const { email, fullName } = req.body;

    if (!email || !fullName) {
      console.error("❌ Missing required fields:", { email: !!email, fullName: !!fullName });
      return res.status(400).json({ 
        success: false, 
        error: "Email and full name are required" 
      });
    }
    console.log(`📧 Preparing to send welcome email to: ${email}`);
    
    // Build welcome email HTML
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to APPEC Prompt Engineering Competition</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .email-container {
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            background: #0f172a;
            color: white;
            padding: 40px 20px;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
            letter-spacing: 0.5px;
          }
          .content {
            padding: 40px 30px;
          }
          .content p {
            margin: 16px 0;
            color: #444;
          }
          .highlight-box {
            background: #f8fafc;
            padding: 20px;
            border-radius: 6px;
            margin: 24px 0;
            border-left: 4px solid #0f172a;
          }
          .highlight-box h3 {
            margin-top: 0;
            color: #0f172a;
            font-size: 16px;
            font-weight: 600;
          }
          .attachment-notice {
            background: #f0f9ff;
            border: 1px solid #0f172a;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
          }
          .attachment-notice strong {
            color: #0f172a;
          }
          .footer {
            text-align: center;
            padding: 30px;
            background: #f8f9fa;
            color: #666;
            font-size: 14px;
            border-top: 1px solid #e1e1e1;
          }
          .signature {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e1e1e1;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>Welcome to the APPEC Prompt Engineering Competition</h1>
          </div>
          
          <div class="content">
            <p>Dear ${fullName},</p>
            
            <p>Thank you for registering for the <strong>APPEC Prompt Engineering Competition</strong>. We're excited to have you on board.</p>
            
            <div class="highlight-box">
              <h3>🎯 Competition Objectives</h3>
              <p>This competition aims to equip participants with practical, real-world prompt engineering skills while identifying the next generation of emerging AI talent across Pakistan. You are now part of a growing community of innovators who will learn, experiment, and compete using modern AI techniques and best practices.</p>
            </div>
            
            <div class="attachment-notice">
              <strong>📎 Important Reference Document Attached</strong>
              <p style="margin: 8px 0 0 0;">We have attached a detailed reference document that includes key concepts in prompt engineering, essential AI techniques, and practical guidance that will support you throughout the competition. We encourage you to review it thoroughly so you can make the most of this experience.</p>
            </div>
            
            <p>If you have any questions or need assistance at any stage, feel free to reach out.</p>
            
            <p>We look forward to seeing your creativity and expertise in action.</p>
            
            <div class="signature">
              <p style="margin: 4px 0;"><strong>Best regards,</strong></p>
              <p style="margin: 4px 0;"><strong>APPEC Competition Team</strong></p>
            </div>
          </div>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} APPEC - All Pakistan Prompt Engineering Competition</p>
            <p style="margin-top: 8px; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Create plain text version for email clients that don't support HTML
    const textContent = `
Welcome to the APPEC Prompt Engineering Competition

Dear ${fullName},

Thank you for registering for the APPEC Prompt Engineering Competition. We're excited to have you on board.

This competition aims to equip participants with practical, real-world prompt engineering skills while identifying the next generation of emerging AI talent across Pakistan. You are now part of a growing community of innovators who will learn, experiment, and compete using modern AI techniques and best practices.

To help you prepare, we have attached a detailed reference document. It includes key concepts in prompt engineering, essential AI techniques, and practical guidance that will support you throughout the competition. We encourage you to review it thoroughly so you can make the most of this experience.

If you have any questions or need assistance at any stage, feel free to reach out.

We look forward to seeing your creativity and expertise in action.

Best regards,
APPEC Competition Team

---
© ${new Date().getFullYear()} APPEC - All Pakistan Prompt Engineering Competition
This is an automated message. Please do not reply to this email.
    `;

    // Path to the PDF attachment
    const pdfPath = path.join(__dirname, "..", "email.pdf");
    console.log(`📎 PDF attachment path: ${pdfPath}`);

    // Verify email configuration
    if (!process.env.EMAIL_SENDER || !process.env.EMAIL_APP_PASSWORD) {
      console.error("❌ Email configuration missing:", { 
        EMAIL_SENDER: !!process.env.EMAIL_SENDER, 
        EMAIL_APP_PASSWORD: !!process.env.EMAIL_APP_PASSWORD 
      });
      throw new Error("Email service not configured properly");
    }

    // Send welcome email with attachment
    console.log(`📤 Sending email from: ${process.env.EMAIL_SENDER} to: ${email}`);
    await transporter.sendMail({
      from: `"APPEC Competition Team" <${process.env.EMAIL_SENDER}>`,
      to: email,
      subject: "Welcome to the APPEC Prompt Engineering Competition",
      html: htmlContent,
      text: textContent,
      attachments: [
        {
          filename: "APPEC_Prompt_Engineering_Guide.pdf",
          path: pdfPath,
        },
      ],
    });

    // console.log(`✅ Welcome email sent successfully to: ${email}`);
    return res.status(200).json({ 
      success: true, 
      message: "Welcome email sent successfully" 
    });
    
  } catch (err: any) {
    console.error("❌ Failed to send welcome email:", err);
    console.error("Error details:", {
      message: err.message,
      code: err.code,
      command: err.command,
      response: err.response
    });
    return res.status(500).json({ 
      success: false, 
      error: "Failed to send welcome email",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

export default router;