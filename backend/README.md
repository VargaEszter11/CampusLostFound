# Campus Lost & Found – Backend

Spring Boot 3 module with PostgreSQL, Flyway migrations, and JPA entities aligned to the frontend domain model.

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
- `V2__seed.sql` — demo users for mock login (Anna Kiss, Bence Tóth, Csenge Nagy)
- `V3__handover_code_varchar.sql` — handover code column type fix
- `V4__remove_seed_demo_data.sql` — drops old sample reports/items (users kept)

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

## Reports API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/reports` | List reports (optional `?status=OPEN` or `CLOSED`) |
| `GET` | `/api/reports/{id}` | Get one report |
| `POST` | `/api/reports` | Create a report |
| `POST` | `/api/reports/{id}/close` | Mark report `CLOSED` |

Example create body:

```json
{
  "type": "LOST",
  "itemName": "Blue backpack",
  "itemDescription": "Navy blue with laptop sleeve",
  "itemCategory": "Bag / backpack",
  "location": "Lecture hall B",
  "date": "2026-09-21",
  "reporterName": "Anna Kiss",
  "reporterContact": "anna.kiss@example.com"
}
```

```powershell
curl "http://localhost:8080/api/reports?status=OPEN"
```

## Claims & handovers API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/reports/{reportId}/claims` | Claims on a report |
| `GET` | `/api/reports/{reportId}/handover` | Approved handover (404 if none) |
| `POST` | `/api/reports/{reportId}/handover/confirm` | Confirm handover + close report |
| `GET` | `/api/claims?claimantName=…` | Claims by claimant display name |
| `POST` | `/api/claims` | Submit a claim |
| `POST` | `/api/claims/{id}/approve` | Approve (rejects other pending; returns handover) |
| `POST` | `/api/claims/{id}/reject` | Reject a pending claim |

## Handovers API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/handovers?participantName=…` | Handovers where the user is reporter or claimant |
| `POST` | `/api/handovers/{id}/confirm` | Confirm handover + close report |

Also available via report routes: `GET/POST /api/reports/{id}/handover[/confirm]`.

Create claim body:

```json
{
  "reportId": "<open-report-uuid>",
  "claimantName": "Bence Tóth",
  "claimantContact": "bence.toth@example.com",
  "reason": "My student ID is inside"
}
```

## Project layout

```
backend/src/main/java/hu/campus/lostfound/
  LostFoundApplication.java
  report/       Report + Item entities, repos, service, controllers, DTOs
  claim/        Claim entity, repo, service, controller, DTOs
  handover/     Handover entity, repo, service, controller, DTOs
  user/         User entity, repo, service
  shared/       Exceptions, CORS, API error handler
```
