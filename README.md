# Skladba Počítače — maturitní práce

Next.js (App Router) + TypeScript. Maturitní práce Vítka Czudka jako čitelná
dokumentace: titulní strana s anotovanou fotkou komponent, obsah se scrollspy,
tabulka sestavy, lightbox na fotky, světlý i tmavý režim, tisk do PDF.
Vykresluje se staticky, žádný server ani databáze.

## Jak to je poskládané

| Cesta | K čemu |
| --- | --- |
| `scripts/build-content.ts` | Přečte `.docx` a vygeneruje `content/thesis.json` + `public/images/`. |
| `content/thesis.json` | Obsah práce jako data. Generovaný — needituj ručně. |
| `lib/thesis.ts` | Typy obsahu (`Block`, `Inline`, `Picture`, `Thesis`). |
| `app/hero.tsx` | Titulní strana s popisky nad fotkou komponent. |
| `app/page.tsx` | Vykreslí jednotlivé bloky dokumentu. |
| `app/nav.tsx` | Obsah se scrollspy, přepínač motivu, mobilní rozbalení. |
| `app/lightbox.tsx` | Zvětšení fotky v `<dialog>`. |
| `app/globals.css`, `app/thesis.module.css` | Barvy a rozvržení. |

## Vývoj

```bash
npm install
npm run dev
```

Po úpravě `.docx` přegeneruj obsah:

```bash
npm run content
```

Jiný soubor: `npm run content -- cesta/k/praci.docx`.

## Na co si dát pozor při úpravách dokumentu

Word dokument nemá strojově čitelnou strukturu, takže `build-content.ts` ji
odvozuje ze **stylů odstavců**: `Nad1`–`Nad3` jsou nadpisy (číslování si
dopočítá sám), `Nadneislovan` je nečíslovaný nadpis, `Titulek` je popisek
obrázku, `Odstavecseseznamem` je odrážka. Odstavec `ÚVOD` odděluje titulní
stranu od těla práce.

Když se tyhle styly ve Wordu rozbijí, obsah by se tiše vytratil — proto
generátor na konci kontroluje, že vyšly aspoň čtyři kapitoly, tabulka sestavy,
titulní fotka a rozumný počet bloků, a jinak spadne s chybou. Pokud takovou
chybu uvidíš, oprav styly v dokumentu, ne kontrolu.

## Popisky na titulní fotce

`app/hero.tsx` drží seznam `CALLOUTS`: souřadnice v procentech fotky, název dílu
a kapitola, na kterou popisek odkazuje. Čísla 01–07 jdou v pořadí montáže.
Souřadnice platí jen pro konkrétní fotku (`image2.jpeg`) — když se v dokumentu
změní první obrázek, popisky se samy vypnou a zbude čistá fotka.

## Nasazení na Vercel

Standardní Next.js projekt, Vercel ho detekuje sám — build command i output
directory nech výchozí.

```bash
npx vercel --prod
```

Nebo nahraj repozitář na GitHub a naimportuj ho ve Vercel dashboardu.
`content/thesis.json` a `public/images/` musí být v gitu, build je negeneruje.

## Design

Barvy a typografie vychází z osazené desky: tmavá nepájivá maska, bílý
silkscreen popis, zlacené kontakty. Písma — `Archivo` (nadpisy, široký řez),
`Source Serif 4` (text, písmo kreslené pro technickou dokumentaci),
`IBM Plex Mono` (čísla kapitol, specifikace, popisky).

Světlý režim je záměrně bílý „datasheet" — na projektoru se tmavé téma vymývá.
Přepínač je dole v obsahu, volba se pamatuje. Tisk (`Ctrl+P`) použije světlé
barvy, schová obsah a k odkazům dopíše jejich URL.
