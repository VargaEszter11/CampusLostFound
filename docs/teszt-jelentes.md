# Tesztjelentés — Campus Lost & Found

**Dátum:** 2026-11-03 · **Verzió:** `main` @ `0d058de` („last fix”), Docker stack újraépítve erről a commitról  
**Módszer:** kézi végigkattintás a böngészőben (3 ideiglenes tesztfelhasználóval: sima user, igénylő, admin), API-hívások curl-lel a jogosultságokra és szélsőesetekre, valamint a meglévő automata tesztek futtatása.

## Összefoglaló

A fő folyamatok **működnek**: regisztráció, belépés, bejelentés (AI-kategóriajavaslattal), lista + szűrők, igénylés, jóváhagyás/elutasítás, átadási kód, átadás megerősítése, értesítések, admin oldal. A szerveroldali jogosultság-ellenőrzés minden kipróbált esetben helyesen tiltott.

Talált hibák: **1 súlyos, 4 közepes, 7 kisebb**, plusz egy lint-hiba.

| Automata teszt | Eredmény |
|---|---|
| Frontend `vitest run` | ✅ 88 / 88 |
| Backend `mvnw test` | ✅ 19 tesztosztály, mind zöld |
| `tsc` | ✅ hibátlan |
| `npm run lint` | ❌ 1 hiba (lásd L1) |

---

## Súlyos

### S1. A „saját bejelentés” felismerése a megjelenített név alapján történik
[rules.ts:7](../frontend/src/domain/rules.ts) — `isOwnerOf` a `reporterName`-et hasonlítja a bejelentkezett user nevéhez (kis/nagybetű nélkül). A név nem egyedi, a `ReportResponse` pedig nem ad vissza `reporterId`-t.

**Reprodukálás:** regisztrálj új fiókot `anna kiss` névvel → a **My reports** szűrő alatt megjelenik Anna Kiss mind a 4 bejelentése, az All listából eltűnnek; a részletekben „Delete report” gomb látszik, a Contact üres, és „Only the reporter can view claims on this report” hiba jelenik meg. Az ilyen user Anna bejelentéseit **nem tudja igényelni** (nincs „This is mine” gomb), és a lista minden frissítéskor 403-as `/claims` kéréseket küld.

A szerver jól véd (a törlés/jóváhagyás 403), tehát adat nem szivárog, de a felület hibásan működik.  
**Javaslat:** a `ReportResponse`-ba `reporterId` (vagy egy `mine: boolean`), és a kliens azt hasonlítsa a `session.userId`-hoz.

## Közepes

### K1. Ugyanaz a user többször is igényelheti ugyanazt a tárgyat
[ClaimService.java:67](../backend/src/main/java/hu/campus/lostfound/claim/ClaimService.java) — nincs ellenőrzés arra, hogy a usernek van-e már PENDING igénylése ugyanarra a bejelentésre. Beküldés után a felület ráadásul **semmilyen visszajelzést nem ad**: a modal visszaugrik a „This is mine” gombra, így könnyű kétszer beküldeni.

**Következmény a tesztben:** a bejelentő két egyforma igénylést látott, egyet jóváhagyott → ugyanaz az igénylő kapott egy „Claim approved” és egy „Claim rejected … because another claim was approved” értesítést is.  
**Javaslat:** backend-ellenőrzés (`existsByReport_IdAndClaimant_IdAndStatus(..., PENDING)`), a UI-ban „Claim submitted” állapot, és ha már van igénylés, a gomb helyett annak státusza.

### K2. Az igénylés indoklása („Why is this yours?”) sehol nem jelenik meg
[ClaimsPanel.tsx](../frontend/src/components/ClaimsPanel.tsx) csak az igénylő nevét mutatja. Az indoklás (és az elérhetőség) el van mentve, az API vissza is adja, de a bejelentő nem látja — pedig pont ez alapján kellene döntenie a jóváhagyásról.

### K3. Kívülálló user hibaüzenetet lát egy átadásra váró bejelentésnél
Ha egy bejelentésnél már van jóváhagyott (még nem megerősített) igénylés, egy harmadik user a részletekben ezt látja: **„You cannot view this handover”** (piros hiba) + egy „This is mine” gomb, ami beküldéskor „This report already has an approved claim” hibát ad.  
Ok: a „last fix” óta a nem-tulajdonos is lekéri a `/handover`-t ([useReportClaims.ts:20](../frontend/src/hooks/useReportClaims.ts)), a szerver pedig 403-at ad.  
**Javaslat:** a 403-at a kliens kezelje „nincs átadás”-ként, vagy a szerver adjon vissza egy „awaiting handover” állapotot; ilyenkor a lista ne kínáljon igénylést (a README szerint ez szándékosan tiltott).

### K4. Hibás bemenetre 500-as hiba 400 helyett
[ApiExceptionHandler.java](../backend/src/main/java/hu/campus/lostfound/shared/ApiExceptionHandler.java) nem kezeli ezeket, így „Something went wrong” / 500 lesz belőlük:
- érvénytelen UUID az útvonalban (`GET /api/reports/not-a-uuid`) — `MethodArgumentTypeMismatchException`
- hibás JSON (`{`) vagy nem létező enum (`"type":"MAYBE"`) — `HttpMessageNotReadableException`

**Javaslat:** két új `@ExceptionHandler` → 400.

## Kisebb

1. **Darabszám-jelző nem követi a szűrőket** — [App.tsx:68](../frontend/src/App.tsx): Lost szűrőnél 5 elem látszik, a jelvény mégis „9 reports”; keresésnél, kategóriánál, dátumnál ugyanez. Csak a My reports-ot veszi figyelembe.
2. **Regisztrációnál érvénytelen e-mail → „Validation failed”** — a kliens csak az ürességet ellenőrzi, a szerver `fields` hibáját pedig az [http.ts:9](../frontend/src/api/http.ts) eldobja, mert az `error` kulcs elsőbbséget kap. Ugyanez a bejelentés-űrlapon is előjöhet.
3. **Bejelentés-űrlap egyszerre csak egy hibát mutat** — [useReportForm.ts:38-56](../frontend/src/hooks/useReportForm.ts): üres beküldéskor csak „Item name is required” jelenik meg, a hely/dátum hibája csak a következő próbálkozásnál.
4. **Tetszőleges kategória elfogadva** — `POST /api/reports` `"itemCategory":"Nonsense"` értékkel 201-et ad; a szerver nem ellenőrzi a fix listát.
5. **„Delete report” gomb jóváhagyott igénylés után is látszik** — megerősítés után mindig „Cannot delete a report with an approved claim” a válasz; a gombot el lehetne rejteni.
6. **Értesítés törölt bejelentésre** — törléskor a hozzá tartozó értesítések megmaradnak; rákattintva az app csendben az Open reports listára ugrik, üzenet nélkül.
7. **„Mark as handed over” megerősítés nélkül** — visszavonhatatlan lépés (lezárja a bejelentést), mégsincs „Biztos?” kérdés, míg a törlésnél van.

Egyéb apróság: a dátumformátum vegyes (listában „Nov 2, 2026”, admin/átadásnál „2026. 11. 03. 13:28:34”); minden modal-nyitáskor van egy 404-es `/handover` kérés a konzolban (szándékos, de zajos).

### L1. Lint-hiba (a „last fix” commitból)
```
frontend/src/hooks/useReportClaims.ts:26  react-hooks/set-state-in-effect
  setError(undefined)  — Avoid calling setState() directly within an effect
```

---

## Ami hibátlanul működött

- Regisztráció (üres mezők, rövid jelszó, foglalt e-mail kis/nagybetűtől függetlenül), belépés, hibás jelszó, kijelentkezés, munkamenet megmarad frissítés után
- Bejelentés: Lost/Found, dátumválasztó (jövőbeli nap tiltva, szerveren is), AI-kategóriajavaslat + „Use”, elérhetőség-validáció (e-mail/telefon)
- Lista: All / Lost / Found / My reports, kategória, dátumtartomány (határnap benne van), szöveges keresés, „Clear filters”
- Igénylés: saját bejelentés igénylése tiltva, elérhetőség rejtve jóváhagyásig, utána mindkét fél látja
- Jóváhagyás: 6 jegyű kód, a többi függő igénylés automatikusan elutasítva + értesítés; elutasítás; már lezárt igénylés újbóli kezelése tiltva
- Átadás megerősítése → bejelentés CLOSED, a másik fél értesítést kap; Handovers fül Pending/Handed over nézet mindkét szerepben
- Értesítések: olvasatlan-számláló, kattintásra a bejelentéshez navigál, „Mark all read”, törlés; más user értesítése nem érhető el (404)
- Admin: csak adminnak látszik a gomb, nem-admin 403; összesítők, típus/státusz/kategória szűrők, keresés, átadási adatok
- Jogosultságok API-szinten: token nélkül 401, hibás token 401, más bejelentésének lezárása/törlése/igényléseinek kezelése 403
- Mobilnézet (375 px): nincs vízszintes görgetés

## Megjegyzés

Az adatbázisban vannak korábbi (2026-11-02-i) tesztmaradványok Anna Kiss nevén: „QA Wallet …”, „QA delete test”, „Retest Multi …”, „UI Multi Claim Test”. Ezeket nem én hoztam létre, ezért nem töröltem.

## Takarítás

- A 3 tesztfelhasználó és minden hozzájuk tartozó adat (3 bejelentés + tárgyak, 3 igénylés, 1 átadás, 7 értesítés — ebből egy bejelentést és egy értesítést már a teszt közben, a törlés-funkció kipróbálásakor töröltem) törölve; az adatbázis-dump bájtra azonos a teszt előttivel.
- A `.env` visszaállítva (az `ADMIN_EMAILS`-hez ideiglenesen hozzáadott tesztcím kikerült), a backend újraindítva.
- Ideiglenes scriptek és mentések törölve, böngésző-munkamenet kiürítve. A git munkafa tiszta (ezt a fájlt leszámítva).
