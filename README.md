# Baaqir Lifestyle - Professional Seller Panel

This is a luxury e-commerce platform bootstrapped with [Next.js](https://nextjs.org).

## Overview
The **Baaqir Lifestyle Admin Dashboard** has been transitioned into a high-performance **Seller Panel** designed for Md Munna, featuring real-time logistics, deep analytics, and automated inventory management.

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
1. **Hero Banner**: The homepage uses a luxury split-hero section. 
   - **Asset Path**: Save your high-resolution banner as `public/images/hero banner .png`.
   - **Recommended Size**: `1200px x 1060px` (Portrait/Square ish) for the side-box layout, or `1920px x 900px` for full-width.
2. **Header Behavior**: The header uses a dynamic transparency effect. It is transparent on top of the hero banner and transitions to a blurred white background (`bg-brand-off-white/95`) upon scrolling.
3. **Typography**: Uses bold, wide-tracked uppercase typography for navigation to align with premium watch brand aesthetics.

### Shiprocket Configuration
1. **API Credentials**: Get your credentials from the Shiprocket Settings -> API -> Configure.
2. **Environment Variables**: Set the following in Vercel:
   - `SHIPROCKET_EMAIL`: The email used for Shiprocket login.
   - `SHIPROCKET_PASSWORD`: The password used for Shiprocket login.
3. **Pickup Location**: The integration defaults to a pickup location named "Home". Ensure this exists in your Shiprocket panel under Settings -> Pickup Locations.
4. **Webhooks**: To enable automated RTO and Status updates, configure your webhook URL in Shiprocket to: `https://www.albaaqir.com/api/shiprocket/webhook`.

### Features
1. **Professional Seller Panel**: Live dashboard featuring real-time sales stats, order health tracking, and an automated action center.
2. **Growth Analytics**: Advanced KPI cards with week-over-week comparison logic for Revenue, Orders, and Average Order Value (AOV).
3. **Shiprocket Logistics Hub**: 
   - Real-time AWB tracking via secure server-side proxy.
   - Bulk Manifest generation and batch label printing.
   - Live Wallet balance tracking with auto-recharge alerts.
   - **Automated RTO & Returns**: Real-time status sync via Webhooks with automatic inventory restock logic.
4. **Inventory Auditing**: Professional inventory management with inline stock editing and reason-based auditing (Damaged, Restock, etc.).
5. **Customer Insights**: Live Firestore-backed customer database with purchase history and VIP status tiering.
6. **Online Payment Discount**: Automatically offers a 10% discount when selecting Razorpay at checkout.
7. **Inventory Sync**: Real-time stock deduction for both main products and specific variants during checkout.
8. **Mandatory Customer Login**: Secure checkout flow requiring users to sign in before adding items to the bag or placing orders, ensuring accurate order tracking and customer history.

### Firestore Indexes
   - **Order Search**: `phone` (Ascending) + `createdAt` (Descending)
   - **Order Management**: `status` (Ascending) + `createdAt` (Descending)
### Firestore Security
1. **Firestore Rules**: Ensure `firestore.rules` allows authenticated admin access.
2. **Storage Rules**: Ensure `storage.rules` allows authenticated writes.
3. **CORS Configuration**: If you see CORS errors during upload, you must set the CORS policy for your bucket using `gsutil`.

You can create Firestore indexes by clicking the links generated in the console logs/terminal when the app encounters a `FirebaseError`.
