import cors from "cors";
import dotenv from "dotenv";
import express, { type Request, type Response } from "express";
import nodemailer from "nodemailer";

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(cors());
app.use(express.json());

const requiredEnvVars = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS"] as const;

const missingEnv = requiredEnvVars.filter((key) => !process.env[key]);
if (missingEnv.length > 0) {
  console.warn(
    `Email server configuration missing the following env vars: ${missingEnv.join(
      ", ",
    )}. Email sending will fail until they are provided.`,
  );
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

type JoinEventEmailPayload = {
  recipientEmail: string;
  eventTitle: string;
  eventDate?: string;
  eventLocation?: string;
  organizerEmail?: string;
};

type CancellationEmailPayload = {
  recipients: string[];
  eventTitle: string;
  eventDate?: string;
  eventLocation?: string;
  organizerEmail?: string;
};

app.post(
  "/email/join",
  async (req: Request<unknown, unknown, JoinEventEmailPayload>, res: Response) => {
    const { recipientEmail, eventTitle, eventDate, eventLocation, organizerEmail } =
      req.body ?? {};

    if (!recipientEmail || !eventTitle) {
      return res.status(400).json({
        error: "Missing required fields: recipientEmail and eventTitle.",
      });
    }

    const fromAddress = process.env.EMAIL_FROM ?? process.env.SMTP_USER;

    const textBody = [
      `Hi there,`,
      "",
      `You're all set for ${eventTitle}.`,
      eventDate ? `Date: ${eventDate}` : "",
      eventLocation ? `Location: ${eventLocation}` : "",
      "",
      "See you there!",
    ]
      .filter(Boolean)
      .join("\n");

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
        <h2 style="color: #4C1D95; margin-bottom: 12px;">You're joining ${eventTitle}!</h2>
        ${
          eventDate
            ? `<p style="margin: 4px 0;"><strong>Date:</strong> ${eventDate}</p>`
            : ""
        }
        ${
          eventLocation
            ? `<p style="margin: 4px 0;"><strong>Location:</strong> ${eventLocation}</p>`
            : ""
        }
        <p style="margin-top: 16px;">Thanks for using Evenza. We can't wait to see you there!</p>
      </div>
    `;

    try {
      await transporter.sendMail({
        from: fromAddress,
        to: recipientEmail,
        cc: organizerEmail,
        subject: `You're joining ${eventTitle}!`,
        text: textBody,
        html: htmlBody,
      });

      return res.status(200).json({ ok: true });
    } catch (error) {
      console.error("Failed to send join event email", error);
      return res.status(500).json({ error: "Failed to send email." });
    }
  },
);

app.post(
  "/email/cancellation",
  async (
    req: Request<unknown, unknown, CancellationEmailPayload>,
    res: Response,
  ) => {
    const { recipients, eventTitle, eventDate, eventLocation, organizerEmail } =
      req.body ?? {};

    if (!eventTitle || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        error: "Missing required fields: recipients (non-empty array) and eventTitle.",
      });
    }

    const fromAddress = process.env.EMAIL_FROM ?? process.env.SMTP_USER;
    const subject = `${eventTitle} has been canceled`;

    const textBody = [
      "Hello,",
      "",
      `We're sorry to let you know that ${eventTitle} has been canceled.`,
      eventDate ? `Scheduled date: ${eventDate}` : "",
      eventLocation ? `Location: ${eventLocation}` : "",
      "",
      "Thanks for being part of Evenza.",
    ]
      .filter(Boolean)
      .join("\n");

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
        <h2 style="color: #B91C1C; margin-bottom: 12px;">${eventTitle} has been canceled</h2>
        ${
          eventDate
            ? `<p style="margin: 4px 0;"><strong>Scheduled date:</strong> ${eventDate}</p>`
            : ""
        }
        ${
          eventLocation
            ? `<p style="margin: 4px 0;"><strong>Location:</strong> ${eventLocation}</p>`
            : ""
        }
        <p style="margin-top: 16px;">We're sorry for the inconvenience. Stay tuned for more events!</p>
      </div>
    `;

    try {
      await transporter.sendMail({
        from: fromAddress,
        to: fromAddress,
        bcc: recipients,
        subject,
        text: textBody,
        html: htmlBody,
        replyTo: organizerEmail ?? undefined,
      });

      return res.status(200).json({ ok: true });
    } catch (error) {
      console.error("Failed to send cancellation email", error);
      return res.status(500).json({ error: "Failed to send cancellation email." });
    }
  },
);

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.listen(port, () => {
  console.log(`Email service listening on port ${port}`);
});
