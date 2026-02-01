import { supabase } from "./supabase"

/**
 * Email service for sending laundry notifications
 * Supports multiple email providers and Supabase Auth emails
 */

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

/**
 * Send an email using the configured email service
 * Currently uses Supabase Auth email (which requires Supabase Auth setup)
 * For production, consider integrating with:
 * - Resend (recommended for Next.js)
 * - SendGrid
 * - AWS SES
 * - Nodemailer with SMTP
 */
export async function sendEmail({ to, subject, html, text }: EmailOptions): Promise<boolean> {
  try {
    // Option 1: Use Supabase Auth email (if configured)
    // Note: This requires Supabase Auth email templates to be set up
    const isDemo = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder") || !process.env.NEXT_PUBLIC_SUPABASE_URL
    
    if (isDemo) {
      // In demo mode, just log the email
      console.log("📧 [DEMO] Email would be sent:")
      console.log(`   To: ${to}`)
      console.log(`   Subject: ${subject}`)
      console.log(`   Message: ${text || html.replace(/<[^>]*>/g, "")}`)
      return true
    }

    // Option 2: Use Supabase Edge Function (if you have one set up)
    // Uncomment and configure if you have an email edge function
    /*
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: { to, subject, html, text }
    })
    
    if (error) throw error
    return !!data.success
    */

    // Option 3: Use Resend (recommended for production)
    // First install: npm install resend
    // Then uncomment below and add RESEND_API_KEY to .env.local
    /*
    if (process.env.RESEND_API_KEY) {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)
      
      const { error } = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'Laundry Service <noreply@yourdomain.com>',
        to: [to],
        subject,
        html,
        text,
      })
      
      if (error) throw error
      return true
    }
    */

    // Option 4: Use Nodemailer with SMTP
    // First install: npm install nodemailer
    // Then configure SMTP settings in .env.local
    /*
    if (process.env.SMTP_HOST) {
      const nodemailer = await import('nodemailer')
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })
      
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'Laundry Service <noreply@yourdomain.com>',
        to,
        subject,
        html,
        text,
      })
      
      return true
    }
    */

    // Check if any email service is configured
    const hasResend = !!process.env.RESEND_API_KEY
    const hasSMTP = !!process.env.SMTP_HOST
    const hasEdgeFunction = !!process.env.SUPABASE_FUNCTION_URL
    
    if (!hasResend && !hasSMTP && !hasEdgeFunction) {
      // No email service configured - log warning
      console.warn("⚠️ No email service configured!")
      console.warn("   To send real emails, please configure one of:")
      console.warn("   - Resend: Add RESEND_API_KEY to .env.local (see EMAIL_SETUP_GUIDE.md)")
      console.warn("   - SMTP: Add SMTP_HOST, SMTP_USER, SMTP_PASS to .env.local")
      console.warn("   - Supabase Edge Function: Create and configure email function")
      console.warn("")
      console.warn("   Email that would be sent:")
      console.log(`   To: ${to}`)
      console.log(`   Subject: ${subject}`)
      console.log(`   Message: ${text || html.replace(/<[^>]*>/g, "")}`)
      console.warn("")
      console.warn("   Notification saved to database, but email was NOT sent.")
      
      // Return false to indicate email was not sent
      return false
    }
    
    // If we reach here, a service should be configured but something went wrong
    console.error("⚠️ Email service configured but failed to send email")
    return false
  } catch (error) {
    console.error("Failed to send email:", error)
    return false
  }
}

/**
 * Send a laundry ready for pickup email
 */
export async function sendLaundryReadyEmail(
  studentEmail: string,
  studentName: string,
  batchNumber: string,
  block?: string,
  roomNumber?: string
): Promise<boolean> {
  const subject = `Your Laundry Batch ${batchNumber} is Ready for Pickup! 🧺`
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
        .batch-info { background-color: white; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🧺 Laundry Ready for Pickup!</h1>
        </div>
        <div class="content">
          <p>Hello ${studentName},</p>
          
          <p>Great news! Your laundry batch is now ready for pickup.</p>
          
          <div class="batch-info">
            <h3>Batch Details:</h3>
            <p><strong>Batch Number:</strong> ${batchNumber}</p>
            ${block ? `<p><strong>Block:</strong> ${block}</p>` : ''}
            ${roomNumber ? `<p><strong>Room:</strong> ${roomNumber}</p>` : ''}
            <p><strong>Status:</strong> Ready for Pickup ✅</p>
          </div>
          
          <p>Please visit the laundry room to collect your items. If you have any questions or concerns, please contact the laundry staff.</p>
          
          <p>Thank you for using our laundry service!</p>
          
          <p>Best regards,<br>
          Laundry Management Team</p>
        </div>
        <div class="footer">
          <p>This is an automated notification from the Laundry Management System.</p>
          <p>If you believe this is an error, please contact support.</p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
Hello ${studentName},

Great news! Your laundry batch is now ready for pickup.

Batch Details:
- Batch Number: ${batchNumber}
${block ? `- Block: ${block}` : ''}
${roomNumber ? `- Room: ${roomNumber}` : ''}
- Status: Ready for Pickup ✅

Please visit the laundry room to collect your items. If you have any questions or concerns, please contact the laundry staff.

Thank you for using our laundry service!

Best regards,
Laundry Management Team

---
This is an automated notification from the Laundry Management System.
If you believe this is an error, please contact support.
  `

  return await sendEmail({
    to: studentEmail,
    subject,
    html,
    text,
  })
}

