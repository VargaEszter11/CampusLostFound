# API Reference

Base path: `/api`. All request/response bodies are JSON. All endpoints except `POST /api/auth/register`, `POST /api/auth/login`, and `POST /api/auth/google` require a `Authorization: Bearer <jwt>` header; `/api/admin/**` additionally requires the caller's email to be in `app.admin.emails`.

## Error shape

Every error response (except the one `ResponseStatusException` noted below) has this shape:

```json
{ "error": "Human-readable message" }
```

Bean-validation failures (`@Valid` body) additionally include a `fields` map:

```json
{ "error": "Validation failed", "fields": { "itemName": "must not be blank" } }
```

| Status | Meaning |
|---|---|
| 400 | Bad request — validation failure or a domain rule violation |
| 401 | Missing/invalid JWT |
| 403 | Authenticated, but not allowed to perform this action |
| 404 | No entity with that id |
| 500 | Unexpected server error (logged server-side; client only sees `"Something went wrong"`) |

CORS is restricted to `http://localhost:5173` / `http://127.0.0.1:5173`.

---

## Auth — `/api/auth`

### `POST /api/auth/register` — public

**Body** (`RegisterRequest`):
| Field | Type | Rules |
|---|---|---|
| `displayName` | string | required, max 255 |
| `email` | string | required, valid email, max 255 |
| `password` | string | required, 6–100 chars |

**201 → `AuthResponse`**: `{ token, userId, displayName, email, admin }`

**Errors**: 400 "Display name is required" · 400 "Enter a valid email address" · 400 "Password must be at least 6 characters" · 400 "An account with this email already exists"

### `POST /api/auth/login` — public

**Body** (`LoginRequest`): `email` (required, valid email), `password` (required)

**200 → `AuthResponse`**

**Errors**: 400 "Invalid email or password" · 400 "This account uses Google Sign-In. Continue with Google."

### `POST /api/auth/google` — public

**Body** (`GoogleLoginRequest`): `idToken` (required string)

**200 → `AuthResponse`**

**Errors** (all 400): "Google Sign-In is not configured on the server" · "Google ID token is required" · "Invalid Google ID token" · "Google email is not verified" · "Google account has no email" · "Could not verify Google ID token"

### `GET /api/auth/me` — authenticated

**200 → `AuthResponse`** for the current user.

**Errors**: 401 if the token is missing/invalid · 403 "Authenticated user no longer exists" if the user row was deleted after the token was issued.

---

## Reports — `/api/reports`

`ReportResponse`: `{ id, type, item: { id, name, description, category }, location, date, reporterName, reporterContact, status, createdAt }`.
`reporterContact` is **redacted to `null`** unless the viewer is the reporter, or a participant in a confirmed handover for that report.

### `GET /api/reports` — authenticated

**Query**: `status` (optional — `OPEN` | `CLOSED`; omit for all)

**200 → `ReportResponse[]`**

### `GET /api/reports/{id}` — authenticated

**200 → `ReportResponse`**

**Errors**: 404 "Report not found: {id}"

### `POST /api/reports` — authenticated

**Body** (`CreateReportRequest`):
| Field | Type | Rules |
|---|---|---|
| `type` | `LOST` \| `FOUND` | required |
| `itemName` | string | required, max 255 |
| `itemDescription` | string | optional, max 4000 |
| `itemCategory` | string | optional, max 100 |
| `location` | string | required, max 255 |
| `date` | date | required, today or earlier |
| `reporterContact` | string | required, max 255, email or phone |

**201 → `ReportResponse`** (`reporterContact` visible to the creator)

**Errors**: 400 validation failures · 400 "Contact is required" · 400 "Enter a valid email address or phone number"

### `POST /api/reports/{id}/close` — authenticated

**200 → `ReportResponse`** (status now `CLOSED`)

**Errors**: 404 "Report not found: {id}" · 403 "Only the reporter can close this report"

> Closing an already-closed report succeeds silently (no idempotency guard).

### `DELETE /api/reports/{id}` — authenticated

**204 No Content**. Cascades: deletes the report's claims, then the report, then its item.

**Errors**: 404 "Report not found: {id}" · 403 "Only the reporter can delete this report" · 400 "Cannot delete a report with an approved claim"

### `GET /api/reports/{reportId}/claims` — authenticated

**200 → `ClaimResponse[]`** — claims on this report.

**Errors**: 404 "Report not found: {reportId}" · 403 "Only the reporter can view claims on this report"

### `GET /api/reports/{reportId}/handover` — authenticated

**200 → `HandoverResponse`**: `{ id, claimId, handoverCode, confirmed, date }`

**Errors**: 404 "Report not found: {reportId}" · 404 "No handover for this report" (⚠ this one is a raw `ResponseStatusException`, so its body may not follow the standard `{"error": ...}` shape) · 403 "You cannot view this handover" (caller is neither the reporter nor the claimant)

---

## Claims — `/api/claims`

`ClaimResponse`: `{ id, reportId, claimantName, claimantContact, reason, status }` (`status`: `PENDING` | `APPROVED` | `REJECTED`)

### `GET /api/claims` — authenticated

**200 → `ClaimResponse[]`** — claims submitted by the current user, newest first.

### `POST /api/claims` — authenticated

**Body** (`CreateClaimRequest`):
| Field | Type | Rules |
|---|---|---|
| `reportId` | UUID | required |
| `claimantContact` | string | required, max 255, email or phone |
| `reason` | string | optional, max 4000 |

**201 → `ClaimResponse`**. Notifies the reporter (`CLAIM_CREATED`).

**Errors**: 400 validation/contact failures · 404 "Report not found: {reportId}" · 400 "This item was already handed over" (report not `OPEN`) · 400 "This report already has an approved claim" · 400 "You cannot claim your own report"

### `POST /api/claims/{id}/reject` — authenticated

**200 → `ClaimResponse`** (status `REJECTED`). Notifies the claimant (`CLAIM_REJECTED`).

**Errors**: 404 "Claim not found: {id}" · 403 "Only the reporter can reject claims" · 400 "This claim was already resolved" (not `PENDING`)

### `POST /api/claims/{id}/approve` — authenticated

**200 → `HandoverResponse`** — a new, unconfirmed handover with a freshly generated 6-digit code.

Side effects: every other `PENDING` claim on the report is auto-rejected (each notified `CLAIM_REJECTED`); the approved claimant is notified `CLAIM_APPROVED`.

**Errors**: 404 "Claim not found: {id}" · 403 "Only the reporter can approve claims" · 400 "This item was already handed over" · 400 "This report already has an approved claim" · 400 "This claim was already resolved"

---

## Handovers — `/api/handovers`

### `GET /api/handovers` — authenticated

**200 → `HandoverListItemResponse[]`** — all handovers where the caller is reporter or claimant:
`{ id, claimId, reportId, itemName, reportType, handoverCode, confirmed, date, reporterName, claimantName, claimantContact, reporterContact, yourRole }` (`yourRole`: `"REPORTER"` | `"CLAIMANT"`)

### `POST /api/handovers/{id}/confirm` — authenticated

**200 → `HandoverResponse`**. Closes the parent report and notifies the *other* party (`HANDOVER_CONFIRMED`).

**Errors**: 404 "Handover not found: {id}" · 403 "Only the reporter or claimant can confirm handover" · 400 "This item was already handed over" (already confirmed)

---

## Notifications — `/api/notifications`

`NotificationResponse`: `{ id, type, title, body, reportId, claimId, handoverId, read, createdAt }` (`type`: `CLAIM_CREATED` | `CLAIM_APPROVED` | `CLAIM_REJECTED` | `HANDOVER_CONFIRMED`)

### `GET /api/notifications` — authenticated

**200 → `NotificationListResponse`**: `{ items: NotificationResponse[], unreadCount }`

### `POST /api/notifications/{id}/read` — authenticated

**200 → `NotificationResponse`** (now `read: true`), scoped to the caller's own notifications.

**Errors**: 404 "Notification not found: {id}" (not found, or not owned by caller)

### `POST /api/notifications/read-all` — authenticated

Marks all of the caller's notifications read. **200 → `NotificationListResponse`** (refreshed; `unreadCount` is now 0).

### `DELETE /api/notifications/{id}` — authenticated

**204 No Content**, scoped to the caller's own notifications.

**Errors**: 404 "Notification not found: {id}"

---

## Categories — `/api/categories`

### `POST /api/categories/suggest` — authenticated

**Body** (`SuggestCategoryRequest`): `itemName` (required, max 255), `itemDescription` (optional, max 4000)

**200 → `SuggestCategoryResponse`**: `{ category }` — always one of: `Electronics`, `Clothing`, `Bag / backpack`, `ID / document`, `Keys`, `Jewelry / watch`, `Book / notes`, `Other` (falls back to `Other` if the LLM returns something unrecognized).

Calls the DeepSeek chat-completions API (`app.deepseek.base-url`, default `https://api.deepseek.com`; model from `app.deepseek.model`, default `deepseek-chat`) with a system prompt constraining it to the fixed category list.

**Errors**: 400 validation failures · 400 "Category suggestion is not configured on the server" (`app.deepseek.api-key` unset) · 400 "Could not get a category suggestion" (any downstream failure — network, bad response, unparseable JSON)

---

## Admin — `/api/admin` (role `ADMIN` required)

Admin status is derived per-request from `app.admin.emails` (comma-separated, case-insensitive) and baked into the JWT's role claim at login. Any non-admin request to `/api/admin/**` gets 401 (no token) or 403 (valid token, not an admin).

### `GET /api/admin/reports` — admin only

**200 → `AdminReportResponse[]`** — every report in the system, with no contact redaction:

```
{
  id, type, item: { id, name, description, category },
  location, date, reporterName, reporterEmail, reporterContact,
  status, createdAt,
  claimCount, pendingClaimCount,
  handover: null | {
    id, claimantName, claimantEmail, claimantContact,
    handoverCode, confirmed, confirmedAt
  }
}
```

`handover` is present if the report has any handover record at all (not necessarily confirmed). This is a **read-only** endpoint — there are currently no admin write/delete endpoints.
