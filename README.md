# Campus Lost & Found

Egyetemi elveszett tárgyak rendszere: bejelentheted, ha elvesztettél vagy találtál valamit, igényt nyújthatsz be egy egyező bejelentésre, és a megtaláló jóváhagyhatja az átadást.

## Állapot

A négy fő use case API + PostgreSQL mögött fut:

- **Tárgy bejelentése** — kész
- **Bejelentés keresése** — kész (All / Lost / Found / My reports)
- **Igénylés** — kész
- **Átadás jóváhagyása** — kész (Handovers fül is)

A bejelentkezés még mock (csak név). Részletes leírás: [docs/mvp.md](docs/mvp.md). Nyitott feladatok: [docs/todo.md](docs/todo.md).

### Hozzáférés-szabályok

- Egy bejelentés igényléslistáját és a jóváhagyás/elutasítás gombokat csak a bejelentés tulajdonosa látja.
- A bejelentő elérhetősége (`reporterContact`) rejtve marad az igénylők elől, amíg egy igénylés jóváhagyásra nem kerül.
- A jóváhagyás és az átadás két külön lépés: jóváhagyáskor a rendszer generál egy `Handover` átadási kódot, felfedi a felek elérhetőségét, és a többi függő igénylést elutasítja — a bejelentés még nyitva marad. Csak a megerősítés zárja le (`CLOSED`).
- All / Lost / Found csak mások nyitott bejelentéseit listázza; a sajátok a **My reports** szűrőn jelennek meg.
- Amíg egy jóváhagyott igénylés átadásra vár, új igénylés nem nyújtható be ugyanarra a bejelentésre.

Mivel a bejelentkezés mock (nincs jelszó, nincs szerver oldali ellenőrzés), a felületi tiltások megkerülhetők. Valódi jogosultságkezeléshez backend auth szükséges.

## Technológiák

- Frontend: React + TypeScript + Vite + Tailwind CSS
- Backend: Java 21 + Spring Boot + JPA + Flyway
- Adatbázis: PostgreSQL (helyi telepítés vagy Neon — Docker nem kell)

## Domain modell

- **User** — bejelentő / igénylő (email, később jelszó)
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

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

A Vite dev szerver a `/api` hívásokat a `localhost:8080` backendre proxyzza.

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
