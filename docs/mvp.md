# Campus Lost & Found – MVP dokumentáció

## Az alkalmazás célja

A Campus Lost & Found egy egyetemi elveszett tárgyak rendszer, amelynek célja, hogy egyetlen áttekinthető felületen tegye lehetővé az elveszett vagy megtalált tárgyak bejelentését, a nyitott bejelentések átkereshető listázását, az igénylés benyújtását egy egyező bejelentésre, valamint az átadás jóváhagyását — hogy a tárgy tulajdonosa és megtalálója egymásra találjon, és a tárgy biztonságosan cseréljen gazdát.

## A jelenlegi MVP funkciói

- bejelentkezés egy néven keresztül (mock, jelszó nélkül); demó felhasználók: Anna Kiss, Bence Tóth, Csenge Nagy;
- új bejelentés létrehozása „Elveszett” vagy „Megtalált” típussal;
- a tárgy nevének, kategóriájának, leírásának, helyszínének és dátumának megadása (a dátum csak a mai nap vagy korábbi lehet);
- a bejelentő neve a bejelentkezett felhasználóhoz van rögzítve, csak az elérhetőséget kell megadni;
- a nyitott bejelentések listázása, szabadszavas kereséssel;
- a lista szűrése: **All** / **Lost** / **Found** / **My reports** — az All/Lost/Found csak mások bejelentéseit mutatja, a sajátok a My reports szűrő alatt vannak;
- egy bejelentés részleteinek megtekintése felugró ablakban;
- igénylés benyújtása egy nyitott bejelentésre (gomb szövege a bejelentés típusától függ: „This is mine” megtalált tárgynál, „Found it” elveszett tárgynál);
- a bejelentés tulajdonosa jóváhagyhatja vagy elutasíthatja a beérkezett igényléseket;
- a jóváhagyás és az átadás két külön lépés: jóváhagyáskor a rendszer generál egy 6 jegyű átadási kódot, felfedi a bejelentő és az igénylő elérhetőségét egymás előtt, és a többi függő igénylést automatikusan elutasítja — a bejelentés eddig a pontig még nyitva marad; a tulajdonos (vagy a Handovers fülön bármelyik fél) megerősítheti, amikor a tárgy ténylegesen gazdát cserélt;
- a bejelentő elérhetősége rejtve marad az igénylők elől jóváhagyásig;
- a My reports listán jelzés jelenik meg, ha egy saját bejelentésre függő igénylés érkezett;
- **My claims** nézet: a felhasználó saját benyújtott igénylései, státusszal (Pending/Approved/Rejected); jóváhagyás után itt is megjelenik a bejelentő elérhetősége és az átadási kód;
- **Handovers** nézet: a felhasználót érintő átadások (bejelentőként vagy igénylőként), átadási kóddal és megerősítéssel;
- mezőszintű validáció: kötelező mezők, e-mail-cím vagy telefonszám formátum, jövőbeli dátum tiltása;
- adatok a Spring Boot API-n / PostgreSQL-en keresztül mentődnek (nem `localStorage`).

## Fő felületi elemek

Belépéskor egy bejelentkező képernyő jelenik meg, ahol tetszőleges névvel vagy egy demó felhasználó gyors-választásával lehet folytatni. Bejelentkezés után a főoldalon négy fül van: **Report**, **Open reports**, **My claims** és **Handovers**.

A **Report** fülön egy űrlap jelenik meg (Elveszett/Megtalált váltó, tárgy adatai, dátumválasztó, bejelentő neve/elérhetősége). Beküldés után az alkalmazás átvált az Open reports fülre.

Az **Open reports** fülön keresőmező és négy szűrőgomb (All / Lost / Found / My reports) alatt jelennek meg a bejelentések. Egy kártyára kattintva felugró ablakban nyílnak meg a részletek: nem tulajdonosként igénylés nyújtható be; tulajdonosként a beérkezett igénylések bírálhatók el. Jóváhagyás után megjelenik az átadási kód és a felek elérhetősége.

A **My claims** fülön a felhasználó saját igényléseit követheti. A **Handovers** fülön az őt érintő átadások listája és a megerősítés található.

## Használt technológiák

- Frontend: React, TypeScript, Vite, Tailwind CSS
- Backend: Java 21, Spring Boot, JPA, Flyway
- Adatbázis: PostgreSQL

## Jelenlegi korlátok

A bejelentkezés még mock: nincs jelszó, nincs szerver oldali auth. A felületen tiltott műveletek API-szinten jelenleg nincsenek felhasználóhoz kötve (név alapján azonosít a kliens) — valódi jogosultságkezeléshez backend login szükséges. Nincs értesítés, admin nézet, LLM kategória-javaslat, sem automatizált tesztek.
