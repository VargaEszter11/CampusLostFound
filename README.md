# Campus Lost & Found

Egyetemi elveszett tárgyak rendszere: bejelentheted, ha elvesztettél vagy találtál valamit, igényt nyújthatsz be egy egyező bejelentésre, és a megtaláló jóváhagyhatja az átadást.

## Állapot

A négy fő use case API + PostgreSQL mögött fut:

- **Tárgy bejelentése** — kész
- **Bejelentés keresése** — kész (All / Lost / Found / My reports + kategória + dátumtartomány)
- **Igénylés** — kész
- **Átadás jóváhagyása** — kész (Handovers fül is)
- **Bejelentkezés** — kész (e-mail + jelszó, Google Sign-In, JWT)
- **Értesítések** — kész (in-app: claim / approve / reject / handover)

Részletes leírás: [docs/mvp.md](docs/mvp.md). Nyitott feladatok: [docs/todo.md](docs/todo.md).

### Hozzáférés-szabályok

- Egy bejelentés igényléslistáját és a jóváhagyás/elutasítás gombokat csak a bejelentés tulajdonosa látja.
- A bejelentő elérhetősége (`reporterContact`) a szerveren is rejtve marad: csak a bejelentő és egy jóváhagyott átadás két résztvevője kapja meg a bejelentés adataiban; más felhasználónak `null`.
- A jóváhagyás és az átadás két külön lépés: jóváhagyáskor a rendszer generál egy `Handover` átadási kódot, felfedi a felek elérhetőségét, és a többi függő igénylést elutasítja — a bejelentés még nyitva marad. Csak a megerősítés zárja le (`CLOSED`).
- All / Lost / Found csak mások nyitott bejelentéseit listázza; a sajátok a **My reports** szűrőn jelennek meg. Az Open reports oldalon kategória és dátumtartomány szerint is szűrhető a lista.
- Amíg egy jóváhagyott igénylés átadásra vár, új igénylés nem nyújtható be ugyanarra a bejelentésre.
- A szerver a JWT-ből azonosítja a felhasználót; a kliens nem küldhet más nevében bejelentést vagy igénylést.

## Technológiák

- Frontend: React + TypeScript + Vite + Tailwind CSS
- Backend: Java 21 + Spring Boot + Spring Security (JWT) + JPA + Flyway
- Adatbázis: PostgreSQL (helyi telepítés vagy Neon — Docker nem kell)

## Domain modell

- **User** — bejelentő / igénylő (email, jelszó hash és/vagy Google `sub`)
- **Item** — a fizikai tárgy (név, leírás, kategória)
- **Report** — elveszett vagy megtalált bejelentés
- **Claim** — igény egy nyitott bejelentésre
- **Handover** — jóváhagyott átadás átadási kóddal

Típusok: [frontend/src/domain/types.ts](frontend/src/domain/types.ts).  
Séma: [backend/src/main/resources/db/migration/V1__init.sql](backend/src/main/resources/db/migration/V1__init.sql).

## Indítás

### 1. Adatbázis

1. Telepíts PostgreSQL-t, vagy használj Neon projektet.
2. Helyi DB: `psql -U postgres -f backend/create-db.sql`

### 2. Backend

```powershell
cd backend
.\run.ps1
```

Részletek és API: [backend/README.md](backend/README.md).

Demó felhasználók (jelszó mindháromnál `demo123`):

| Név | Email |
|-----|-------|
| Anna Kiss | anna.kiss@example.com |
| Bence Tóth | bence.toth@example.com |
| Csenge Nagy | csenge.nagy@example.com |

### 3. Frontend

```bash
cd frontend
cp .env.example .env.local   # set VITE_GOOGLE_CLIENT_ID for Google Sign-In
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

## Projekt struktúra

```
frontend/   React + Vite app
backend/    Spring Boot + Flyway + JPA (+ create-db.sql)
docs/       MVP leírás és todo
```
