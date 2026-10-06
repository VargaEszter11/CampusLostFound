# Campus Lost & Found – Backend

Spring Boot 3 module with PostgreSQL, Flyway migrations, Spring Security (JWT), and JPA entities aligned to the frontend domain model.

No Docker required.

## Prerequisites

- PostgreSQL 16+ (local install **or** a free cloud DB such as [Neon](https://neon.tech))
- JDK 21+ (`winget install Microsoft.OpenJDK.21`)
- Maven 3.9+ (e.g. extract to `%USERPROFILE%\tools\apache-maven-3.9.16` and add its `bin` to PATH)

## Option A — Local PostgreSQL (Windows)

1. Install PostgreSQL from https://www.postgresql.org/download/windows/ (include Command Line Tools).
2. Open a terminal and create the app role + database (as the `postgres` superuser):

```bash
psql -U postgres -f backend/create-db.sql
```

If you prefer pgAdmin: create a login role `campus` / password `campus`, then a database `campus_lost_found` owned by `campus`.

Dev defaults used by `application.yml`:

| Setting  | Value               |
|----------|---------------------|
| Host     | `localhost:5432`    |
| Database | `campus_lost_found` |
| User     | `campus`            |
| Password | `campus`            |

## Option B — Neon (cloud, no local install)

1. Create a free project at https://neon.tech and copy the connection string.
2. Run the backend with env overrides (PowerShell example):

```powershell
$env:SPRING_DATASOURCE_URL="jdbc:postgresql://ep-xxxx.region.aws.neon.tech/neondb?sslmode=require"
$env:SPRING_DATASOURCE_USERNAME="your_neon_user"
$env:SPRING_DATASOURCE_PASSWORD="your_neon_password"
cd backend
mvn spring-boot:run
```

See [`.env.example`](.env.example) for the variable names.

## Migrations

Flyway runs automatically on Spring Boot startup. SQL lives in `src/main/resources/db/migration/`:

- `V1__init.sql` — schema (`users`, `items`, `reports`, `claims`, `handovers`)
- `V2__seed.sql` — demo users (Anna Kiss, Bence Tóth, Csenge Nagy)
- `V3__handover_code_varchar.sql` — handover code column type fix
- `V4__remove_seed_demo_data.sql` — drops old sample reports/items (users kept)
- `V5__auth_demo_passwords.sql` — sets BCrypt passwords for demo users (`demo123`), `password_hash` NOT NULL
- `V6__google_auth.sql` — nullable `password_hash` again, `google_sub` for Google Sign-In
- `V7__notifications.sql` — in-app `notifications` table

Prefer letting Flyway own migrations on Boot start.

## Run the backend

Your shell may still pick up an old **Java 8**. Prefer the PowerShell helper (sets JDK 21):

```powershell
cd C:\Users\varga\CampusLostFound\backend
.\run.ps1
```

Or manually:

```powershell
$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-21.0.12.101-hotspot"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
cd C:\Users\varga\CampusLostFound\backend
mvn spring-boot:run
```

Check first: `java -version` should show **21**, not 1.8.

Hibernate `ddl-auto` is `validate` (entities must match the Flyway schema).

## Auth API

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/register` | Create account (`displayName`, `email`, `password`) |
| `POST` | `/api/auth/login` | Login (`email`, `password`) → JWT |
| `POST` | `/api/auth/google` | Google Sign-In (`idToken`) → JWT; links by email if user exists |
| `GET` | `/api/auth/me` | Current user (requires `Authorization: Bearer …`) |

All other `/api/**` routes require a Bearer JWT. JWT secret: `app.jwt.secret` / env `APP_JWT_SECRET`.
Google client ID: `app.google.client-id` / env `GOOGLE_CLIENT_ID` (must match `VITE_GOOGLE_CLIENT_ID`).

Demo passwords: `demo123` for `anna.kiss@example.com`, `bence.toth@example.com`, `csenge.nagy@example.com`.

Example login:

```json
{ "email": "anna.kiss@example.com", "password": "demo123" }
```

Example Google login:

```json
{ "idToken": "<Google Identity Services credential JWT>" }
```

## Notifications API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/notifications` | List current user's notifications + `unreadCount` |
| `POST` | `/api/notifications/{id}/read` | Mark one notification read |
| `POST` | `/api/notifications/read-all` | Mark all read |

Created automatically on claim create/approve/reject and handover confirm.

## Reports API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/reports` | List reports (optional `?status=OPEN` or `CLOSED`) |
| `GET` | `/api/reports/{id}` | Get one report |
| `POST` | `/api/reports` | Create a report (reporter = authenticated user) |
| `POST` | `/api/reports/{id}/close` | Mark report `CLOSED` (reporter only) |

Example create body:

```json
{
  "type": "LOST",
  "itemName": "Blue backpack",
  "itemDescription": "Navy blue with laptop sleeve",
  "itemCategory": "Bag / backpack",
  "location": "Lecture hall B",
  "date": "2026-09-21",
  "reporterContact": "anna.kiss@example.com"
}
```

```powershell
curl -H "Authorization: Bearer <token>" "http://localhost:8080/api/reports?status=OPEN"
```

## Claims & handovers API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/reports/{reportId}/claims` | Claims on a report (reporter only) |
| `GET` | `/api/reports/{reportId}/handover` | Approved handover (reporter or claimant) |
| `GET` | `/api/claims` | Claims for the authenticated user |
| `POST` | `/api/claims` | Submit a claim (claimant = authenticated user) |
| `POST` | `/api/claims/{id}/approve` | Approve (reporter only; rejects other pending) |
| `POST` | `/api/claims/{id}/reject` | Reject a pending claim (reporter only) |

## Handovers API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/handovers` | Handovers where the user is reporter or claimant |
| `POST` | `/api/handovers/{id}/confirm` | Confirm handover + close report |

Also available via report routes: `GET /api/reports/{id}/handover`.

Create claim body:

```json
{
  "reportId": "<open-report-uuid>",
  "claimantContact": "bence.toth@example.com",
  "reason": "My student ID is inside"
}
```

## Project layout

```
backend/src/main/java/hu/campus/lostfound/
  LostFoundApplication.java
  auth/         JWT + Spring Security, login/register/Google
  notification/ In-app notifications
  report/       Report + Item entities, repos, service, DTOs, report access policy
  claim/        Claim entity, repo, service, controller, DTOs
  handover/     Handover entity, repo, service, controller, DTOs
  workflow/     Application layer: claim approval, handover queries, report views, report/claim controllers
  user/         User entity, repo, service
  shared/       Exceptions, CORS, API error handler
```
