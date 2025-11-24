import express, { Request, Response } from "express";
import { transporter } from "../config/email.js";
import { verifyClerkToken } from "../middleware/clerkAuth.js";

const router = express.Router();

router.post("/", verifyClerkToken, async (req: Request, res: Response) => {
  try {
    const { email, fullName } = req.body;

    if (!email || !fullName) {
      return res.status(400).json({ 
        success: false, 
        error: "Email and full name are required" 
      });
    }
    console.log(`Preparing to send welcome email to: ${email}`);
    // Build welcome email HTML
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Spark!</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 20px;
            border-radius: 10px 10px 0 0;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
          }
          .content {
            background: white;
            padding: 40px 30px;
            border: 1px solid #e1e1e1;
            border-top: none;
          }
          .highlight {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #667eea;
          }
          .button {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            padding: 30px;
            background: #f8f9fa;
            border-radius: 0 0 10px 10px;
            color: #666;
            font-size: 14px;
          }
          .logo {
            margin-bottom: 20px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">
            <h1>🌟 SPARK</h1>
          </div>
          <h1>Welcome to the Spark Ecosystem!</h1>
          <p>Your journey of learning and innovation begins now</p>
        </div>
        
        <div class="content">
          <h2>Hello ${fullName}! 👋</h2>
          
          <p>Welcome to <strong>Spark</strong> - where learning meets opportunity! We're thrilled to have you join our growing community of students, innovators, and future leaders.</p>
          
          <div class="highlight">
            <h3>🚀 What's Next?</h3>
            <p>Your Spark account is now active! Here's what you can explore:</p>
            <ul>
              <li><strong>Competitions:</strong> Participate in exciting challenges and showcase your skills</li>
              <li><strong>Learning Resources:</strong> Access curated content tailored for your growth</li>
              <li><strong>Community:</strong> Connect with like-minded peers and mentors</li>
              <li><strong>Achievements:</strong> Track your progress and celebrate milestones</li>
            </ul>
          </div>
          
          <p>Ready to dive in? Visit your dashboard to explore available competitions and start your Spark journey!</p>
          
          <center>
            <a href="${process.env.NEXT_PUBLIC_API_URL || 'https://spark.etlonline.org'}/participant" class="button">
              Go to Your Dashboard
            </a>
          </center>
          
          <div class="highlight">
            <h3>💡 Need Help?</h3>
            <p>If you have any questions or need assistance, don't hesitate to reach out:</p>
            <ul>
              <li>📧 Email us at: <a href="mailto:support@etlonline.org">support@etlonline.org</a></li>
              <li>🌐 Visit our main website: <a href="https://spark.etlonline.org">spark.etlonline.org</a></li>
            </ul>
          </div>
          
          <p>We're excited to see what amazing things you'll accomplish within the Spark ecosystem!</p>
          
          <p>Best regards,<br>
          <strong>The Spark Team</strong><br>
          <em>Empowerment Through Learning</em></p>
        </div>
        
        <div class="footer">
          <p>This email was sent from the Spark platform by Empowerment Through Learning.</p>
          <p>© ${new Date().getFullYear()} Empowerment Through Learning. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    // Create plain text version for email clients that don't support HTML
    const textContent = `
Welcome to Spark, ${fullName}!

We're thrilled to have you join our growing community of students, innovators, and future leaders.

Your Spark account is now active! Here's what you can explore:
- Competitions: Participate in exciting challenges and showcase your skills
- Learning Resources: Access curated content tailored for your growth  
- Community: Connect with like-minded peers and mentors
- Achievements: Track your progress and celebrate milestones

Ready to dive in? Visit your dashboard to explore available competitions and start your Spark journey!

Dashboard: ${process.env.NEXT_PUBLIC_API_URL || 'https://spark.etlonline.org'}/participant

Need help?
- Email: support@etlonline.org
- Website: https://spark.etlonline.org

We're excited to see what amazing things you'll accomplish within the Spark ecosystem!

Best regards,
The Spark Team
Empowerment Through Learning
    `;

    // Send welcome email
    await transporter.sendMail({
      from: `"Spark Team" <${process.env.EMAIL_SENDER}>`,
      to: email,
      subject: "🌟 Welcome to Spark - Your Learning Journey Begins!",
      html: htmlContent,
      text: textContent,
    });

    console.log(`✅ Welcome email sent successfully to: ${email}`);
    return res.status(200).json({ 
      success: true, 
      message: "Welcome email sent successfully" 
    });
    
  } catch (err: any) {
    console.error("❌ Failed to send welcome email:", err);
    return res.status(500).json({ 
      success: false, 
      error: "Failed to send welcome email" 
    });
  }
});

export default router;