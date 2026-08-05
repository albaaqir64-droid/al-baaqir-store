# Invoice & Notification System Setup Guide

This guide helps you configure the complete production-ready invoice and order notification system for Al Baaqir ecommerce store.

## System Overview

The system includes:
- **Invoice Generation**: Automatic PDF invoice creation after order placement
- **Invoice Storage**: Secure storage in Firebase Storage with signed download URLs
- **Customer Notifications**: Order confirmation email with invoice attachment
- **Admin Notifications**: New order alerts sent to admin
- **Order Management**: Download, resend, and generate invoices from admin dashboard
- **Order Success Page**: Display and download invoices after checkout

## Prerequisites

Before starting, ensure you have:
- Node.js 18+ installed
- Firebase project with Firestore and Storage enabled
- Firebase Admin SDK credentials
- Email service configured (Gmail, SendGrid, or any SMTP provider)
- Razorpay account (for payment processing)

## Step 1: Install Dependencies

Dependencies are already added to `package.json`:

```bash
npm install
```

Key packages added:
- `pdf-lib`: PDF generation
- `nodemailer`: Email sending
- `date-fns`: Date formatting
- `firebase-admin`: Firebase Admin SDK (needs separate installation)

```bash
npm install firebase-admin
```

## Step 2: Configure Environment Variables

Create a `.env.local` file in the project root with the following variables:

### Firebase Configuration

```env
# Firebase Client SDK (already configured)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK (for server-side operations)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your_client_id
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your-project.iam.gserviceaccount.com
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
```

### Email Configuration

```env
# SMTP Configuration (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Email Details
STORE_EMAIL=noreply@albaaqir.com
ADMIN_EMAIL=admin@albaaqir.com
```

### Store Configuration

```env
# Store Details (used in invoices and emails)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 3: Firebase Setup

### 3.1 Get Firebase Admin Credentials

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Copy the JSON credentials into your `.env.local`

**Important**: The private key must be formatted as a single line with `\n` for newlines:
```env
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
```

### 3.2 Enable Firebase Storage

1. Go to Firebase Console → Storage
2. Create a Storage bucket (if not exists)
3. Set Security Rules:

```json
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /invoices/{allPaths=**} {
      allow read: if request.auth != null || resource.metadata.isPublic == true;
      allow write: if request.auth.uid != null;
    }
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 3.3 Update Firestore Security Rules

Ensure `orders` collection allows reading invoiceUrl:

```json
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /orders/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Step 4: Email Service Setup

### Option A: Gmail (SMTP)

1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to myaccount.google.com → Security
   - Enable 2-Step Verification
   - Generate App Password for "Mail"
3. Use the 16-character password as `SMTP_PASS`

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
```

### Option B: SendGrid

1. Sign up at sendgrid.com
2. Create an API key
3. Configure:

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

### Option C: Custom SMTP

Update with your provider's SMTP credentials.

## Step 5: Update Store Information

Edit [app/lib/invoice.ts](app/lib/invoice.ts#L13-L20) to add your actual store details:

```typescript
const STORE_DETAILS = {
  name: "Al Baaqir",
  gst: "YOUR_GST_NUMBER",
  phone: "+91-YOUR-PHONE",
  email: "contact@albaaqir.com",
  address: "Your Store Address",
};
```

## Step 6: Test the System

### 6.1 Test Email Configuration

Create a test script at `scripts/test-email.ts`:

```typescript
import { verifyEmailConfiguration } from "@/app/lib/email";

async function test() {
  const verified = await verifyEmailConfiguration();
  console.log("Email configuration verified:", verified);
}

test();
```

Run:
```bash
npx ts-node scripts/test-email.ts
```

### 6.2 Manual Testing

1. Place a test order via Razorpay payment
2. Check Firebase Firestore for the order document
3. Verify invoice URL is stored in the order
4. Check admin email for order notification
5. Check customer email for order confirmation with invoice

## Step 7: Deployment

### Before Deploying:

1. **Test in Staging**: Deploy to a staging environment first
2. **Verify Emails**: Ensure admin and store emails are correct
3. **Check Credentials**: Verify all environment variables are set
4. **Test Invoices**: Generate and download a test invoice
5. **Monitor Logs**: Check cloud logs for any errors

### Environment Variables for Production:

```env
# Production URLs
NEXT_PUBLIC_APP_URL=https://your-production-domain.com

# Keep all other configuration same but verify credentials
```

### Deployment Platforms:

#### Vercel
1. Connect GitHub repository
2. Add environment variables in Settings → Environment Variables
3. Deploy

#### Docker/Self-Hosted
1. Create `.env.local` with all variables
2. Run `npm run build`
3. Run `npm start`

## Troubleshooting

### Issue: "Invalid signature" on Razorpay verification

**Solution**: 
- Verify `RAZORPAY_KEY_SECRET` is correct
- Check payment signature verification in `app/api/razorpay/verify/route.ts`

### Issue: Firebase Admin SDK initialization fails

**Solution**:
- Check `FIREBASE_PRIVATE_KEY` format (must have `\n` for newlines)
- Verify all Firebase Admin environment variables are set
- Download fresh credentials from Firebase Console

### Issue: Emails not sending

**Solution**:
- Verify SMTP credentials are correct
- Check email in spam folder
- Enable "Less secure app access" if using Gmail
- Check `SMTP_SECURE` and `SMTP_PORT` match your provider

### Issue: Invoice generation fails

**Solution**:
- Check order data is valid in Firestore
- Verify Firebase Storage bucket is accessible
- Check `FIREBASE_STORAGE_BUCKET` environment variable
- Review browser console for detailed error messages

### Issue: Invoice PDF looks corrupted

**Solution**:
- Check all order item data is valid (no null/undefined)
- Verify text values are properly stringified
- Check PDF size doesn't exceed Storage limits

## API Endpoints

### Generate Invoice
- **Endpoint**: `POST /api/invoices/generate`
- **Body**: `{ orderId: string }`
- **Returns**: `{ success: true, invoiceNumber, invoiceUrl, customerEmailSent, adminEmailSent }`

### Resend Invoice Email
- **Endpoint**: `POST /api/invoices/resend`
- **Body**: `{ orderId: string }`
- **Returns**: `{ success: true, message: string }`

## File Structure

```
app/
├── lib/
│   ├── invoice.ts          # PDF generation
│   ├── email.ts            # Email service
│   └── orders.ts           # Order management
├── api/
│   ├── invoices/
│   │   ├── generate/
│   │   │   └── route.ts    # Invoice generation API
│   │   └── resend/
│   │       └── route.ts    # Resend email API
│   └── razorpay/
│       └── verify/
│           └── route.ts    # Payment verification (updated)
├── order-success/
│   └── page.tsx            # Order success page (updated)
└── admin/
    └── orders/
        └── page.tsx        # Admin orders dashboard (updated)
```

## Security Considerations

1. **Private Keys**: Never commit `.env.local` to version control
2. **Email Credentials**: Use environment variables only
3. **Invoice URLs**: Use Firebase signed URLs (30-day expiry default)
4. **Admin Email**: Keep admin email private
5. **Payment Verification**: Always verify signatures on server-side

## Performance Optimization

1. **Async Invoice Generation**: Invoices are generated asynchronously after payment
2. **Caching**: Download URLs are cached for 30 days
3. **Email Queuing**: Consider using a queue service for high volume
4. **PDF Storage**: Invoices are stored in Firebase Storage, not database

## Monitoring

### Key Metrics to Monitor:

1. Invoice generation success rate
2. Email delivery success rate
3. Firebase Storage usage
4. API response times
5. Error rates in cloud logs

### Setup Cloud Logging:

In Firebase Console → Cloud Logging, create alerts for:
- Failed invoice generations
- Failed email sends
- Storage access errors

## Support & Maintenance

For issues or questions:
1. Check Firebase Console → Cloud Logging
2. Review browser console for client-side errors
3. Check email service provider's dashboard
4. Verify environment variables are correctly set

## Next Steps

1. ✅ Install dependencies
2. ✅ Configure Firebase
3. ✅ Setup email service
4. ✅ Add environment variables
5. ✅ Test locally
6. ✅ Deploy to production
7. ✅ Monitor and optimize

Happy invoicing! 🚀
