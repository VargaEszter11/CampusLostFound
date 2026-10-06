# Architecture issues

## Backend

- [x] Break the package cycle: `report` imports `claim` and `handover`, `claim` imports `report`, `handover` imports `claim` and `report`
- [x] Move "only the reporter can approve, reject, or close" checks into one policy instead of repeating them in `ReportService`, `ClaimService`, and `HandoverService`
- [x] Replace public `setStatus` on `Report` and `Claim` with domain methods (`close()`, `approve()`, `reject()`)
- [x] Move `ReportClaimController` out of `report` into `claim`, since its endpoints are claim and handover endpoints
- [x] Remove the duplicate notification code in `ClaimService` and `HandoverService` (both send the "Handover confirmed" notification)
- [ ] Add tests for state transitions (approve, reject, confirm, close) and contact visibility
- [x] `User` has public setters (`setPasswordHash`, `setGoogleSub`, `setDisplayName`); replace them with domain methods like `Report` and `Claim`
- [x] `App.tsx` holds session, tab, and focus state; split it into hooks or a container component

## Frontend

- [x] Rename `src/storage/` to `src/services/`, since it holds API clients, not storage
- [x] Remove duplicated shapes: `ApiReport`, `ApiClaim`, `HandoverListItem`, and `AppNotification` repeat fields from `domain/types.ts`
- [x] Move ownership and status checks (`isSameUser`, `status === 'APPROVED'`) out of `ReportList`, `ReportDetailsModal`, and `MyClaims` into one helper
- [x] Split `ReportList`, `ReportDetailsModal`, and `LoginScreen` (each 290–320 lines) into data-loading hooks and presentational components
- [ ] Add tests (none exist for the frontend yet)
- [x] Move the `localStorage` session code out of `services/authStore.ts` into its own `session` module, so `services/` only holds API clients
- [x] Route `useGoogleSignIn` and `useLoginForm` through `services/` instead of importing `api/authApi` directly
- [x] Move data loading and submit logic out of `MyClaims`, `MyHandovers`, `NotificationBell`, `ReportForm`, `ClaimForm`, and `ReportDetailsModal` into hooks (components call `services/` directly today, unlike the rest of the app)
- [x] Move `AUTH_EXPIRED_EVENT` out of `api/http.ts` into `session/` so `useSession` doesn't import from `api/`
