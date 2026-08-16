# Login Redesign & Advanced Auth Plan

Redesign the login/signup experience to match the requested two-column dark aesthetic and enable free Google/email authentication.

> Current status: Phone/SMS authentication was intentionally removed from the live implementation because SMS verification is not part of the always-free path. The notes below preserve the original design history only.

## User Review Required

> [!IMPORTANT]
> **Phone Authentication** requires a `recaptcha-container` element in the DOM for the invisible human verification step.
> **Google & Facebook/Apple** icons will be used as per the reference image, but only Google is currently configured in Firebase.

## Proposed Changes

### 1. Authentication Layer
#### [MODIFY] [AuthContext.tsx](file:///c:/Users/chava/Downloads/u/client/src/context/AuthContext.tsx)
- Add `signInWithPhone(phoneNumber: string)` and `verifyCode(otp: string)` methods.
- Manage `confirmationResult` state for the verification flow.

### 2. Login Page Redesign
#### [MODIFY] [Login.tsx](file:///c:/Users/chava/Downloads/u/client/src/pages/Login.tsx)
- Implement a two-column responsive layout (stack on mobile, side-by-side on desktop).
- **Left Column**:
  - Brand Logo & Header.
  - Tab switcher or toggle between Email/Phone login.
  - Social login grid (Google, etc.) with the new icon-style buttons.
- **Right Column**:
  - Immersive card with a gradient background and testimonial quote as seen in the reference image.
- **Styling**:
  - Use a dark theme (background `#09090b` or similar) to match the visual provided.
  - Apply project's `--color-accent` (`#F4511C`) for buttons and active states.

### 3. Firebase Helper
#### [MODIFY] [firebase.ts](file:///c:/Users/chava/Downloads/u/client/src/lib/firebase.ts)
- Export `RecaptchaVerifier` and `signInWithPhoneNumber` from `firebase/auth`.

---

## Verification Plan
### Automated Tests
- Run `npm run build` to ensure no lint/type errors in the new UI.
- Verify `AuthContext` exports the new phone auth methods.

### Manual Verification
1. Open `/login`:
   - Verify the two-column layout is responsive.
   - Test Google Sign-in flow.
   - Test Phone Number flow (verify Recaptcha and OTP input appear).
   - Verify "Sign up" toggle works correctly.
