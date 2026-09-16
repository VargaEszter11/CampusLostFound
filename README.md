# Campus Lost & Found

Egyetemi elveszett tárgyak rendszere: bejelentheted, ha elvesztettél vagy találtál valamit, és kereshetsz a nyitott bejelentések között, hogy megtaláld a párját.

## Állapot

Első frontend MVP. A négy tervezett use case közül kettőt fed le:

- **Tárgy bejelentése** — kész
- **Bejelentés keresése** — kész

Még nincs megvalósítva (következő lépések):

- **Igénylés** — egy felhasználó igényt nyújt be egy egyező bejelentésre
- **Átadás jóváhagyása** — egy admin/megtaláló jóváhagyja az átadást és generálódik egy átadási kód

Backend egyelőre nincs. A bejelentések a böngésző `localStorage`-ában tárolódnak, tehát az adatok nem szinkronizálódnak böngészők/eszközök között, és elvesznek, ha törlik a webhely adatait.

## Technológiák

- React + TypeScript + Vite
- Tailwind CSS
- Backend (tervezett): Java + Spring

## Domain modell

- **Tárgy (Item)** — a fizikai tárgy (név, leírás, kategória)
- **Bejelentés (Report)** — egy elveszett vagy megtalált bejelentés, amely egy Tárgyra hivatkozik
- **Igénylés (Claim)** — igény egy nyitott bejelentésre (tervezett)
- **Átadás (Handover)** — egy tárgy jóváhagyott átadása az igénylőnek (tervezett)

Value objectek: `ItemId` (Tárgyazonosító), `HandoverCode` (Átadási kód).

A teljes típusdefiníciókért lásd: [src/domain/types.ts](src/domain/types.ts).

## Indítás

```bash
npm install
npm run dev
```

Nyisd meg a kiírt helyi URL-t a böngésződben.

## Scriptek

- `npm run dev` — fejlesztői szerver indítása
- `npm run build` — típusellenőrzés és production build
- `npm run preview` — production build helyi előnézete
- `npm run lint` — ESLint futtatása

## Projekt struktúra

```
src/
  domain/       Entitás és value object típusok, kategórialista
  storage/      localStorage-alapú bejelentés-perzisztencia
  components/   ReportForm, ReportList, ReportDetailsModal
  App.tsx       Fül navigáció (Bejelentés / Nyitott bejelentések)
```
