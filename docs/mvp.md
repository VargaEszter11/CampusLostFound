# Campus Lost & Found – MVP dokumentáció

## Az alkalmazás célja

A Campus Lost & Found egy egyetemi elveszett tárgyak rendszer, amelynek célja, hogy egyetlen áttekinthető felületen tegye lehetővé az elveszett vagy megtalált tárgyak bejelentését, valamint a nyitott bejelentések átkereshető listázását, hogy a tárgy tulajdonosa és megtalálója egymásra találjon.

## A jelenlegi MVP funkciói

- új bejelentés létrehozása „Elveszett” vagy „Megtalált” típussal;
- a tárgy nevének, kategóriájának, leírásának, helyszínének és dátumának megadása;
- a bejelentő nevének és elérhetőségének rögzítése;
- a nyitott bejelentések listázása, szabadszavas kereséssel;
- a lista szűrése típus szerint: Mind / Elveszett / Megtalált;
- egy bejelentés részleteinek megtekintése felugró ablakban.

## Fő felületi elemek

A főoldal tetején két fül található: „Bejelentés” és „Nyitott bejelentések”. A „Bejelentés” fülön egy űrlap jelenik meg, tetején az Elveszett/Megtalált váltóval, alatta a tárgy és a bejelentő adataira vonatkozó mezőkkel. Beküldés után az alkalmazás automatikusan átvált a „Nyitott bejelentések” fülre. Ott egy keresőmező és három szűrőgomb (Mind / Elveszett / Megtalált) fölött jelennek meg a bejelentések kártyái, kizárólag a tárgy nevével, típusával és kategóriájával. Egy kártyára kattintva felugró ablakban jelenik meg a bejelentés minden további adata (leírás, helyszín, dátum, bejelentő neve és elérhetősége).

## Használt technológiák

- React
- TypeScript
- Vite
- Tailwind CSS

## Jelenlegi korlátok

Ez jelenleg kizárólag frontend prototípus. A létrehozott bejelentések a böngésző `localStorage`-ában tárolódnak, így túlélik az oldal újratöltését, de nem szinkronizálódnak böngészők vagy eszközök között, és elvesznek, ha törlik a webhely adatait. Nincs háttérrendszer, adatbázis, felhasználói bejelentkezés vagy API-kapcsolat. Az Igénylés és az Átadás jóváhagyása use case-ek még nincsenek megvalósítva.
