# NEP Security Audit — v8

## Fixed in this pass

### TOTP 3rd Factor (Part 1)
- Added `otpauth` + `qrcode.react` dependencies
- Extended `AdminAuthData` interface with `totpSecret`, `totpEnabled`, `totpSetupCompleted`
- New functions in `adminSessionService.ts`: `generateTotpSecret`, `verifyTotpCodeFromSecret`, `saveTotpSecret`, `verifyTotpCode`, `isTotpSetup`, `resetTotp`
- `AdminAuth.tsx`: new `totpSetup` and `totpVerify` steps — TOTP is now mandatory after password verification
- TOTP first-time: QR code shown, secret stored in component state only; saved to DB *after* user proves they can generate a valid code
- TOTP rate limit: 5 wrong codes → 15 min lockout + `notifyAdminSuspiciousActivity` call (same pattern as password)
- TOTP reset button in `SystemConfigManager.tsx` under "Güvenlik" section

### Kahoot Broadcast (Part 2)
- `SystemConfig` extended with `kahoot_link` and `kahoot_launched_at`
- `FALLBACK_CONFIG` includes `kahoot_link: ''`
- `saveSystemConfig` `onConflict` fixed: `'"id"'` → `'id'` (quoted column bug)
- `launchKahoot()` helper in `systemSettingsService.ts` — updates `kahoot_launched_at` timestamp to trigger all agents
- Admin UI: Kahoot link input next to Zoom link in the same grid row; separate "KAHOOT'U ŞİMDİ BAŞLAT" button with confirmation dialog
- `useKahootLauncher` hook: Supabase realtime listener opens link in new tab when `kahoot_launched_at` changes; uses `sessionStorage` to prevent re-opening on tab reload
- Popup-blocked fallback: dispatches `kahoot-popup-blocked` event → `AgentDashboard` shows manual "Aç" banner
- Admin dashboard (`UnifiedDashboard`) does NOT use `useKahootLauncher`

### Security Fixes (Part 3)
- **(A) Supabase `onConflict` quoted column**: `systemSettingsService.ts` line 67 — `'"id"'` → `'id'`
- **(D) URL hash cleanup**: already present in `useAuth.ts` (reads `access_token` then calls `history.replaceState`)
- **(E) Rate limits**:
  - Feedback submit: 1 per 60 seconds via `localStorage.rateLimit_feedbackSubmit`
  - Survey submit: 1 per 10 seconds via `sessionStorage.rateLimit_surveySubmit`
  - TOTP verify: 5 attempts / 15 min lockout (new, same pattern as password)
  - Admin password: 5 attempts / 15 min — already existed
  - Email OTP: 3 attempts / 3 min — already existed
  - Student login: `loginRateLimiter` — already existed
- **(F) Admin session token validation**: every 30s in `App.tsx` — already present, verified
- **(H) XSS via dangerouslySetInnerHTML**: grep found zero matches across the codebase — clean
- **(B) Hardcoded secrets**: `ncihoahtxsdsiethcwwa` appears only in `src/config/supabase.ts` — correct
- **`SECURITY_RLS.sql`**: created at project root with full policy recommendations and Phase 2 roadmap

---

## Known risks (Phase 2)

### HIGH — `nep_crypto_key` in localStorage
**What**: The AES-256-GCM key used to encrypt the TOTP secret (and other sensitive data) is stored in `localStorage` as a JSON array of bytes.  
**Why risky**: Any XSS or malicious extension can read `localStorage`. The key would be compromised, and thus so would the encrypted TOTP secret.  
**Mitigation now**: No `dangerouslySetInnerHTML` found; CSP is not configured but there are no known XSS vectors.  
**Phase 2 fix**: Derive the AES key from the admin password using PBKDF2 (or Argon2id via a WASM library). The raw key never touches storage. This requires password available at session start — feasible since admin enters password every login.

### HIGH — bcrypt hash readable by anon
**What**: `settings.admin_auth` is readable by the anonymous Supabase role. A motivated attacker who reads this row can attempt an offline bcrypt brute-force.  
**Why risky**: If admin uses a weak password, offline cracking is feasible. bcrypt cost=12 mitigates this significantly.  
**Phase 2 fix**: Move password verification to a Supabase Edge Function with `service_role` key. The hash never leaves the server.

### MEDIUM — TOTP secret encrypted with browser-local key
**What**: The TOTP base32 secret is encrypted with the `nep_crypto_key` before being stored in Supabase. Because the encryption key is in `localStorage`, anyone who can read localStorage can also decrypt the secret.  
**Dependency**: Linked to the `nep_crypto_key` risk above. Fix the key derivation, and this risk is resolved.

### MEDIUM — RLS policies are permissive
**What**: Current RLS allows anon read/write on all tables (required for app to function without Edge Functions).  
**Phase 2 fix**: See `SECURITY_RLS.sql` for the Phase 2 roadmap — restrict `settings.admin_auth` to service_role only.

### LOW — anon key is public
**What**: The Supabase anon key in `supabase.ts` is committed to the repo and visible in the browser bundle.  
**Why acceptable**: Anon keys are designed to be public; security relies on RLS. The current risk is low because the app's tables don't store highly sensitive user data beyond hashed credentials.  
**Action**: Ensure RLS is tight (see `SECURITY_RLS.sql`). Consider enabling Supabase's "Leaked key protection" if available.

---

## Recommended next steps (priority order)

1. **Run `SECURITY_RLS.sql`** — Enable RLS on all tables. Currently tables may be unprotected if RLS is off.

2. **Move admin auth to Edge Function** — bcrypt verification + TOTP check server-side. This is the single highest-impact security improvement.

3. **Replace localStorage AES key with PBKDF2 derivation** — Use the admin password as the KDF input. Key is derived fresh each session, never stored.

4. **Configure CSP headers** — Add `Content-Security-Policy` via Vite's HTML transform or a reverse proxy. A strict `script-src 'self'` removes the XSS risk class entirely.

5. **Enable Supabase Leaked Key Detection** — Rotates the anon key automatically if detected in a public repo scan.

6. **Add students auth.uid() mapping** — Phase 2 RLS: each student can only UPDATE their own row, not others'.

7. **Audit Firebase usage** — `src/config/firebase.ts` and `src/services/fcm.ts` are present. Ensure FCM tokens are not leaking sensitive data and Firebase rules are locked down.
