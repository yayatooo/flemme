# Auth v1 A3 — Email / Password

## Active framework surface

- POST `/auth/sign-up/email`: required framework `name`, `email`, `password`.
- POST `/auth/sign-in/email`: email/password.
- POST `/auth/sign-out`: cookie plus trusted Origin.
- GET `/auth/get-session`: cookie restoration; 200/null without valid session.

Enabled=true, disableSignUp=false, requireEmailVerification=false,
autoSignIn=true, minPasswordLength=8, maxPasswordLength=128. No complexity rules.
Users remain emailVerified=false. Name follows Better Auth's required string
contract (not a new Product Domain name policy); Profile displayName is unrelated.

## Identity and password preservation

Both JSON password endpoints trim/lowercase emails in a Better Auth request
plugin before framework email validation. No provider-specific transformations.
Auth-only user, credential account and session rows are created; no Profile,
Household, Kitchen, Inventory, Favorite or credits initialization.
UUID is identical across user, credential userId/accountId and session userId.
Bun Argon2id hashing/verifying remains the custom password implementation.
The migrated seed logs in with its original password; hash bytes stay unchanged.

Successful JSON token fields are removed by a response plugin, preserving
native payloads otherwise, status and Set-Cookie headers. Neither plaintext
password nor stored hash is returned. Cookie jars, not browser storage, carry
sessions. This intentionally omits Better Auth's redundant token JSON field;
future client integration must use cookie-based session operations.

## Observed contracts

| Case | HTTP / response |
| --- | --- |
| Signup/login success | 200; user; cookie (no JSON token) |
| Exact/case duplicate | 422 USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL |
| Wrong password or unknown email | 401 INVALID_EMAIL_OR_PASSWORD; identical body |
| Missing name / invalid email | 400 framework validation error |
| Password 7 / 129 characters | 400 PASSWORD_TOO_SHORT / PASSWORD_TOO_LONG |
| Password 8 / 128 characters | accepted |
| Unauthenticated/restored-after-logout | 200 null |
| Sign-out | 200; session deleted; cookie Max-Age=0 |
| Hostile cookie-bearing origin | 403 INVALID_ORIGIN |
| Excess requests | 429; X-Retry-After header |

Native duplicate errors reveal that an email is registered; this is the pinned
framework's behavior with the approved autoSignIn=true / no-verification policy.
No extra existence endpoint or custom credential distinction is introduced.

## Sessions and safeguards

Seven-day DB sessions, daily renewal, no cookie cache, HttpOnly host-only
SameSite=Lax cookies; Secure for HTTPS/production. Multiple sessions are allowed;
sign-out removes only the current session. Replay of its old cookie returns null.
Origin/CSRF protection stays enabled; WEB_ORIGIN is the only CORS frontend origin.
Built-in memory rate limiting: password endpoints 20/60 seconds, general 100/60.
No Redis. Counters are process-local and reset on restart. The current Bun
entry point has no trusted client-IP integration and uses a shared per-path
fallback bucket. Before production, establish trusted transport/proxy IPs and
multi-instance enforcement; do not blindly trust attacker-supplied headers.

Google and linking stay disabled. Password reset/email verification have no
delivery configuration; no recovery feature or account-management wrappers added.
Product Domain endpoints still require x-flemme-user-id, even with an Auth
cookie. A5 owns session→currentUserId; A7 owns web integration. Production startup
guard remains in place until A8. No migration, frontend change or /auth/me.

## Manual cookie-jar workflow

Start API with the documented Auth environment variables. Use a disposable
email (requests persist real records). With curl, use `-c <private-jar-path>`
to capture cookies and `-b <private-jar-path>` on later requests. Send
`Origin: http://localhost:5173` and `Content-Type: application/json` on POST.

1. Signup body: `{"name":"Rahmat","email":"<new-email>","password":"<8-128-character-password>"}`.
2. GET get-session with the jar; verify user UUID and session userId.
3. POST sign-out with `{}` and jar; GET session returns null.
4. POST sign-in/email with existing migrated seed email/password and a fresh jar.
5. Restore session; sign out. Do not reseed or replace the hash to fix login.

Keep cookie jars private and delete them after testing. Do not paste tokens or
passwords into reports. Better Auth framework schemas are not duplicated in
Flemme OpenAPI; DevelopmentUser documentation remains on domain endpoints.

## Validation

`bun --env-file=../../.env test src/auth/password-auth.integration.test.ts`
from apps/api runs real DB/password/session tests. It requires the migrated
development seed for the explicit legacy-login gate and fails if absent.
Do not recreate the seed to claim migration compatibility.

Set A3_RUNTIME_URL to a running API origin to run the same cookie-jar tests over
real HTTP. The target must use the documented localhost WEB_ORIGIN and test DB.
Test users and newly created seed sessions are cleaned up, not pre-existing
sessions. A rate-limit test exhausts its password endpoint bucket: use an isolated
development process and stop it afterward or wait for its window to expire.

Runtime acceptance passed with a process-only random secret, no .env writes:
registration/restore/logout and original seed login/restore/logout. Temporary API
was stopped. Auth v1 is not complete; next task is A4 Google login/registration.
