# Campus Lost & Found

Egyetemi elveszett tárgyak rendszere: bejelentheted, ha elvesztettél vagy találtál valamit, igényt nyújthatsz be egy egyező bejelentésre, és a megtaláló jóváhagyhatja az átadást.

## Állapot

Frontend MVP, mind a négy tervezett use case megvalósítva:

- **Tárgy bejelentése** — kész
- **Bejelentés keresése** — kész
- **Igénylés** — kész
- **Átadás jóváhagyása** — kész

Backend egyelőre nincs; helyette egy egyszerű, mock bejelentkezés van (csak név megadása, jelszó nélkül), ami eldönti, ki a bejelentés tulajdonosa. Az adatok a böngésző `localStorage`-ában tárolódnak, tehát nem szinkronizálódnak böngészők/eszközök között, és elvesznek, ha törlik a webhely adatait. Első betöltéskor néhány minta bejelentés automatikusan létrejön, hogy ne kelljen üres állapotból indulni.

### Hozzáférés-szabályok

- Egy bejelentés `Igénylés` listáját és a jóváhagyás/elutasítás gombokat csak a bejelentés tulajdonosa látja.
- A bejelentő elérhetősége (`reporterContact`) rejtve marad az igénylők elől, amíg egy igénylés jóváhagyásra nem kerül.
- A jóváhagyás és az átadás két külön lépés: jóváhagyáskor a rendszer generál egy `Handover` átadási kódot, felfedi a bejelentő és az igénylő elérhetőségét egymás előtt, és a többi függő igénylést automatikusan elutasítja — de a bejelentés még nyitva marad. Csak az explicit „Mark as handed over” lépés zárja le (`CLOSED`) a bejelentést, ez jelöli a tárgyat ténylegesen átadottnak.
- Egy tárgy csak egyszer adható át: amíg egy jóváhagyott igénylés átadásra vár, új igénylés nem nyújtható be ugyanarra a bejelentésre.

Mivel a bejelentkezés mock (nincs jelszó, nincs szerver oldali ellenőrzés), ez csak a felületen tiltja le a jogosulatlan műveleteket — a `localStorage`/store függvények közvetlen hívásával megkerülhető. Valódi jogosultságkezeléshez backend szükséges.

## Technológiák

- React + TypeScript + Vite
- Tailwind CSS
- Backend (tervezett): Java + Spring

## Domain modell

- **Tárgy (Item)** — a fizikai tárgy (név, leírás, kategória)
- **Bejelentés (Report)** — egy elveszett vagy megtalált bejelentés, amely egy Tárgyra hivatkozik
- **Igénylés (Claim)** — igény egy nyitott bejelentésre
- **Átadás (Handover)** — egy tárgy jóváhagyott átadása az igénylőnek

Value objectek: `ItemId` (Tárgyazonosító), `HandoverCode` (Átadási kód).

A teljes típusdefiníciókért lásd: [src/domain/types.ts](src/domain/types.ts).

## Indítás

```bash
npm install
npm run dev
```

Nyisd meg a kiírt helyi URL-t a böngésződben, és jelentkezz be egy tetszőleges névvel (vagy válassz a demó felhasználók közül).

## Scriptek

- `npm run dev` — fejlesztői szerver indítása
- `npm run build` — típusellenőrzés és production build
- `npm run preview` — production build helyi előnézete
- `npm run lint` — ESLint futtatása

## Projekt struktúra

```
src/
  domain/       Entitás és value object típusok, kategórialista, kontakt-validáció
  storage/      localStorage-alapú perzisztencia (bejelentések, igénylések/átadások, mock munkamenet)
  components/   ReportForm, ReportList, ReportDetailsModal, ClaimForm, LoginScreen, DatePicker, FieldError
  App.tsx       Bejelentkezés + fül navigáció (Bejelentés / Nyitott bejelentések)
```
