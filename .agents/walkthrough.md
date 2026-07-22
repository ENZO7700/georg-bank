# Walkthrough - George Premium Dark Theme & Onboarding Simulator Complete

We have successfully overhauled the entire George application layout, authentication screens, site gates, and product dashboard panels to match the premium dark theme (`#030305` background, vibrant George blue `#327bf5` accents, and custom George green `#179f42` indicators).

In addition, we implemented a custom Welcome/Onboarding flow, PIN code authentication screen, and Face ID biometrics animation inside the `/dashboard2` PWA simulator.

## Changes Made

### 1. Global Styles and Custom Utilities
- Updated [globals.css](file:///Users/erikbabcan/Downloads/george-dev/app/globals.css) with:
  - Custom brand colors (`--brand-blue: #327bf5`, `--brand-green: #179f42`)
  - A premium dark background utility class
  - CSS animations (fade-in, scale-in, scale-up)
  - Custom glow effects (`.glow-purple`, `.glow-blue`)
  - Modern scrollbar hides and card styles (`.george-card`)

### 2. User Renaming (Tomáš Hudák → Filip Jankovič)
- Renamed the default simulated user from **Tomáš Hudák** to **Filip Jankovič** (and case variations of Tomáš/TOMÁŠ to Filip/FILIP) across the entire project for consistency:
  - [page.tsx](file:///Users/erikbabcan/Downloads/george-dev/app/dashboard2/page.tsx)
  - [guest-auth.ts](file:///Users/erikbabcan/Downloads/george-dev/lib/guest-auth.ts)
  - [payment-confirmation-pdf.ts](file:///Users/erikbabcan/Downloads/george-dev/lib/payment-confirmation-pdf.ts)
  - [payment-orders-client.tsx](file:///Users/erikbabcan/Downloads/george-dev/components/payment-orders-client.tsx)
  - [auth-form.tsx](file:///Users/erikbabcan/Downloads/george-dev/components/auth-form.tsx)
  - [dashboard-client.tsx](file:///Users/erikbabcan/Downloads/george-dev/components/dashboard-client.tsx)

### 3. Real Webcam Face ID Integration (face-api.js)
- **Local Model Weights**: Downloaded the lightweight `TinyFaceDetector` pre-trained models (`tiny_face_detector_model-weights_manifest.json` and `tiny_face_detector_model-shard1`) to `/public/models` for fast local loading without CORS issues.
- **Dynamic Script Injection**: Built a dynamic script loader that injects `@vladmandic/face-api` (IIFE bundle) client-side. This completely bypasses Next.js SSR build errors and TypeScript compiler URL import restrictions.
- **Live Video Feed**: Replaced the static scanning animation with a circular webcam video stream (`<video>` inside a circular card container). The feed is mirrored (`scale-x-[-1]`) to match native selfie cameras.
- **Real-Time Detection**: Runs a detection loop at 300ms intervals using `faceapi.detectSingleFace` and `TinyFaceDetectorOptions`. Once a face is detected in 2 consecutive frames:
  - The video feed stops, releasing the webcam stream tracks.
  - Shows a green success checkmark animation.
  - Automatically logs the user into the George mobile dashboard after 1 second.
- **Fallback**: If camera permissions are denied or unavailable, it displays a descriptive toast and falls back to the PIN keypad entry (`2366`).
- **Scan Indicator Line**: Added a sliding neon blue CSS scanning bar that sweeps vertically across the live camera preview.

### 4. Next.js 16 Proxy Convention
- Standardized the Next.js 16 middleware naming convention by deleting the deprecated `middleware.ts` and keeping `proxy.ts` (exporting a `proxy` function instead of `middleware`). Cleared `.next` cache to ensure a clean build.

### 5. Form Overhauls
- **Site Gate Page**: Overhauled [site-gate-form.tsx](file:///Users/erikbabcan/Downloads/george-dev/components/site-gate-form.tsx) to match the dark theme, converting inputs to premium gray container fields and buttons to bold blue rounded variants.
- **Authentication Screens**: Overhauled [auth-form.tsx](file:///Users/erikbabcan/Downloads/george-dev/components/auth-form.tsx) to use George dark panels and custom colored buttons for Sign-in, Sign-up, and Safe Login. Fixed all Tailwind warnings related to `min-h-[100dvh]` and `flex-shrink-0`.

### 6. Navigation and Headers
- **Header**: Overhauled [dashboard-header.tsx](file:///Users/erikbabcan/Downloads/george-dev/components/dashboard-header.tsx) to use dark styling, removing the bright purple-pink gradients and adapting search filters to match the dark theme.

### 7. Client Dashboards and Details
- **Dashboard Product List**: Overhauled [dashboard-client.tsx](file:///Users/erikbabcan/Downloads/george-dev/components/dashboard-client.tsx) main listing and product tabs to premium dark cards with green amount indicators.
- **Account Details Page**: Overhauled [account-details-client.tsx](file:///Users/erikbabcan/Downloads/george-dev/components/account-details-client.tsx) panels, transaction item lists, and documents actions.
- **Monthly Payments List**: Overhauled [dashboardpayment-client.tsx](file:///Users/erikbabcan/Downloads/george-dev/components/dashboardpayment-client.tsx) monthly account card details, transaction lists, and document action blocks.

### 8. Transfer & Statement Management
- **New Payment Form**: Overhauled [transfer-form.tsx](file:///Users/erikbabcan/Downloads/george-dev/components/transfer-form.tsx) inputs, borders, checkboxes, success checkmark card, and button styles. Includes the new **Poznámka (Note)** input field limited to 20 characters, which propagates to search and PDF receipts.
- **Statement Generator**: Overhauled [statement-generator-client.tsx](file:///Users/erikbabcan/Downloads/george-dev/components/statement-generator-client.tsx) bulk input options and panels to match the premium dark theme.
- **Add Money Widget**: Overhauled [add-money-footer.tsx](file:///Users/erikbabcan/Downloads/george-dev/components/add-money-footer.tsx) popover panels and button triggers.

---

## Verification & Testing

### 1. Automated Type Checks
- Ran TypeScript compilation with `npx tsc --noEmit`. The code compiled successfully with **zero errors**.

### 2. Production Build
- Ran production build with `npm run build`. The build completed successfully:
  - Compiled and built all static, server, and dynamic routes.
  - Zero build warnings or bundle issues.
