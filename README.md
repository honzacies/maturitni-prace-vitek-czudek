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
| `app/hero.tsx` | Titulní strana. |
| `app/hero-view.tsx` | Přepínač Fotografie / 3D model, sdílený hover, legenda. |
| `app/build3d.tsx` | 3D scéna sestavy (Three.js, načítá se až po přepnutí). |
| `lib/parts.ts` | Díly sestavy — souřadnice na fotce i geometrie pro 3D. |
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

## Díly sestavy

`lib/parts.ts` popisuje sestavu jednou a používá se dvakrát: jako popisky nad
titulní fotkou a jako geometrie ve 3D scéně. U každého dílu je název, kapitola
práce, volitelná pozice na fotce (v procentech) a kvádry se skutečnými rozměry
komponenty.

Souřadnice popisků platí jen pro konkrétní fotku (`COVER_IMAGE`) — když se
v dokumentu změní první obrázek, popisky se samy vypnou a zbude čistá fotka.
3D scéna na fotce nezávisí.

### 3D model

Přepínač nad obrázkem přepne fotku za interaktivní model sestavy: skříň, deska,
procesor, chladič, paměti, zdroj, grafická a síťová karta. Táhnutím se otáčí,
kolečkem přibližuje, tlačítko rozloží sestavu do exploded view.

Najetí na díl v legendě (nebo na díl přímo ve scéně) ho povysune ze slotu,
zvýrazní zlatě a **rozsvítí konektor na desce, do kterého patří** — patici AM4,
sloty DIMM, M.2, PCIe x16 nebo x1. Zároveň se zprůhlední bočnice, aby bylo
dovnitř vidět. Kliknutí vede na kapitolu o montáži toho dílu.

Pod scénou se přitom vypíše, co je to za konkrétní komponentu — model
a parametry. Nejsou nikde přepsané: `Hero` je páruje s tabulkou sestavy
z dokumentu přes `specKey` v `lib/parts.ts` (např. `"grafika"` najde řádek
„Grafika (GPU)"). Když se tabulka změní, karta se změní s ní; když se díl
v tabulce nenajde (chladič tam není), napíše se to.

Model je schéma, ne fotorealistický render — díly jsou kvádry v reálných
poměrech, ne 3D modely konkrétních komponent. Souřadnicová soustava a rozměry
jsou popsané v hlavičce `lib/parts.ts`.

Three.js se stahuje až ve chvíli, kdy na 3D přepneš (`next/dynamic`, `ssr: false`),
takže titulní stranu nezpomaluje.

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
