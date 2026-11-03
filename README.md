# Campus Lost & Found

Egyetemi elveszett tárgyak rendszere: bejelentheted, ha elvesztettél vagy találtál valamit, igényt nyújthatsz be egy egyező bejelentésre, és a megtaláló jóváhagyhatja az átadást.

Dokumentáció: [MVP](docs/mvp.md), [API](docs/api.md), [architektúra](docs/architecture.md), [todo](docs/todo.md), [PROMPTOK](docs/prompts.md).

## Hozzáférés-szabályok

- Egy bejelentés igényléslistáját és a jóváhagyás/elutasítás gombokat csak a bejelentés tulajdonosa látja.
- A bejelentő elérhetősége (`reporterContact`) a szerveren is rejtve marad: csak a bejelentő és egy jóváhagyott átadás két résztvevője kapja meg a bejelentés adataiban; más felhasználónak `null`.
- A jóváhagyás és az átadás két külön lépés: jóváhagyáskor a rendszer generál egy `Handover` átadási kódot, felfedi a felek elérhetőségét, és a többi függő igénylést elutasítja — a bejelentés még nyitva marad. Csak a megerősítés zárja le (`CLOSED`).
- All / Lost / Found csak mások nyitott bejelentéseit listázza; a sajátok a **My reports** szűrőn jelennek meg. Az Open reports oldalon kategória és dátumtartomány szerint is szűrhető a lista.
- Amíg egy jóváhagyott igénylés átadásra vár, új igénylés nem nyújtható be ugyanarra a bejelentésre.
- A szerver a JWT-ből azonosítja a felhasználót; a kliens nem küldhet más nevében bejelentést vagy igénylést.
- Adminok: a gyökér `.env` `ADMIN_EMAILS` változójában vesszővel elválasztott e-mail-címek (kis-/nagybetű nem számít). Csak ők érik el a `/api/admin/**` végpontokat, és csak nekik jelenik meg az **Admin** gomb a fejlécben.

## Technológiák

- Frontend: React + TypeScript + Vite + Tailwind CSS
- Backend: Java 21 + Spring Boot + Spring Security (JWT) + JPA + Flyway
- Adatbázis: PostgreSQL (Docker, helyi telepítés vagy Neon)
- AI kategóriajavaslat: DeepSeek API (opcionális, `DEEPSEEK_API_KEY`; nélküle a „Suggest with AI” gomb nem működik)

## Domain modell

- **User** — bejelentő / igénylő (email, jelszó hash és/vagy Google `sub`)
- **Item** — a fizikai tárgy (név, leírás, kategória)
- **Report** — elveszett vagy megtalált bejelentés
- **Claim** — igény egy nyitott bejelentésre
- **Handover** — jóváhagyott átadás átadási kóddal

Típusok: [frontend/src/domain/types.ts](frontend/src/domain/types.ts).  
Séma: [backend/src/main/resources/db/migration/V1__init.sql](backend/src/main/resources/db/migration/V1__init.sql).

## Indítás Dockerrel (ajánlott)

Csak Docker kell (Java, Node és PostgreSQL nem):

```bash
cp .env.example .env    # töltsd ki: GOOGLE_CLIENT_ID, VITE_GOOGLE_CLIENT_ID, ADMIN_EMAILS (opcionális: DEEPSEEK_API_KEY)
docker compose up -d --build
```

Ezután: **http://localhost:5173** (frontend, nginx a `/api`-t a backendre proxyzza). A backend a `8080`-on, a PostgreSQL a `5434`-en is elérhető. Üres adatbázison a Flyway létrehozza a sémát és a demó felhasználókat.

| Parancs | Mit csinál |
|---------|------------|
| `docker compose up -d --build` | build + indítás (kódváltozás vagy `VITE_*` módosítás után is ezt) |
| `docker compose restart backend` | `.env` módosítás után (pl. `ADMIN_EMAILS`) |
| `docker compose logs -f backend` | backend log |
| `docker compose down` | leállítás (az adatok megmaradnak a `db-data` volume-ban) |
| `docker compose down -v` | leállítás **és az adatbázis törlése** |

Portok felülírhatók a `.env`-ben: `FRONTEND_HOST_PORT`, `BACKEND_HOST_PORT`, `DB_HOST_PORT`. A Google Sign-In csak a Google Console-ban regisztrált originen (alapból `http://localhost:5173`) működik.

## Indítás Docker nélkül (fejlesztéshez)

### 0. Környezeti változók

Egyetlen `.env` fájl kell, a repó gyökerében — ezt olvassa a backend (`../.env`) és a frontend (Vite `envDir: '..'`) is:

```bash
cp .env.example .env   # GOOGLE_CLIENT_ID, VITE_GOOGLE_CLIENT_ID, SPRING_DATASOURCE_*, ADMIN_EMAILS, DEEPSEEK_API_KEY
```

Előfeltételek: PostgreSQL 16+ (helyi vagy [Neon](https://neon.tech)), JDK 21+ (`winget install Microsoft.OpenJDK.21`), Maven 3.9+ (vagy a `./mvnw` wrapper), Node.js a frontendhez.

### 1. Adatbázis

**Helyi PostgreSQL:** `psql -U postgres -f backend/create-db.sql` létrehozza a `campus` szerepkört és a `campus_lost_found` adatbázist. Alapértelmezett beállítások (`application.yml`): `localhost:5432`, adatbázis `campus_lost_found`, felhasználó/jelszó `campus` / `campus`. A compose `db` szolgáltatása is használható: `docker compose up -d db` (port `5434`, ez van a `.env.example`-ben).

**Neon (felhő):** hozz létre projektet, és a kapcsolati adatokat add meg a `.env`-ben (vagy környezeti változóként):

```
SPRING_DATASOURCE_URL=jdbc:postgresql://ep-xxxx.region.aws.neon.tech/neondb?sslmode=require
SPRING_DATASOURCE_USERNAME=...
SPRING_DATASOURCE_PASSWORD=...
```

A migrációkat (`backend/src/main/resources/db/migration/`) a Flyway indításkor automatikusan lefuttatja; a Hibernate `ddl-auto` értéke `validate`, vagyis az entitásoknak egyezniük kell a sémával.

### 2. Backend

A backendet a `backend/` mappából kell indítani (a `../.env`-et olvassa):

```bash
cd backend
mvn spring-boot:run   # vagy ./mvnw spring-boot:run
```

Ha a shell régi Java 8-at talál, állítsd be a JDK 21-et (PowerShell):

```powershell
$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-21.0.12.101-hotspot"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
```

Ellenőrzés: `java -version` → 21. API: [docs/api.md](docs/api.md). Backend tesztek: `mvn test`.

Demó felhasználók (jelszó mindháromnál `demo123`):

| Név | Email |
|-----|-------|
| Anna Kiss | anna.kiss@example.com |
| Bence Tóth | bence.toth@example.com |
| Csenge Nagy | csenge.nagy@example.com |

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

A Vite dev szerver a `/api` hívásokat a backendre proxyzza (lásd `frontend/vite.config.ts`).

**Google Sign-In:** hozz létre egy Web OAuth client ID-t a [Google Cloud Console](https://console.cloud.google.com/apis/credentials)-ban. Authorized JavaScript origins: `http://localhost:5173`, `http://127.0.0.1:5173`. Állítsd be ugyanazt az ID-t `VITE_GOOGLE_CLIENT_ID` (frontend) és `GOOGLE_CLIENT_ID` (backend) értékeként.

## Frontend scriptek (`frontend/`)

- `npm run dev` — fejlesztői szerver
- `npm run build` — típusellenőrzés és production build
- `npm run preview` — production build előnézete
- `npm run lint` — ESLint
- `npm test` — Vitest tesztek (`npm run test:watch` figyelő módban)

## Projekt struktúra

```
frontend/   React + Vite app
backend/    Spring Boot + Flyway + JPA (+ create-db.sql)
docs/       MVP, API, architektúra, todo
```

Backend csomagok (`backend/src/main/java/hu/campus/lostfound/`): `auth` (JWT, Spring Security, login/regisztráció/Google), `admin`, `category` (AI kategóriajavaslat), `notification`, `report` (Report + Item), `claim`, `handover`, `workflow` (jóváhagyás, átadás-lekérdezések, report nézetek, controllerek), `user`, `shared` (kivételek, CORS, hibakezelő).

Flyway migrációk: `V1` séma, `V2` demó felhasználók, `V3` átadási kód típusjavítás, `V4` régi demó bejelentések törlése, `V5` demó jelszavak, `V6` Google Sign-In (`google_sub`), `V7` értesítések.
