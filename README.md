This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Project Setup Requirements

### Firebase Configuration
1. **Admin Credentials**: You can use either a service account file or environment variables.
   - **Option A (File)**: Place `service-account.json` in the root and set `FIREBASE_SERVICE_ACCOUNT_PATH=./service-account.json`.
   - **Option B (Env Vars - Recommended)**: Set the following in your environment:
     - `FIREBASE_PROJECT_ID`
     - `FIREBASE_CLIENT_EMAIL`
     - `FIREBASE_PRIVATE_KEY` (include `\n` for newlines)
### Razorpay Configuration
1. **API Keys**: Get your Test/Live keys from the Razorpay Dashboard.
2. **Environment Variables**: Set the following in Vercel/Environment:
   - `RAZORPAY_KEY_ID`: Your public Key ID.
   - `RAZORPAY_KEY_SECRET`: Your secret Key.
   - *Note*: The frontend automatically receives the `keyId` from the secure server-side order creation API.

### Visual Identity & Assets
1. **Hero Banner**: The homepage uses a premium luxury hero section designed for a 1920x900 image.
   - **Asset Path**: Save your high-resolution luxury banner as `public/images/hero-watch.jpg`.
2. **Header Behavior**: The header uses a dynamic transparency effect. It is transparent on top of the hero banner and transitions to a blurred white background upon scrolling.
3. **Typography**: Uses bold, wide-tracked uppercase typography for navigation to align with premium watch brand aesthetics.

### Shiprocket Configuration
1. **API Credentials**: Get your credentials from the Shiprocket Settings -> API -> Configure.
2. **Environment Variables**: Set the following in Vercel:
   - `SHIPROCKET_EMAIL`: The email used for Shiprocket login.
   - `SHIPROCKET_PASSWORD`: The password used for Shiprocket login.
3. **Pickup Location**: The integration defaults to a pickup location named "Primary". Ensure this exists in your Shiprocket panel under Settings -> Pickup Locations.

### Features
1. **Online Payment Discount**: Automatically offers a 10% discount when selecting Razorpay at checkout.
2. **Inventory Management**: Real-time stock deduction for both main products and specific variants during checkout.

### Firestore Indexes
   - **Order Search**: `phone` (Ascending) + `createdAt` (Descending)
   - **Order Management**: `status` (Ascending) + `createdAt` (Descending)
3. **Storage Rules**: Ensure Firebase Storage rules allow writes to the `products/` path using Firebase Auth.
   - **Production Rules**:
     ```javascript
     rules_version = '2';
     service firebase.storage {
       match /b/{bucket}/o {
         match /products/{allPaths=**} {
           allow read: if true;
           allow write: if request.auth != null;
         }
       }
     }
     ```
   - *Note*: The admin dashboard automatically signs in to Firebase Auth anonymously upon login to satisfy these rules.
4. **CORS Configuration**: If you see CORS errors during upload, you must set the CORS policy for your bucket using `gsutil`.

You can create Firestore indexes by clicking the links generated in the console logs/terminal when the app encounters a `FirebaseError`.
