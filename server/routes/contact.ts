import express, { Request, Response } from "express";
import { transporter } from "../config/email.js";

const router = express.Router();

router.post("/", async (req: Request, res: Response) => {
  const { firstName, lastName, email, company, size, message } = req.body;

  console.log("📩 Received contact form data:", req.body);

  try {
    // Build email HTML
    const htmlContent = `
      <h2>New Contact Form Submission</h2>
      <p><strong>First Name:</strong> ${firstName}</p>
      <p><strong>Last Name:</strong> ${lastName}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Company:</strong> ${company}</p>
      <p><strong>Organization Size:</strong> ${size}</p>
      <p><strong>Message:</strong> ${message}</p>
    `;

    // Send email to you
    await transporter.sendMail({
      from: "enlightechy@gmail.com",
      to: "enlightechy@gmail.com", // your email
      subject: "New Enterprise Contact Form Submission",
      html: htmlContent,
    });

    console.log("✅ Contact form email sent to enlightechy@gmail.com");

    return res.status(200).json({ success: true, message: "Form submitted and email sent" });
  } catch (err: any) {
    console.error("❌ Failed to send contact form email:", err);
    return res.status(500).json({ success: false, error: "Failed to send email" });
  }
});

export default router;
