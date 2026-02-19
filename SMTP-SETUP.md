# SMTP Setup for TheLazyCPA

## Your SMTP Credentials

Based on your email (reza@fintask.ie), here are the settings to add to Vercel:

### Option 1: Gmail/Google Workspace (if using fintask.ie with Google)
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=reza@fintask.ie
SMTP_PASS=your-app-password
FROM_EMAIL=reza@fintask.ie
```

### Option 2: If fintask.ie uses different hosting
You'll need to check with your email provider for:
- SMTP server address
- Port (usually 587 or 465)
- Whether to use SSL/TLS

## How to Add to Vercel

### Step 1: Get App Password (for Gmail)
1. Go to https://myaccount.google.com/security
2. Enable 2-Factor Authentication
3. Go to "App passwords"
4. Generate new app password for "Mail"
5. Copy the 16-character password

### Step 2: Add to Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Click on "thelazycpa" project
3. Click "Settings" tab
4. Click "Environment Variables" in left menu
5. Add each variable one by one:
   - Name: SMTP_HOST, Value: smtp.gmail.com
   - Name: SMTP_PORT, Value: 587
   - Name: SMTP_SECURE, Value: false
   - Name: SMTP_USER, Value: reza@fintask.ie
   - Name: SMTP_PASS, Value: [your app password]
   - Name: FROM_EMAIL, Value: reza@fintask.ie

6. Click "Save"
7. Redeploy the site (Vercel will auto-redeploy when you push new code)

### Step 3: Test
1. Visit https://thelazycpa.vercel.app/api/health
2. Check that "smtp_configured" shows as true
3. Submit a test email on the homepage
4. Check your email for the welcome message

## Alternative: SendGrid (Recommended for production)

For better deliverability, consider SendGrid:
1. Sign up at https://sendgrid.com (free tier: 100 emails/day)
2. Verify your domain
3. Create API key
4. Use these settings:
   ```
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=apikey
   SMTP_PASS=your-sendgrid-api-key
   FROM_EMAIL=reza@fintask.ie
   ```

## Testing Locally

If you want to test email locally before deploying:

1. Create `.env` file in project root:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=reza@fintask.ie
   SMTP_PASS=your-app-password
   FROM_EMAIL=reza@fintask.ie
   ```

2. Run locally:
   ```bash
   cd thelazycpa
   npm install
   npm start
   ```

3. Visit http://localhost:3000 and test the form

## Troubleshooting

### Emails not sending
- Check Vercel logs: Dashboard → Project → Functions → [latest deployment]
- Verify SMTP credentials are correct
- Check if SMTP_PASS is an app password (not your regular password)

### Emails going to spam
- Use a custom domain email (reza@fintask.ie is good)
- Add SPF/DKIM records for your domain
- Consider using SendGrid or Mailgun

### Vercel deployment fails
- Check that all environment variables are set
- Redeploy from GitHub if needed

## Need Help?

If you can't get SMTP working:
1. Use the SQLite database to collect emails
2. Export via `/api/subscribers?format=csv`
3. Send emails manually or via Mailchimp/ConvertKit later

The site will work without SMTP - it just won't send automatic welcome emails.
