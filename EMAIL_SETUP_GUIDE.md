# Email Setup Guide for Laundry Management System

## ✅ Email System is Ready!

The system is now configured to send emails when laundry is ready for pickup. When you update a batch status to "Ready for Pickup", it will automatically send an email to the student.

## 📧 How It Works

1. **When staff marks laundry as "Ready for Pickup"**:
   - System checks if student has email notifications enabled
   - Creates a beautiful HTML email with batch details
   - Sends email to student's registered email address
   - Saves notification record in database

2. **Email Features**:
   - Professional HTML email template
   - Includes batch number, block, and room information
   - Respects user notification preferences
   - Tracks delivery status

## 🔧 Email Provider Setup Options

Currently, the system is in **demo mode** (emails are logged to console). To send real emails, choose one of these options:

### Option 1: Resend (Recommended - Easy Setup)

**Best for**: Production use, easy setup, great deliverability

1. **Sign up for Resend**:
   - Go to [resend.com](https://resend.com) and create a free account
   - Verify your domain (free for development)

2. **Install Resend**:
   ```bash
   npm install resend
   ```

3. **Get your API Key**:
   - Go to Resend Dashboard → API Keys
   - Create a new API key
   - Copy the key

4. **Add to `.env.local`**:
   ```env
   RESEND_API_KEY=re_your_api_key_here
   EMAIL_FROM=noreply@yourdomain.com
   ```

5. **Uncomment Resend code** in `lib/email.ts`:
   - Find the Resend section (Option 3)
   - Uncomment the code

### Option 2: SMTP (Using Gmail, Outlook, etc.)

**Best for**: Using your existing email service

1. **Install Nodemailer**:
   ```bash
   npm install nodemailer
   ```

2. **Add SMTP settings to `.env.local`**:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   EMAIL_FROM=noreply@yourdomain.com
   ```

   **For Gmail**:
   - Enable 2-factor authentication
   - Create an "App Password" at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
   - Use the app password as `SMTP_PASS`

3. **Uncomment Nodemailer code** in `lib/email.ts`:
   - Find the Nodemailer section (Option 4)
   - Uncomment the code

### Option 3: Supabase Edge Function

**Best for**: Already using Supabase, want serverless solution

1. **Create Supabase Edge Function**:
   - Follow Supabase docs for creating edge functions
   - Create a function that sends emails via your preferred provider

2. **Uncomment Edge Function code** in `lib/email.ts`:
   - Find the Edge Function section (Option 2)
   - Uncomment and configure

## 🧪 Testing Email

### Currently (Demo Mode):

When you update a batch to "Ready for Pickup", check your browser console:
```
📧 [DEMO] Email would be sent:
   To: student@example.com
   Subject: Your Laundry Batch LB001234567 is Ready for Pickup! 🧺
   Message: [Email content]
```

### After Setup:

1. Update a batch status to "Ready for Pickup"
2. Check the student's email inbox
3. Email should arrive within seconds

## 📋 Email Template Features

The email includes:
- ✅ Professional HTML design
- ✅ Batch number
- ✅ Block and room information
- ✅ Status confirmation
- ✅ Clear call-to-action
- ✅ Responsive design (mobile-friendly)
- ✅ Plain text fallback

## 🔔 Notification Preferences

Students can control email notifications:
- Each user has `email_notifications` field in their profile
- If `false`, no emails will be sent (notifications still saved)
- Can be toggled in user settings (if implemented)

## 🐛 Troubleshooting

### Emails not sending:

1. **Check console logs**: Look for email-related errors
2. **Verify credentials**: Make sure API keys/SMTP settings are correct
3. **Check user email**: Ensure student has valid email in their profile
4. **Check preferences**: Verify `email_notifications` is not `false`

### Email in spam:

1. **Verify sender domain**: Use a verified domain as sender
2. **SPF/DKIM records**: Set up proper email authentication
3. **Send from real domain**: Avoid using free email services as sender

### For development:

Emails are logged to console in demo mode. This is safe for development!

## 📚 Next Steps

1. Choose an email provider (Resend recommended)
2. Set up credentials in `.env.local`
3. Uncomment the relevant code in `lib/email.ts`
4. Test by marking a batch as "Ready for Pickup"
5. Verify email delivery

## 📞 Support

If you need help setting up emails, check:
- Resend docs: https://resend.com/docs
- Nodemailer docs: https://nodemailer.com/about/
- Supabase Edge Functions: https://supabase.com/docs/guides/functions

