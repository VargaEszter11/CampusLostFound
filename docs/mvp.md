# Campus Lost & Found – MVP dokumentáció

## Az alkalmazás célja

A Campus Lost & Found egy egyetemi elveszett tárgyak rendszer, amelynek célja, hogy egyetlen áttekinthető felületen tegye lehetővé az elveszett vagy megtalált tárgyak bejelentését, a nyitott bejelentések átkereshető listázását, az igénylés benyújtását egy egyező bejelentésre, valamint az átadás jóváhagyását — hogy a tárgy tulajdonosa és megtalálója egymásra találjon, és a tárgy biztonságosan cseréljen gazdát.

## A jelenlegi MVP funkciói

- bejelentkezés egy néven keresztül (mock, jelszó nélkül);
- új bejelentés létrehozása „Elveszett” vagy „Megtalált” típussal;
- a tárgy nevének, kategóriájának, leírásának, helyszínének és dátumának megadása (a dátum csak a mai nap vagy korábbi lehet);
- a bejelentő neve a bejelentkezett felhasználóhoz van rögzítve, csak az elérhetőséget kell megadni;
- a nyitott bejelentések listázása, szabadszavas kereséssel;
- a lista szűrése típus szerint: Mind / Elveszett / Megtalált;
- egy bejelentés részleteinek megtekintése felugró ablakban;
- igénylés benyújtása egy nyitott bejelentésre (gomb szövege a bejelentés típusától függ: „This is mine” megtalált tárgynál, „Found it” elveszett tárgynál);
- a bejelentés tulajdonosa jóváhagyhatja vagy elutasíthatja a beérkezett igényléseket;
- a jóváhagyás és az átadás két külön lépés: jóváhagyáskor a rendszer generál egy 6 jegyű átadási kódot, felfedi a bejelentő és az igénylő elérhetőségét egymás előtt, és a többi függő igénylést automatikusan elutasítja — a bejelentés eddig a pontig még nyitva marad; a tulajdonos egy külön „Mark as handed over” gombbal zárja le, amikor a tárgy ténylegesen gazdát cserélt;
- a bejelentő elérhetősége rejtve marad az igénylők elől jóváhagyásig;
- a nyitott bejelentések listáján jelzés jelenik meg a tulajdonos számára, ha egy bejelentésre függő igénylés érkezett;
- „My claims” nézet: a felhasználó saját benyújtott igénylései, státusszal (Pending/Approved/Rejected); jóváhagyás után itt is megjelenik a bejelentő elérhetősége és az átadási kód, illetve hogy megtörtént-e már az átadás — ez akkor is elérhető marad, ha a bejelentés időközben lezárul;
- mezőszintű validáció: kötelező mezők, e-mail-cím vagy telefonszám formátum ellenőrzése az elérhetőség mezőknél, jövőbeli dátum tiltása — egységes stílusú, angol nyelvű hibaüzenetekkel;
- induláskor néhány minta bejelentés automatikusan létrejön, ha még nincs mentett adat.

## Fő felületi elemek

Belépéskor egy bejelentkező képernyő jelenik meg, ahol tetszőleges névvel vagy egy demó felhasználó gyors-választásával lehet folytatni. Bejelentkezés után a főoldal tetején három fül található: „Report”, „Open reports” és „My claims”. A „Report” fülön egy űrlap jelenik meg, tetején az Elveszett/Megtalált váltóval, alatta a tárgy adataira vonatkozó mezőkkel, egy egyedi (az app dark témájához illeszkedő) dátumválasztóval, és a bejelentő rögzített nevével/elérhetőségével. Beküldés után az alkalmazás automatikusan átvált az „Open reports” fülre. Ott egy keresőmező és három szűrőgomb (Mind / Elveszett / Megtalált) fölött jelennek meg a bejelentések kártyái, a tárgy nevével, típusával, kategóriájával, és — a tulajdonos számára — egy jelzéssel a függő igénylések számáról. Egy kártyára kattintva felugró ablakban jelenik meg a bejelentés minden további adata. Nem tulajdonosként itt lehet igénylést benyújtani; tulajdonosként itt láthatók és bírálhatók el (jóváhagyás/elutasítás) a beérkezett igénylések. Jóváhagyás után egy köztes állapot jelenik meg az átadási kóddal és az igénylő elérhetőségével, itt tudja a tulajdonos megerősíteni, hogy a tárgy ténylegesen átadásra került. A „My claims” fülön a felhasználó nyomon követheti a saját igényléseit: PENDING állapotban csak a státusz látszik, APPROVED állapotban a bejelentő elérhetősége és az átadási kód is, függetlenül attól, hogy a hozzá tartozó bejelentés még nyitva van-e vagy már lezárult.

## Használt technológiák

- React
- TypeScript
- Vite
- Tailwind CSS

## Jelenlegi korlátok

Ez jelenleg kizárólag frontend prototípus. A létrehozott bejelentések, igénylések és átadások a böngésző `localStorage`-ában tárolódnak, így túlélik az oldal újratöltését, de nem szinkronizálódnak böngészők vagy eszközök között, és elvesznek, ha törlik a webhely adatait. Nincs háttérrendszer, adatbázis vagy API-kapcsolat. A bejelentkezés mock: nincs jelszó, nincs szerver oldali ellenőrzés, és a felületen tiltott műveletek (pl. mások bejelentésének jóváhagyása) a store függvények közvetlen hívásával megkerülhetők — valódi jogosultságkezeléshez backend szükséges.
