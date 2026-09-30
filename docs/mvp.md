# Campus Lost & Found – MVP dokumentáció

## Az alkalmazás célja

A Campus Lost & Found egy egyetemi elveszett tárgyak rendszer, amelynek célja, hogy egyetlen áttekinthető felületen tegye lehetővé az elveszett vagy megtalált tárgyak bejelentését, a nyitott bejelentések átkereshető listázását, az igénylés benyújtását egy egyező bejelentésre, valamint az átadás jóváhagyását — hogy a tárgy tulajdonosa és megtalálója egymásra találjon, és a tárgy biztonságosan cseréljen gazdát.

## A jelenlegi MVP funkciói

- bejelentkezés e-mail + jelszóval (JWT) vagy Google Sign-In-nel; új fiók regisztrációja; azonos e-mailnél a Google fiók összekapcsolódik a meglévő felhasználóval; demó felhasználók: Anna Kiss, Bence Tóth, Csenge Nagy (jelszó: `demo123`);
- új bejelentés létrehozása „Elveszett” vagy „Megtalált” típussal;
- a tárgy nevének, kategóriájának, leírásának, helyszínének és dátumának megadása (a dátum csak a mai nap vagy korábbi lehet);
- a bejelentő neve a bejelentkezett felhasználóhoz van rögzítve; az elérhetőség mező előre ki van töltve a fiók e-mailjével, de szerkeszthető;
- a nyitott bejelentések listázása, szabadszavas kereséssel;
- a lista szűrése: **All** / **Lost** / **Found** / **My reports** — az All/Lost/Found csak mások bejelentéseit mutatja, a sajátok a My reports szűrő alatt vannak;
- további szűrés **kategória** és **dátumtartomány** (tól–ig) szerint; a szűrők egy gombbal törölhetők;
- egy bejelentés részleteinek megtekintése felugró ablakban (helyszín, dátum, bejelentő, státuszjelvények);
- igénylés benyújtása egy nyitott bejelentésre (gomb szövege a bejelentés típusától függ: „This is mine” megtalált tárgynál, „Found it” elveszett tárgynál);
- a bejelentés tulajdonosa jóváhagyhatja vagy elutasíthatja a beérkezett igényléseket;
- a jóváhagyás és az átadás két külön lépés: jóváhagyáskor a rendszer generál egy 6 jegyű átadási kódot, felfedi a bejelentő és az igénylő elérhetőségét egymás előtt, és a többi függő igénylést automatikusan elutasítja — a bejelentés eddig a pontig még nyitva marad; a tulajdonos (vagy a Handovers fülön bármelyik fél) megerősítheti, amikor a tárgy ténylegesen gazdát cserélt;
- a bejelentő elérhetősége rejtve marad az igénylők elől jóváhagyásig;
- a My reports listán jelzés jelenik meg, ha egy saját bejelentésre függő igénylés érkezett;
- **My claims** nézet: a felhasználó saját benyújtott igénylései, státusszal (Pending/Approved/Rejected); jóváhagyás után itt is megjelenik a bejelentő elérhetősége és az átadási kód;
- **Handovers** nézet: a felhasználót érintő átadások (bejelentőként vagy igénylőként), átadási kóddal és megerősítéssel;
- mezőszintű validáció: kötelező mezők, e-mail-cím vagy telefonszám formátum, jövőbeli dátum tiltása;
- adatok a Spring Boot API-n / PostgreSQL-en keresztül mentődnek (nem `localStorage`);
- védett API: a műveletek a JWT-ből azonosított felhasználóhoz kötődnek (nem kliens által küldött névhez);
- in-app értesítések: új igénylés, jóváhagyás/elutasítás, átadás megerősítése — harang ikon, olvasatlan számláló, listából navigáció a megfelelő fülre.

## Fő felületi elemek

Belépéskor egy bejelentkező képernyő jelenik meg (Sign in / Register, plusz Continue with Google ha a Client ID be van állítva). Demó felhasználó gombok kitöltik az e-mailt és a jelszót. A felület sötét monokróm, teal kiemelésekkel.

Bejelentkezés után a főoldalon a **Lost & Found** cím mellett az értesítés-harang, a felhasználó neve és a Sign out található. Négy fül: **Report**, **Open reports**, **My claims** és **Handovers**.

A **Report** fülön egy űrlap jelenik meg (Elveszett/Megtalált váltó, tárgy adatai, dátumválasztó, bejelentő neve/elérhetősége). Beküldés után az alkalmazás átvált az Open reports fülre.

Az **Open reports** fülön keresőmező, típus-szűrők (All / Lost / Found / My reports), kategória-választó és dátumtartomány alatt jelennek meg a bejelentések listaként (név, Lost/Found jelvény, kategória, helyszín, dátum). Egy sorra kattintva felugró ablakban nyílnak meg a részletek: nem tulajdonosként igénylés nyújtható be; tulajdonosként a beérkezett igénylések bírálhatók el. Jóváhagyás után megjelenik az átadási kód és a felek elérhetősége.

A **My claims** fülön a felhasználó saját igényléseit követheti. A **Handovers** fülön az őt érintő átadások listája és a megerősítés található.

## Használt technológiák

- Frontend: React, TypeScript, Vite, Tailwind CSS
- Backend: Java 21, Spring Boot, Spring Security, JWT, JPA, Flyway
- Adatbázis: PostgreSQL

## Jelenlegi korlátok

Nincs e-mail-ellenőrzés, jelszó-visszaállítás, refresh token, email/push értesítés, admin nézet, LLM kategória-javaslat, sem automatizált tesztek.
